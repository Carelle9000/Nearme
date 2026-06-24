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

      // ✅ Vérifier si vérification d'âge est nécessaire
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

  /// Vérifier si la vérification d'âge est nécessaire
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

    // Besoin de vérification si: age < 20 ET pas encore vérifié
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
    await _firestore.collection('profiles').doc(uid).set({
      'name': name.trim(),
      'email': email.trim(),
      'photos': [],
      'isFaceVerified': false,
      'isAgeVerified': false,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });

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
        'photos': [],
        'isFaceVerified': false,
        'isAgeVerified': false,
        'createdAt': FieldValue.serverTimestamp(),
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
        'photos': [],
        'isFaceVerified': false,
        'isAgeVerified': false,
        'createdAt': FieldValue.serverTimestamp(),
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

    await _firestore
        .collection('profiles')
        .doc(user.id)
        .update(user.toFirestore());

    _cachedUser = user;
    _checkAgeVerificationNeeded();
    return user;
  }

  Future<bool> toggleFavorite(String targetUserId) async {
    if (_cachedUser == null) return false;

    final userRef = _firestore.collection('profiles').doc(_cachedUser!.id);
    final favRef = userRef.collection('favorites').doc(targetUserId);

    final currentFavorites = List<String>.from(_cachedUser!.favorites);
    bool isRemoving = currentFavorites.contains(targetUserId);

    if (isRemoving) {
      currentFavorites.remove(targetUserId);
      await favRef.delete();
      await userRef.update({
        'favorites': FieldValue.arrayRemove([targetUserId]),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } else {
      currentFavorites.add(targetUserId);
      await favRef.set({'timestamp': FieldValue.serverTimestamp()});
      await userRef.update({
        'favorites': FieldValue.arrayUnion([targetUserId]),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }

    _cachedUser = _cachedUser!.copyWith(favorites: currentFavorites);
    return isRemoving; // Return whether we removed it
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

  /// Reload user data from Firestore (used after age verification)
  Future<void> refreshCurrentUser() async {
    final user = _auth.currentUser;
    if (user == null) {
      _cachedUser = null;
      _needsAgeVerification = false;
      return;
    }

    try {
      final docSnap =
          await _firestore.collection('profiles').doc(user.uid).get();
      if (docSnap.exists) {
        _cachedUser = AppUser.fromFirestore(docSnap.data() ?? {}, user);
      }
      _checkAgeVerificationNeeded();
    } catch (_) {
      // Silent fail — keep existing cache
    }
  }

  Future<void> updatePresence(bool isOnline) async {
    final user = _auth.currentUser;
    if (user == null) return;

    await _firestore.collection('profiles').doc(user.uid).update({
      'isOnline': isOnline,
      'lastSeen': FieldValue.serverTimestamp(),
    });

    if (_cachedUser != null && _cachedUser!.id == user.uid) {
      _cachedUser = _cachedUser!.copyWith(
        isOnline: isOnline,
        lastSeen: DateTime.now(),
      );
    }
  }

  Future<void> logout() async {
    try {
      await updatePresence(false);
    } catch (_) {}
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
