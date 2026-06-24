import 'dart:math' as math;

import 'package:flutter/foundation.dart';

import '../../core/constants/sample_profiles.dart';
import '../../data/models/profile.dart';
import '../../data/models/discover_filters.dart';
import '../../data/services/match_service.dart';
import '../../data/services/user_service.dart';

class DiscoverProvider extends ChangeNotifier {
  final UserService? _userService;
  final MatchService _matchService = MatchService();
  DiscoverFilters _filters = const DiscoverFilters();
  List<Profile> _deck = [];
  int _index = 0;
  bool _isLoading = false;

  /// Trigger for programmatic swipe (button clicks)
  SwipeAction? _pendingAction;
  SwipeAction? get pendingAction => _pendingAction;

  /// Set after a like/superLike that results in a mutual match.
  /// UI should read this, trigger the match modal, then call [clearLastMatch].
  Profile? _lastMatch;

  DiscoverProvider({UserService? userService}) : _userService = userService;

  DiscoverFilters get filters => _filters;
  Profile? get current => _index < _deck.length ? _deck[_index] : null;
  int get index => _index;
  int get deckSize => _deck.length;
  Profile? get lastMatch => _lastMatch;
  bool get isLoading => _isLoading;

  void clearLastMatch() {
    _lastMatch = null;
    notifyListeners();
  }

  Future<void> loadUsers(String currentUserId) async {
    if (_userService == null) return;

    _isLoading = true;
    notifyListeners();

    try {
      final users = await _userService!.getPotentialMatches(
        currentUserId,
        filters: _filters,
      );
      _deck = users;
      _index = 0;
    } catch (e) {
      debugPrint('Error loading users: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> toggleFavorite(String currentUserId, String targetUserId) async {
    if (_userService == null) return;
    await _userService!.toggleFavorite(currentUserId, targetUserId);
    notifyListeners();
  }

  void updateFilters(DiscoverFilters next) {
    _filters = next;
    // On ne fait plus _applyFilters localement sur kSampleProfiles,
    // On recharge depuis Firebase avec les nouveaux filtres.
    notifyListeners();
  }

  void setCountryFilter(String? countryCode) {
    _filters = _filters.copyWith(countryCode: countryCode);
    _index = 0;
    notifyListeners();
  }

  /// Swipe the current card.
  Future<void> swipe(String currentUserId, String currentUserName, String? currentUserPhoto, SwipeAction action, {bool programmatic = false}) async {
    if (_index >= _deck.length) return;

    if (programmatic) {
      _pendingAction = action;
      notifyListeners();
      // The _SwipeCard will listen and trigger its own animation,
      // then it will call swipe(..., programmatic: false) to finish.
      return;
    }

    _pendingAction = null;
    final profile = _deck[_index];
    _index++;
    _lastMatch = null;

    if (action == SwipeAction.like || action == SwipeAction.superLike) {
      final isMatch = await _matchService.swipeLike(currentUserId, currentUserName, currentUserPhoto, profile);
      if (isMatch) {
        _lastMatch = profile;
      }
    } else {
      await _matchService.swipeNope(currentUserId, profile.id);
    }

    notifyListeners();
  }

  Future<void> reset(String? currentUserId) async {
    if (_userService != null && currentUserId != null) {
      await loadUsers(currentUserId);
    } else {
      _index = 0;
      _lastMatch = null;
      notifyListeners();
    }
  }
}

enum SwipeAction { nope, superLike, like }
