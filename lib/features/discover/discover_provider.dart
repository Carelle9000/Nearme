import 'dart:math' as math;

import 'package:flutter/foundation.dart';

import '../../core/constants/sample_profiles.dart';
import '../../data/models/profile.dart';

class DiscoverFilters {
  final int ageMin;
  final int ageMax;
  final double radiusKm;
  final String? countryCode;
  final bool verifiedOnly;
  final bool onlineOnly;
  final bool sharedOnly;

  const DiscoverFilters({
    this.ageMin = 18,
    this.ageMax = 40,
    this.radiusKm = 2.0,
    this.countryCode,
    this.verifiedOnly = true,
    this.onlineOnly = false,
    this.sharedOnly = false,
  });

  DiscoverFilters copyWith({
    int? ageMin,
    int? ageMax,
    double? radiusKm,
    String? countryCode,
    bool? verifiedOnly,
    bool? onlineOnly,
    bool? sharedOnly,
  }) =>
      DiscoverFilters(
        ageMin: ageMin ?? this.ageMin,
        ageMax: ageMax ?? this.ageMax,
        radiusKm: radiusKm ?? this.radiusKm,
        countryCode: countryCode ?? this.countryCode,
        verifiedOnly: verifiedOnly ?? this.verifiedOnly,
        onlineOnly: onlineOnly ?? this.onlineOnly,
        sharedOnly: sharedOnly ?? this.sharedOnly,
      );
}

class DiscoverProvider extends ChangeNotifier {
  DiscoverFilters _filters = const DiscoverFilters();
  List<Profile> _deck = [...kSampleProfiles];
  int _index = 0;

  /// Set after a like/superLike that results in a mutual match.
  /// UI should read this, trigger the match modal, then call [clearLastMatch].
  Profile? _lastMatch;

  DiscoverFilters get filters => _filters;
  Profile? get current => _index < _deck.length ? _deck[_index] : null;
  int get index => _index;
  int get deckSize => _deck.length;
  Profile? get lastMatch => _lastMatch;

  void clearLastMatch() {
    _lastMatch = null;
    notifyListeners();
  }

  void updateFilters(DiscoverFilters next) {
    _filters = next;
    _applyFilters();
    notifyListeners();
  }

  void setCountryFilter(String? countryCode) {
    _filters = _filters.copyWith(countryCode: countryCode);
    _applyFilters();
    notifyListeners();
  }

  void _applyFilters() {
    _deck = kSampleProfiles.where((p) {
      if (p.age < _filters.ageMin || p.age > _filters.ageMax) return false;
      if (p.distanceKm > _filters.radiusKm) return false;
      if (_filters.countryCode != null && p.country != _filters.countryCode) return false;
      if (_filters.verifiedOnly && !p.verified) return false;
      if (_filters.onlineOnly && !p.online) return false;
      if (_filters.sharedOnly && !p.sharedSpots) return false;
      return true;
    }).toList();
    _index = 0;
  }

  /// Swipe the current card.
  ///
  /// On [SwipeAction.superLike] → always a match.
  /// On [SwipeAction.like]      → 45 % chance of mutual match (demo).
  /// On [SwipeAction.nope]      → never a match.
  void swipe(SwipeAction action) {
    if (_index >= _deck.length) return;
    final profile = _deck[_index];
    _index++;
    _lastMatch = null;

    if (action == SwipeAction.superLike) {
      _lastMatch = profile;
    } else if (action == SwipeAction.like &&
        math.Random().nextDouble() < 0.45) {
      _lastMatch = profile;
    }
    notifyListeners();
  }

  void reset() {
    _index = 0;
    _lastMatch = null;
    notifyListeners();
  }
}

enum SwipeAction { nope, superLike, like }
