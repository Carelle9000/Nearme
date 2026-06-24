import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

/// Écoute les mises à jour de vérification d'identité en temps réel
/// Le webhook Stripe met à jour Firestore, et ce listener notifie l'app
class VerificationListenerService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  /// Écouter les changements de vérification pour un utilisateur
  /// Appelé quand la vérification est complétée via le webhook
  void listenForVerificationUpdate(
    String userId,
    VoidCallback onAgeVerified,
    Function(String error) onError,
  ) {
    debugPrint('[VerificationListener] Listening for updates on user: $userId');

    _db.collection('profiles').doc(userId).snapshots().listen(
      (snapshot) {
        if (!snapshot.exists) return;

        final data = snapshot.data() as Map<String, dynamic>;
        final isAgeVerified = data['isAgeVerified'] as bool? ?? false;
        final verificationStatus = data['ageVerificationStatus'] as String?;

        debugPrint('[VerificationListener] Status: $verificationStatus, Verified: $isAgeVerified');

        if (isAgeVerified) {
          debugPrint('[VerificationListener] ✓ User age verified!');
          onAgeVerified();
        } else if (verificationStatus == 'rejected') {
          onError('Verification was rejected. Please try again.');
        }
      },
      onError: (error) {
        debugPrint('[VerificationListener] Error listening: $error');
        onError('Failed to listen for verification updates: $error');
      },
    );
  }

  /// Vérifier le statut actuel sans écouter
  Future<bool> getVerificationStatus(String userId) async {
    try {
      final doc = await _db.collection('profiles').doc(userId).get();
      if (!doc.exists) return false;

      final data = doc.data() as Map<String, dynamic>;
      return data['isAgeVerified'] as bool? ?? false;
    } catch (e) {
      debugPrint('[VerificationListener] Error getting status: $e');
      return false;
    }
  }

  /// Obtenir le statut de vérification complet
  Future<Map<String, dynamic>?> getVerificationDetails(String userId) async {
    try {
      final doc = await _db.collection('profiles').doc(userId).get();
      if (!doc.exists) return null;

      final data = doc.data() as Map<String, dynamic>;
      return {
        'isAgeVerified': data['isAgeVerified'] ?? false,
        'ageVerificationStatus': data['ageVerificationStatus'],
        'ageVerifiedAt': data['ageVerifiedAt'],
        'stripeVerificationId': data['stripeVerificationId'],
        'ageVerificationAttempts': data['ageVerificationAttempts'] ?? 0,
      };
    } catch (e) {
      debugPrint('[VerificationListener] Error getting details: $e');
      return null;
    }
  }
}
