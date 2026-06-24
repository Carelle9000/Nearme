import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../data/models/profile.dart';
import '../../data/services/user_service.dart';

class FavoritesProvider extends ChangeNotifier {
  final UserService _userService = UserService();

  List<Profile> _favorites = [];
  bool _isLoading = false;

  List<Profile> get favorites => List.unmodifiable(_favorites);
  bool get isLoading => _isLoading;

  Future<void> loadFavorites(String userId) async {
    _isLoading = true;
    notifyListeners();

    try {
      _favorites = await _userService.getFavorites(userId);
    } catch (e) {
      debugPrint('Error loading favorites: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Call this after toggling a favorite to refresh the list
  Future<void> refresh(String userId) async {
    try {
      _favorites = await _userService.getFavorites(userId);
      notifyListeners();
    } catch (e) {
      debugPrint('Error refreshing favorites: $e');
    }
  }
}
