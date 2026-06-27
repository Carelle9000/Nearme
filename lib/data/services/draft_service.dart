import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

/// Service for saving and retrieving registration draft data
class DraftService {
  static const _keyAccountStep = 'draft_account_step';
  static const _keyProfileStep = 'draft_profile_step';
  static const _keyPhotoPaths = 'draft_photo_paths';

  late SharedPreferences _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  /// Save account step data (name, email, password)
  Future<void> saveAccountStep({
    required String name,
    required String email,
    required String password,
    required String confirmPassword,
    required bool termsAccepted,
  }) async {
    await _prefs.setString(
      _keyAccountStep,
      jsonEncode({
        'name': name,
        'email': email,
        'password': password,
        'confirmPassword': confirmPassword,
        'termsAccepted': termsAccepted,
        'timestamp': DateTime.now().toIso8601String(),
      }),
    );
  }

  /// Save profile step data
  Future<void> saveProfileStep({
    required String gender,
    required String interestedIn,
    required String birthDate,
    required double searchDistance,
    required double height,
    required String bio,
    required String location,
    required String intention,
    required List<String> interests,
  }) async {
    await _prefs.setString(
      _keyProfileStep,
      jsonEncode({
        'gender': gender,
        'interestedIn': interestedIn,
        'birthDate': birthDate,
        'searchDistance': searchDistance,
        'height': height,
        'bio': bio,
        'location': location,
        'intention': intention,
        'interests': interests,
        'timestamp': DateTime.now().toIso8601String(),
      }),
    );
  }

  /// Save photo paths
  Future<void> savePhotoPaths(List<String> paths) async {
    await _prefs.setStringList(_keyPhotoPaths, paths);
  }

  /// Load account step data
  Map<String, dynamic>? loadAccountStep() {
    final json = _prefs.getString(_keyAccountStep);
    if (json == null) return null;
    try {
      return jsonDecode(json);
    } catch (_) {
      return null;
    }
  }

  /// Load profile step data
  Map<String, dynamic>? loadProfileStep() {
    final json = _prefs.getString(_keyProfileStep);
    if (json == null) return null;
    try {
      return jsonDecode(json);
    } catch (_) {
      return null;
    }
  }

  /// Load photo paths
  List<String> loadPhotoPaths() {
    return _prefs.getStringList(_keyPhotoPaths) ?? [];
  }

  /// Check if draft exists and is recent (less than 7 days old)
  bool hasDraft() {
    final accountData = loadAccountStep();
    if (accountData == null) return false;

    final timestamp = DateTime.parse(accountData['timestamp'] as String);
    final now = DateTime.now();
    final daysOld = now.difference(timestamp).inDays;

    return daysOld < 7;
  }

  /// Clear all draft data
  Future<void> clearDraft() async {
    await Future.wait([
      _prefs.remove(_keyAccountStep),
      _prefs.remove(_keyProfileStep),
      _prefs.remove(_keyPhotoPaths),
    ]);
  }

  /// Get draft age in hours
  int? getDraftAgeInHours() {
    final accountData = loadAccountStep();
    if (accountData == null) return null;

    final timestamp = DateTime.parse(accountData['timestamp'] as String);
    final now = DateTime.now();
    return now.difference(timestamp).inHours;
  }
}
