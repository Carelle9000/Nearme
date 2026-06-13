import 'package:shared_preferences/shared_preferences.dart';

class SyncManager {
  SyncManager({required this.prefs});
  final SharedPreferences prefs;

  Future<SyncResult> sync(String accessToken) async => SyncResult.success;
}

enum SyncResult { success, skipped, error }
