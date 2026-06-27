import 'package:flutter/foundation.dart';

import '../../data/models/app_user.dart';
import '../../data/services/auth_service.dart';

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

  // Note: Photo management is handled via PhotoService directly

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
