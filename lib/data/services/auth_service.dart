import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../../core/config/app_config.dart';
import '../models/app_user.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Clés de stockage
// Tokens sensibles → flutter_secure_storage (Keychain/Keystore)
// Données de profil non-sensibles → SharedPreferences (pas de secret)
// ─────────────────────────────────────────────────────────────────────────────

const _kAccessToken  = 'auth_access_token';
const _kRefreshToken = 'auth_refresh_token';
const _kProfileJson  = 'auth_profile_json'; // SharedPreferences (non-sensible)

// GoogleSignIn est configuré avec les scopes minimaux nécessaires.
// Le clientId Web est requis pour Flutter Web ; sur Android/iOS il est
// tiré automatiquement de google-services.json / GoogleService-Info.plist.
final _googleSignIn = GoogleSignIn(
  clientId: kIsWeb ? AppConfig.googleWebClientId : null,
  scopes: ['email', 'profile'],
);

// ─────────────────────────────────────────────────────────────────────────────
// AuthService
// ─────────────────────────────────────────────────────────────────────────────

class AuthService {
  AuthService._(this._prefs, this._secure);

  final SharedPreferences _prefs;
  final FlutterSecureStorage _secure;

  // Tokens mis en cache en mémoire après lecture asynchrone au démarrage.
  String? _accessToken;
  String? _refreshToken;

  AppUser? _cachedUser;

  // ── Factory ────────────────────────────────────────────────────────────────

