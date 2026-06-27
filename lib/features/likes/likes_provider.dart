import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../data/models/profile.dart';
import '../../data/services/user_service.dart';

class LikesProvider extends ChangeNotifier {
  final UserService _userService = UserService();

  List<Profile> _likes = [];
  bool _isLoading = false;

  List<Profile> get likes => List.unmodifiable(_likes);
  bool get isLoading => _isLoading;

  Future<void> loadLikes(String userId) async {
    _isLoading = true;
    notifyListeners();

    try {
      _likes = await _userService.getSentLikes(userId);
    } catch (e) {
      debugPrint('Error loading likes: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Call this after toggling a like to refresh the list
  Future<void> refresh(String userId) async {
    try {
      _likes = await _userService.getLikes(userId);
      notifyListeners();
    } catch (e) {
      debugPrint('Error refreshing likes: $e');
    }
  }
}
