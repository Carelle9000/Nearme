import 'package:flutter/foundation.dart';

import '../../data/models/app_user.dart';
import '../../data/services/auth_service.dart';
import '../../data/services/photo_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _service;
  AppUser? _user;
  bool _busy = false;
  String? _error;

  AuthProvider(this._service) {
    _user = _service.currentUser;
  }

  AppUser? get user             => _user;
  bool get isLoggedIn           => _user != null && _service.isLoggedIn;
  bool get busy                 => _busy;
  String? get error             => _error;
  bool get needsAgeVerification   => _service.needsAgeVerification;
  String? get accessToken       => _service.accessToken;

  // ── Auth ────────────────────────────────────────────────────────────────────

  Future<bool> login(String email, String password) => _run(
        () => _service.login(email: email, password: password),
      );

  Future<bool> register({
    required String name,
    required String email,
    required String password,
  }) =>
      _run(() => _service.register(
            name:      name,
            email:     email,
            password:  password,
          ));

  Future<bool> loginWithApple() => _run(() => _service.loginWithApple());

  Future<bool> forgotPassword(String email) async {
    _busy  = true;
    _error = null;
    notifyListeners();
    try {
      await _service.forgotPassword(email);
      return true;
    } on NearMeAuthException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  // Note: Profile updates are handled via Firebase directly
  // Local user cache is maintained in-memory

  Future<void> toggleFavorite(String targetUserId) async {
    if (_user == null) return;
    try {
      await _service.toggleFavorite(targetUserId);
      _user = _service.currentUser;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> updateProfile(AppUser user) async {
    _user = user;
    notifyListeners();
  }

  Future<void> addPhotos(List<String> localPaths) async {
    if (_user == null) return;
    try {
      final uploadedUrls = await PhotoService.uploadAll(_user!.id, localPaths);
      final currentPhotos = List<String>.from(_user?.photos ?? []);
      currentPhotos.addAll(uploadedUrls);

      _user = _user!.copyWith(photos: currentPhotos);
      notifyListeners();
    } catch (e) {
      _error = 'Failed to upload photos: $e';
      notifyListeners();
      rethrow;
    }
  }

  Future<void> replaceMainPhoto(String localPath) async {
    if (_user == null) return;
    try {
      final newPhotoUrl = await PhotoService.uploadToStorage(_user!.id, localPath, 0);
      final currentPhotos = List<String>.from(_user?.photos ?? []);

      currentPhotos.removeWhere((url) => url == newPhotoUrl);
      currentPhotos.insert(0, newPhotoUrl);

      _user = _user!.copyWith(photos: currentPhotos);
      notifyListeners();
    } catch (e) {
      _error = 'Failed to update main photo: $e';
      notifyListeners();
      rethrow;
    }
  }

  Future<void> deletePhoto(String downloadUrl) async {
    if (_user == null) return;
    try {
      await PhotoService.deleteFromStorage(downloadUrl);
      final currentPhotos = List<String>.from(_user?.photos ?? []);
      currentPhotos.remove(downloadUrl);

      _user = _user!.copyWith(photos: currentPhotos);
      notifyListeners();
    } catch (e) {
      _error = 'Failed to delete photo: $e';
      notifyListeners();
      rethrow;
    }
  }

  Future<void> updatePresence(bool isOnline) async {
    if (_user == null) return;
    _user = _user!.copyWith(isOnline: isOnline);
    notifyListeners();
  }

  Future<void> logout() async {
    await _service.logout();
    _user = null;
    notifyListeners();
  }

  Future<void> refresh() async {
    await _service.refreshCurrentUser();
    _user = _service.currentUser;
    notifyListeners();
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  Future<bool> _run(Future<AppUser> Function() action) async {
    _busy  = true;
    _error = null;
    notifyListeners();
    try {
      _user = await action();
      return true;
    } on NearMeAuthException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }
}
