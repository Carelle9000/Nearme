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

  AppUser? get user      => _user;
  bool get isLoggedIn    => _user != null && _service.isLoggedIn;
  bool get busy          => _busy;
  String? get error      => _error;
  String? get accessToken => _service.accessToken;

  // ── Auth ────────────────────────────────────────────────────────────────────

  Future<bool> login(String email, String password) => _run(
        () => _service.login(email: email, password: password),
      );

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    String? gender,
    double? height,
    String? bio,
    Intention? intention,
    String? location,
    List<String> interests = const [],
  }) =>
      _run(() => _service.register(
            name:      name,
            email:     email,
            password:  password,
            gender:    gender,
            height:    height,
            bio:       bio,
            intention: intention,
            location:  location,
            interests: interests,
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

  Future<void> updateBio(String bio) async {
    if (_user == null) return;
    await _run(() => _service.updateUser(_user!.copyWith(bio: bio)));
  }

  Future<void> logout() async {
    await _service.logout();
    _user = null;
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
