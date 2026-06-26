import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart' as auth;

/// Service de gestion de la présence en ligne des utilisateurs
/// Utilise Firestore pour suivre le statut en ligne et le dernier vu
class PresenceService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  Timer? _presenceTimer;
  StreamSubscription? _authSubscription;

  /// Initialise le suivi de présence pour l'utilisateur actuel
  void init() {
    _authSubscription = auth.FirebaseAuth.instance.authStateChanges().listen((user) {
      if (user != null) {
        _setOnline(true);
        _startHeartbeat();
      } else {
        _setOnline(false);
        _stopHeartbeat();
      }
    });
  }

  /// Démarre le heartbeat pour maintenir le statut en ligne
  void _startHeartbeat() {
    _presenceTimer?.cancel();
    _presenceTimer = Timer.periodic(const Duration(minutes: 1), (_) {
      _updateLastSeen();
    });
  }

  /// Arrête le heartbeat
  void _stopHeartbeat() {
    _presenceTimer?.cancel();
  }

  /// Met à jour le statut en ligne de l'utilisateur
  Future<void> _setOnline(bool isOnline) async {
    final userId = auth.FirebaseAuth.instance.currentUser?.uid;
    if (userId == null) return;

    await _db.collection('profiles').doc(userId).update({
      'isOnline': isOnline,
      'lastSeen': isOnline ? FieldValue.delete() : FieldValue.serverTimestamp(),
    });
  }

  /// Met à jour le timestamp lastSeen (heartbeat)
  Future<void> _updateLastSeen() async {
    final userId = auth.FirebaseAuth.instance.currentUser?.uid;
    if (userId == null) return;

    await _db.collection('profiles').doc(userId).update({
      'lastSeen': FieldValue.serverTimestamp(),
    });
  }

  /// Appelé quand l'utilisateur ferme l'application
  Future<void> dispose() async {
    _stopHeartbeat();
    await _setOnline(false);
    await _authSubscription?.cancel();
  }

  /// Formate le statut "en ligne" ou "vu il y a X temps"
  static String formatPresence(bool isOnline, DateTime? lastSeen) {
    if (isOnline) {
      return 'Online';
    }

    if (lastSeen == null) {
      return 'Unknown';
    }

    final now = DateTime.now();
    final difference = now.difference(lastSeen);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return 'Seen ${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return 'Seen ${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return 'Seen ${difference.inDays}d ago';
    } else {
      return 'Seen recently';
    }
  }

  /// Stream pour écouter les changements de présence d'un utilisateur
  Stream<Map<String, dynamic>> getUserPresence(String userId) {
    return _db
        .collection('profiles')
        .doc(userId)
        .snapshots()
        .map((snapshot) {
      final data = snapshot.data();
      if (data == null) {
        return {'isOnline': false, 'lastSeen': null};
      }
      return {
        'isOnline': data['isOnline'] as bool? ?? false,
        'lastSeen': data['lastSeen'] as Timestamp?,
      };
    });
  }
}