  static Future<AuthService> create(SharedPreferences prefs) async {
    const secure = FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
      iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
    );
    final service = AuthService._(prefs, secure);
    await service._restoreSession();
    return service;
  }

  // ── Getters publics ────────────────────────────────────────────────────────

  bool get isLoggedIn  => _cachedUser != null && _accessToken != null;
  AppUser? get currentUser => _cachedUser;
  String? get accessToken  => _accessToken;

  // ── Auth email ─────────────────────────────────────────────────────────────

  Future<AppUser> register({
    required String name,
    required String email,
    required String password,
    String? gender,
    double? height,
    String? bio,
    Intention? intention,
    String? location,
    List<String> interests = const [],
  }) async {
    _validateCredentials(name: name, email: email, password: password);

    final res = await _post('/auth/register', {
      'name': name.trim(), 'email': email.trim(), 'password': password,
    });
    await _saveTokens(res);

    final appUser = AppUser(
      id:          res['user_id'] as String,
      name:        name.trim(),
      email:       email.trim(),
      createdAt:   DateTime.now(),
      gender:      gender,
      height:      height,
      bio:         bio?.trim(),
      intention:   intention,
      location:    location,
      interests:   interests,
      photos:      const [],
      isFaceVerified: false,
    );
    _cachedUser = appUser;
    await _saveProfile(appUser);
    return appUser;
  }

  Future<AppUser> login({
    required String email,
    required String password,
  }) async {
    if (email.trim().isEmpty || password.isEmpty) {
      throw const NearMeAuthException('Email and password are required');
    }

    final res = await _post('/auth/login', {
      'email': email.trim(), 'password': password,
    });
    await _saveTokens(res);

    final userId      = res['user_id'] as String;
    final profileData = res['profile'] as Map<String, dynamic>?;

    final appUser = profileData != null
        ? _userFromRemoteProfile(userId, email.trim(), profileData)
        : AppUser(
            id: userId, name: '', email: email.trim(),
            createdAt: DateTime.now(), interests: const [], photos: const [],
          );

    _cachedUser = appUser;
    await _saveProfile(appUser);
    return appUser;
  }

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  //
  // Flux :
  //   1. Flutter demande le consentement Google (UI native)
  //   2. On envoie l'idToken au backend NestJS
  //   3. Le backend vérifie l'idToken via l'API Google tokeninfo
  //   4. Le backend crée/retrouve l'utilisateur et renvoie nos JWT NearMe

  Future<AppUser> loginWithGoogle() async {
    GoogleSignInAccount? googleUser;
    try {
      googleUser = await _googleSignIn.signIn();
    } catch (e) {
      throw NearMeAuthException('Google Sign-In failed: $e');
    }

    if (googleUser == null) {
      throw const NearMeAuthException('Google sign-in cancelled');
    }

    final auth = await googleUser.authentication;
    final idToken = auth.idToken;
    if (idToken == null) {
      throw const NearMeAuthException('Could not obtain Google ID token');
    }

    final res = await _post('/auth/google', {'id_token': idToken});
    await _saveTokens(res);

    final userId      = res['user_id'] as String;
    final profileData = res['profile'] as Map<String, dynamic>?;

    final appUser = profileData != null
        ? _userFromRemoteProfile(userId, googleUser.email, profileData)
        : AppUser(
            id:        userId,
            name:      googleUser.displayName ?? '',
            email:     googleUser.email,
            createdAt: DateTime.now(),
            interests: const [],
            photos:    const [],
          );

    _cachedUser = appUser;
    await _saveProfile(appUser);
    return appUser;
  }

  // ── Apple Sign-In ──────────────────────────────────────────────────────────
  //
  // Flux :
  //   1. Flutter demande le consentement Apple (UI native iOS/macOS)
  //   2. On envoie l'identityToken au backend NestJS
  //   3. Le backend vérifie via les clés publiques Apple (JWKS)
  //   4. Le backend crée/retrouve l'utilisateur et renvoie nos JWT NearMe
  //
  // NOTE : Apple ne retourne l'email qu'à la première connexion.
  //        Le backend doit donc stocker l'email lors de la création.

  Future<AppUser> loginWithApple() async {
    AuthorizationCredentialAppleID credential;
    try {
      credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code == AuthorizationErrorCode.canceled) {
        throw const NearMeAuthException('Apple sign-in cancelled');
      }
      throw NearMeAuthException('Apple Sign-In failed: ${e.message}');
    }

    final identityToken = credential.identityToken;
    if (identityToken == null) {
      throw const NearMeAuthException('Could not obtain Apple identity token');
    }

    final fullName = [credential.givenName, credential.familyName]
        .where((s) => s != null && s.isNotEmpty)
        .join(' ');

    final res = await _post('/auth/apple', {
      'identity_token': identityToken,
      if (credential.email != null) 'email': credential.email,
      if (fullName.isNotEmpty) 'name': fullName,
    });
    await _saveTokens(res);

    final userId      = res['user_id'] as String;
    final email       = (res['email'] as String?) ?? credential.email ?? '';
    final profileData = res['profile'] as Map<String, dynamic>?;

    final appUser = profileData != null
        ? _userFromRemoteProfile(userId, email, profileData)
        : AppUser(
            id:        userId,
            name:      fullName,
            email:     email,
            createdAt: DateTime.now(),
            interests: const [],
            photos:    const [],
          );

    _cachedUser = appUser;
    await _saveProfile(appUser);
    return appUser;
  }

  // ── Forgot password ────────────────────────────────────────────────────────

  Future<void> forgotPassword(String email) async {
    if (email.trim().isEmpty) {
      throw const NearMeAuthException('Please enter your email address');
    }
    await _post('/auth/forgot-password', {'email': email.trim()});
  }

  // ── Mise à jour profil ─────────────────────────────────────────────────────

  Future<AppUser> updateUser(AppUser updated) async {
    _cachedUser = updated;
    await _saveProfile(updated);
    if (_accessToken != null) {
      unawaited(_post('/profile/update', updated.toJson())
          .catchError((_) => <String, dynamic>{}));
    }
    return updated;
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  Future<void> logout() async {
    // Révoquer la session Google si active
    if (await _googleSignIn.isSignedIn()) {
      await _googleSignIn.signOut();
    }
    // Effacer tokens sécurisés
    await _secure.delete(key: _kAccessToken);
    await _secure.delete(key: _kRefreshToken);
    // Effacer profil non-sensible
    await _prefs.remove(_kProfileJson);
    _accessToken  = null;
    _refreshToken = null;
    _cachedUser   = null;
  }

  // ── Session restore ───────────────────────────────────────────────────────

  Future<void> _restoreSession() async {
    _accessToken  = await _secure.read(key: _kAccessToken);
    _refreshToken = await _secure.read(key: _kRefreshToken);

    if (_accessToken == null) return;

    try {
      final exp = JwtDecoder.getExpirationDate(_accessToken!);
      if (exp.difference(DateTime.now()) < const Duration(minutes: 5)) {
        final ok = await _refreshAccessToken();
        if (!ok) return;
      }
    } catch (_) {
      await logout();
      return;
    }

    final raw = _prefs.getString(_kProfileJson);
    if (raw == null) return;
    try {
      _cachedUser = AppUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      await logout();
    }
  }

  Future<bool> _refreshAccessToken() async {
    if (_refreshToken == null) return false;
    try {
      final res = await _post(
        '/auth/refresh', {'refresh_token': _refreshToken},
      );
      await _saveTokens(res);
      return true;
    } catch (_) {
      await logout();
      return false;
    }
  }

  // ── Helpers privés ────────────────────────────────────────────────────────

  Future<void> _saveTokens(Map<String, dynamic> res) async {
    final access  = res['access_token']  as String?;
    final refresh = res['refresh_token'] as String?;

    if (access != null) {
      // Stockage sécurisé (Keychain iOS / Keystore Android)
      await _secure.write(key: _kAccessToken,  value: access);
      _accessToken = access;
    }
    if (refresh != null) {
      await _secure.write(key: _kRefreshToken, value: refresh);
      _refreshToken = refresh;
    }
  }

  Future<void> _saveProfile(AppUser user) =>
      _prefs.setString(_kProfileJson, jsonEncode(user.toJson()));

  AppUser _userFromRemoteProfile(
      String userId, String email, Map<String, dynamic> r) =>
      AppUser(
        id:       userId,
        name:     r['name']     as String? ?? '',
        email:    email,
        createdAt: DateTime.now(),
        gender:   r['gender']   as String?,
        height:   (r['height_cm'] as num?)?.toDouble(),
        bio:      r['bio']      as String?,
        intention: r['intention'] != null
            ? Intention.values.byName(r['intention'] as String)
            : null,
        location:  r['location'] as String?,
        interests: List<String>.from(r['interests'] as List? ?? []),
        photos:    List<String>.from(r['photos']    as List? ?? []),
        isFaceVerified: r['is_face_verified'] as bool? ?? false,
      );

  Future<Map<String, dynamic>> _post(
      String path, Map<String, dynamic>? body) async {
    final res = await http.post(
      Uri.parse('${AppConfig.serverUrl}$path'),
      headers: {
        'Content-Type': 'application/json',
        if (_accessToken != null) 'Authorization': 'Bearer $_accessToken',
      },
      body: jsonEncode(body ?? {}),
    ).timeout(const Duration(seconds: 20));

    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode >= 400) {
      throw NearMeAuthException(
          data['message'] as String? ??
          data['error']   as String? ??
          'Request failed (${res.statusCode})');
    }
    return data;
  }

  static void _validateCredentials({
    String name = '',
    required String email,
    required String password,
  }) {
    if (name.isNotEmpty && name.trim().isEmpty) {
      throw const NearMeAuthException('Name cannot be blank');
    }
    if (email.trim().isEmpty) {
      throw const NearMeAuthException('Email is required');
    }
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email.trim())) {
      throw const NearMeAuthException('Invalid email format');
    }
    if (password.length < 8) {
      throw const NearMeAuthException('Password must be at least 8 characters');
    }
  }
}

class NearMeAuthException implements Exception {
  final String message;
  const NearMeAuthException(this.message);
  @override
  String toString() => message;
}
