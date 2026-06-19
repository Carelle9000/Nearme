import 'dart:typed_data';

import 'package:flutter/foundation.dart';

import '../../data/services/face_compare_service.dart';
import '../../data/services/stripe_identity_service.dart';

enum VerificationStep {
  faceCapture,      // Step 1: Take selfie + upload reference
  ageVerification,  // Step 2: Stripe Identity document scan
  verificationPending, // Waiting for webhook
  completed,        // ✓ All verified
}

/// Manages the complete identity verification flow
/// Combines face verification + age verification (Stripe Identity)
class IdentityVerificationProvider extends ChangeNotifier {
  final StripeIdentityService _stripeIdentity;
  final FaceCompareService _faceCompare;

  // State
  VerificationStep _step = VerificationStep.faceCapture;
  bool _faceVerified = false;
  bool _ageVerified = false;
  String? _error;
  bool _busy = false;

  IdentityVerificationProvider({
    required StripeIdentityService stripeIdentity,
    required FaceCompareService faceCompare,
  })  : _stripeIdentity = stripeIdentity,
        _faceCompare = faceCompare;

  // Getters
  VerificationStep get step => _step;
  bool get faceVerified => _faceVerified;
  bool get ageVerified => _ageVerified;
  String? get error => _error;
  bool get busy => _busy;

  /// Step 1: Face Verification
  /// Compares selfie with user's profile photo
  Future<bool> startFaceVerification({
    required Uint8List selfieBytes,
    required Uint8List referenceBytes,
  }) async {
    _busy = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _faceCompare.compare(
        selfieBytes: selfieBytes,
        referenceBytes: referenceBytes,
      );

      if (result.matched) {
        _faceVerified = true;
        _step = VerificationStep.ageVerification;
        _error = null;
      } else {
        _error = 'Face verification failed. Please try again.';
      }

      return result.matched;
    } catch (e) {
      _error = 'Error during face verification: $e';
      return false;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  /// Step 2: Age Verification via Stripe Identity
  /// Opens Stripe Identity UI for document scanning
  Future<bool> startAgeVerification() async {
    if (!_faceVerified) {
      _error = 'Complete face verification first';
      notifyListeners();
      return false;
    }

    _busy = true;
    _error = null;
    notifyListeners();

    try {
      // Launches Stripe Identity native UI
      await _stripeIdentity.startVerification();

      // Transition to waiting state
      // Backend will send webhook when verification is complete
      _step = VerificationStep.verificationPending;

      return true;
    } catch (e) {
      _error = 'Error starting age verification: $e';
      _busy = false;
      notifyListeners();
      return false;
    }
  }

  /// Called when backend receives Stripe webhook
  /// Updates local state when age verification completes
  void onWebhookVerificationComplete(bool ageVerified, {String? error}) {
    if (ageVerified) {
      _ageVerified = true;
      _step = VerificationStep.completed;
    } else {
      _error = error ?? 'Age verification failed';
      _step = VerificationStep.ageVerification; // Allow retry
    }
    _busy = false;
    notifyListeners();
  }

  /// Reset verification flow (for retry)
  void reset() {
    _step = VerificationStep.faceCapture;
    _faceVerified = false;
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
