import 'package:flutter/foundation.dart';

import '../../data/models/app_user.dart';
import '../../data/services/auth_service.dart';
import '../../data/services/photo_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _service;
  AppUser? _user;
  bool _busy = false;
  bool _uploadingPhotos = false;
  String? _error;

  AuthProvider(this._service) {
    _user = _service.currentUser;
  }

  AppUser? get user             => _user;
  bool get isLoggedIn           => _user != null && _service.isLoggedIn;
  bool get busy                 => _busy;
  bool get uploadingPhotos      => _uploadingPhotos;
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

  Future<bool> loginWithGoogle() => _run(() => _service.loginWithGoogle());

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

  Future<void> updateProfile(AppUser updatedUser) async {
    await _run(() => _service.updateUser(updatedUser));
  }

  Future<void> updateBio(String bio) async {
    if (_user == null) return;
    await _run(() => _service.updateUser(_user!.copyWith(bio: bio)));
  }

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

  Future<void> addPhotos(List<String> localPaths) async {
    if (_user == null) return;
    _uploadingPhotos = true;
    _error = null;
    notifyListeners();
    try {
      await _service.addPhotos(_user!.id, localPaths);
      _user = _service.currentUser;
    } catch (e) {
      _error = e.toString();
    } finally {
      _uploadingPhotos = false;
      await PhotoService.clearLocalPhotos();
      notifyListeners();
    }
  }

  Future<void> deletePhoto(String downloadUrl) async {
    if (_user == null) return;
    try {
      await _service.deletePhoto(_user!.id, downloadUrl);
      _user = _service.currentUser;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
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

  Future<void> updatePresence(bool isOnline) async {
    await _service.updatePresence(isOnline);
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
