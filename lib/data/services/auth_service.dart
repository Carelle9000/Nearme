import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../models/app_user.dart';

class AuthService {
  AuthService();

  final _auth = fb.FirebaseAuth.instance;

  AppUser? _cachedUser;
  bool _needsAgeVerification = false;

  bool get isLoggedIn => _auth.currentUser != null;
  AppUser? get currentUser => _cachedUser;
  String? get accessToken => null;
  bool get needsAgeVerification => _needsAgeVerification;

  Stream<fb.User?> get authStateChanges => _auth.authStateChanges();

  Future<void> loadCurrentUser() async {
    final user = _auth.currentUser;
    if (user == null) {
      _cachedUser = null;
      _needsAgeVerification = false;
      return;
    }

    try {
      _cachedUser = AppUser(
        id: user.uid,
        name: user.displayName ?? '',
        email: user.email ?? '',
        createdAt: DateTime.now(),
        verified: user.emailVerified,
      );
      _checkAgeVerificationNeeded();
    } catch (_) {
      _cachedUser = AppUser(
        id: user.uid,
        name: user.displayName ?? '',
        email: user.email ?? '',
        createdAt: DateTime.now(),
        verified: user.emailVerified,
      );
      _checkAgeVerificationNeeded();
    }
  }

  void _checkAgeVerificationNeeded() {
    if (_cachedUser == null) {
      _needsAgeVerification = false;
      return;
    }

    final birthDate = _cachedUser!.birthDate;
    final isAgeVerified = _cachedUser!.isAgeVerified;

    if (birthDate == null) {
      _needsAgeVerification = false;
      return;
    }

    final age = _calculateAge(birthDate);
    _needsAgeVerification = age < 20 && !isAgeVerified;
  }

  int _calculateAge(DateTime birthDate) {
    final today = DateTime.now();
    int age = today.year - birthDate.year;
    if (today.month < birthDate.month ||
        (today.month == birthDate.month && today.day < birthDate.day)) {
      age--;
    }
    return age;
  }

  Future<AppUser> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final userCred = await _auth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );

    final uid = userCred.user!.uid;

    _cachedUser = AppUser(
      id: uid,
      name: name.trim(),
      email: email.trim(),
      createdAt: DateTime.now(),
      verified: false,
    );

    return _cachedUser!;
  }

  Future<AppUser> login(
      {required String email, required String password}) async {
    await _auth.signInWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );
    await loadCurrentUser();
    return _cachedUser!;
  }

  Future<AppUser> loginWithApple() async {
    final credential = await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName
      ],
    );

    final oauthCredential = fb.OAuthProvider('apple.com').credential(
      idToken: credential.identityToken,
    );

    final userCred = await _auth.signInWithCredential(oauthCredential);

    _cachedUser = AppUser(
      id: userCred.user!.uid,
      name: credential.givenName ?? credential.familyName ?? '',
      email: credential.email ?? '',
      createdAt: DateTime.now(),
      verified: userCred.user!.emailVerified,
    );

    return _cachedUser!;
  }

  Future<void> forgotPassword(String email) async {
    await _auth.sendPasswordResetEmail(email: email.trim());
  }

  Future<bool> toggleFavorite(String targetUserId) async {
    if (_cachedUser == null) return false;

    final currentFavorites = List<String>.from(_cachedUser!.favorites);
    bool isRemoving = currentFavorites.contains(targetUserId);

    if (isRemoving) {
      currentFavorites.remove(targetUserId);
    } else {
      currentFavorites.add(targetUserId);
    }

    _cachedUser = _cachedUser!.copyWith(favorites: currentFavorites);
    return isRemoving;
  }

  Future<void> logout() async {
    await _auth.signOut();
    _cachedUser = null;
    _needsAgeVerification = false;
  }

  Future<void> refreshCurrentUser() async {
    await loadCurrentUser();
  }
}

class NearMeAuthException implements Exception {
  final String message;
  NearMeAuthException(this.message);

  @override
  String toString() => message;
}
