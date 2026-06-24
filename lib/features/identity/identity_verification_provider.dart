import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

import '../../data/services/auth_service.dart';
import '../../data/services/stripe_identity_service.dart';
import '../../data/services/verification_listener_service.dart';

enum VerificationStep {
  documentCapture,       // Step 1: Capturer le document (ID, passport, permis)
  ageVerification,       // Step 2: Lancer la vérification Stripe
  verificationPending,   // Step 3: En attente du résultat
  completed,             // Step 4: ✓ Vérifié
}

/// Manages age verification via Stripe Identity
class IdentityVerificationProvider extends ChangeNotifier {
  final StripeIdentityService _stripeIdentity;
  final AuthService _authService;
  final VerificationListenerService _verificationListener =
      VerificationListenerService();

  // State
  VerificationStep _step = VerificationStep.documentCapture;
  bool _ageVerified = false;
  String? _error;
  bool _busy = false;
  String? _documentPath; // Chemin local du document capturé

  IdentityVerificationProvider({
    required StripeIdentityService stripeIdentity,
    required AuthService authService,
  })  : _stripeIdentity = stripeIdentity,
        _authService = authService;

  // Getters
  VerificationStep get step => _step;
  bool get ageVerified => _ageVerified;
  String? get error => _error;
  bool get busy => _busy;
  String? get documentPath => _documentPath;
  bool get hasDocument => _documentPath != null && _documentPath!.isNotEmpty;

  /// Définir le document capturé et passer à l'étape de vérification
  void setDocumentAndContinue(String documentPath, String userId) {
    _documentPath = documentPath;
    debugPrint('[IdentityVerification] Document set: $_documentPath');

    // Passer à l'étape de vérification d'âge
    _step = VerificationStep.ageVerification;
    _error = null;
    notifyListeners();
  }

  /// Start Age Verification via Stripe Identity
  /// 1. Calls Firebase Cloud Function to create Stripe verification session
  /// 2. Launches Stripe Identity native UI
  /// 3. Waits for verification completion
  Future<bool> startAgeVerification(String userId) async {
    _busy = true;
    _error = null;
    notifyListeners();

    try {
      debugPrint('[IdentityVerification] Starting age verification...');

      // Get verification session from Cloud Function
      final result = await _stripeIdentity.startVerification();

      if (result.clientSecret.isEmpty) {
        throw Exception('No client_secret from backend');
      }

      debugPrint('[IdentityVerification] Session created: ${result.verificationSessionId}');

      _step = VerificationStep.verificationPending;
      notifyListeners();

      // For production: listen to webhook; for dev/stub: poll status
      if (result.status == 'verified') {
        // Stub returns verified immediately
        _ageVerified = true;
        _step = VerificationStep.completed;
        _busy = false;
        await _saveAgeVerificationStatusToFirestore(userId);
        debugPrint('[IdentityVerification] ✓ User verified successfully!');
        notifyListeners();
      } else {
        // Production: wait for webhook callback
        _listenForVerificationCompletion(userId);
        debugPrint('[IdentityVerification] Listening for webhook notification...');
      }

      return true;
    } catch (e) {
      _error = 'Error starting age verification: $e';
      debugPrint('[IdentityVerification] Error: $e');
      _busy = false;
      notifyListeners();
      return false;
    }
  }

  /// Listen for verification updates from Stripe webhook
  void _listenForVerificationCompletion(String userId) {
    _verificationListener.listenForVerificationUpdate(
      userId,
      () async {
        // Callback when user is verified
        _ageVerified = true;
        _step = VerificationStep.completed;
        _busy = false;
        _error = null;
        await _saveAgeVerificationStatusToFirestore(userId);
        debugPrint('[IdentityVerification] ✓ User verified successfully!');
        notifyListeners();
      },
      (error) {
        // Callback on error
        _error = error;
        _step = VerificationStep.ageVerification;
        _busy = false;
        debugPrint('[IdentityVerification] Error: $error');
        notifyListeners();
      },
    );
  }

  /// Save age verification status to Firestore
  Future<void> _saveAgeVerificationStatusToFirestore(String userId) async {
    try {
      await FirebaseFirestore.instance
          .collection('profiles')
          .doc(userId)
          .update({'isAgeVerified': true});
      debugPrint('[IdentityVerification] Age verification status saved to Firestore');

      // Reload user data to reflect the new status
      await _authService.refreshCurrentUser();
    } catch (e) {
      debugPrint('[IdentityVerification] Error saving status: $e');
    }
  }

  /// Called when backend receives Stripe webhook
  Future<void> onWebhookVerificationComplete(String userId, bool ageVerified, {String? error}) async {
    if (ageVerified) {
      _ageVerified = true;
      _step = VerificationStep.completed;
      await _saveAgeVerificationStatusToFirestore(userId);
    } else {
      _error = error ?? 'Age verification failed';
      _step = VerificationStep.ageVerification; // Allow retry
    }
    _busy = false;
    notifyListeners();
  }

  /// Reset verification flow (for retry)
  void reset() {
    _step = VerificationStep.documentCapture;
    _ageVerified = false;
    _error = null;
    _busy = false;
    notifyListeners();
  }

  /// Dismiss current step
  void dismiss() {
    _stripeIdentity.cancel();
  }
}
