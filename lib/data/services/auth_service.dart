import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../models/app_user.dart';
import 'photo_service.dart';

final _googleSignIn = GoogleSignIn(
    clientId:
        '513859324827-q9kec51te7cifs6t3bmvratg69h3et21.apps.googleusercontent.com',
    scopes: ['email', 'profile']);

class AuthService {
  AuthService();

  final _auth = fb.FirebaseAuth.instance;
  final _firestore = FirebaseFirestore.instance;

  AppUser? _cachedUser;

  bool get isLoggedIn => _auth.currentUser != null;
  AppUser? get currentUser => _cachedUser;
  String? get accessToken => null;

  Stream<fb.User?> get authStateChanges => _auth.authStateChanges();

  Future<void> loadCurrentUser() async {
    final user = _auth.currentUser;
    if (user == null) {
      _cachedUser = null;
      return;
    }

    try {
      final docSnap =
          await _firestore.collection('profiles').doc(user.uid).get();
      if (docSnap.exists) {
        _cachedUser = AppUser.fromFirestore(docSnap.data() ?? {}, user);
      } else {
        _cachedUser = AppUser(
          id: user.uid,
          name: user.displayName ?? '',
          email: user.email ?? '',
          createdAt: DateTime.now(),
          verified: user.emailVerified,
        );
      }
    } catch (_) {
      _cachedUser = AppUser(
        id: user.uid,
        name: user.displayName ?? '',
        email: user.email ?? '',
        createdAt: DateTime.now(),
        verified: user.emailVerified,
      );
    }
  }

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
    final userCred = await _auth.createUserWithEmailAndPassword(
      email: email.trim(),
      password: password,
    );

    final uid = userCred.user!.uid;
    await _firestore.collection('profiles').doc(uid).set({
      'name': name.trim(),
      'email': email.trim(),
      'gender': gender,
      'heightCm': height?.toInt(),
      'bio': bio?.trim(),
      'intention': intention?.toString(),
      'location': location,
      'interests': interests,
      'photos': [],
      'isFaceVerified': false,
      'updatedAt': FieldValue.serverTimestamp(),
    });

    _cachedUser = AppUser(
      id: uid,
      name: name.trim(),
      email: email.trim(),
      createdAt: DateTime.now(),
      verified: false,
      gender: gender,
      height: height,
      bio: bio?.trim(),
      intention: intention,
      location: location,
      interests: interests,
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

  Future<AppUser> loginWithGoogle() async {
    final googleAccount = await _googleSignIn.signIn();
    if (googleAccount == null) throw Exception('Google sign-in cancelled');

    final googleAuth = await googleAccount.authentication;
    final credential = fb.GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    final userCred = await _auth.signInWithCredential(credential);
    final uid = userCred.user!.uid;

    final docSnap = await _firestore.collection('profiles').doc(uid).get();
    if (!docSnap.exists) {
      await _firestore.collection('profiles').doc(uid).set({
        'name': googleAccount.displayName ?? '',
        'email': googleAccount.email,
        'gender': null,
        'heightCm': null,
        'bio': null,
        'intention': null,
        'location': null,
        'interests': [],
        'photos': [],
        'isFaceVerified': false,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }

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
    final uid = userCred.user!.uid;

    final docSnap = await _firestore.collection('profiles').doc(uid).get();
    if (!docSnap.exists) {
      await _firestore.collection('profiles').doc(uid).set({
        'name': credential.givenName ?? credential.familyName ?? '',
        'email': credential.email ?? '',
        'gender': null,
        'heightCm': null,
        'bio': null,
        'intention': null,
        'location': null,
        'interests': [],
        'photos': [],
        'isFaceVerified': false,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }

    await loadCurrentUser();
    return _cachedUser!;
  }

  Future<void> forgotPassword(String email) async {
    await _auth.sendPasswordResetEmail(email: email.trim());
  }

  Future<AppUser> updateUser(AppUser user) async {
    if (_auth.currentUser == null) throw Exception('Not logged in');

    await _firestore.collection('profiles').doc(user.id).update({
      'name': user.name,
      'email': user.email,
      'gender': user.gender,
      'heightCm': user.height?.toInt(),
      'bio': user.bio,
      'intention': user.intention?.toString(),
      'location': user.location,
      'interests': user.interests,
      'photos': user.photos ?? [],
      'isFaceVerified': user.isFaceVerified ?? false,
      'updatedAt': FieldValue.serverTimestamp(),
    });

    _cachedUser = user;
    return user;
  }

  Future<List<String>> addPhotos(String uid, List<String> localPaths) async {
    final urls = await PhotoService.uploadAll(uid, localPaths);
    final current = _cachedUser?.photos ?? [];
    final merged = [...current, ...urls];
    await _firestore.collection('profiles').doc(uid).update({
      'photos': merged,
      'updatedAt': FieldValue.serverTimestamp(),
    });
    _cachedUser = _cachedUser?.copyWith(photos: merged);
    return urls;
  }

  Future<void> deletePhoto(String uid, String downloadUrl) async {
    await PhotoService.deleteFromStorage(downloadUrl);
    final updated =
        (_cachedUser?.photos ?? []).where((u) => u != downloadUrl).toList();
    await _firestore.collection('profiles').doc(uid).update({
      'photos': updated,
      'updatedAt': FieldValue.serverTimestamp(),
    });
    _cachedUser = _cachedUser?.copyWith(photos: updated);
  }

  Future<void> logout() async {
    await _googleSignIn.signOut();
    await _auth.signOut();
    _cachedUser = null;
  }
}

class NearMeAuthException implements Exception {
  final String message;
  NearMeAuthException(this.message);

  @override
  String toString() => message;
}
