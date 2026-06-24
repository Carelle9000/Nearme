import 'dart:async';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';

/// Abstract interface for Stripe Identity verification
abstract class StripeIdentityService {
  /// Start identity verification session
  /// Returns clientSecret to be used with Stripe Identity native UI
  Future<StripeIdentityResult> startVerification();

  /// Check verification status (fallback)
  Future<StripeIdentityStatus> checkStatus(String verificationId);

  /// Cancel ongoing verification
  void cancel();
}

/// Implementation using Firebase Cloud Functions + Stripe Identity API
class StripeIdentityServiceImpl implements StripeIdentityService {
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  StripeIdentityServiceImpl();

  @override
  Future<StripeIdentityResult> startVerification() async {
    try {
      debugPrint('[StripeIdentity] Creating verification session via Cloud Function...');

      final callable = _functions.httpsCallable('createVerificationSession');
      final result = await callable.call().timeout(
            const Duration(seconds: 30),
            onTimeout: () => throw TimeoutException('Verification session creation timed out'),
          );

      final data = result.data as Map<dynamic, dynamic>;
      final clientSecret = data['client_secret'] as String? ?? '';
      final sessionId = data['session_id'] as String? ?? '';

      if (clientSecret.isEmpty || sessionId.isEmpty) {
        throw Exception('Invalid response: missing client_secret or session_id');
      }

      debugPrint('[StripeIdentity] Session created: $sessionId');

      return StripeIdentityResult(
        verificationSessionId: sessionId,
        clientSecret: clientSecret,
        status: data['status'] as String? ?? 'pending',
      );
    } on FirebaseFunctionsException catch (e) {
      debugPrint('[StripeIdentity] Firebase Error: ${e.code} - ${e.message}');
      throw Exception('Verification failed: ${e.message}');
    } catch (e) {
      debugPrint('[StripeIdentity] Error: $e');
      rethrow;
    }
  }

  @override
  Future<StripeIdentityStatus> checkStatus(String verificationId) async {
    try {
      debugPrint('[StripeIdentity] Checking status for: $verificationId');

      final callable = _functions.httpsCallable('getVerificationStatus');
      final result = await callable.call({'verificationId': verificationId}).timeout(
            const Duration(seconds: 10),
            onTimeout: () => throw TimeoutException('Status check timed out'),
          );

      final data = result.data as Map<dynamic, dynamic>;
      return StripeIdentityStatus.fromJson(Map<String, dynamic>.from(data));
    } on FirebaseFunctionsException catch (e) {
      debugPrint('[StripeIdentity] Firebase Error: ${e.code} - ${e.message}');
      throw Exception('Status check failed: ${e.message}');
    } catch (e) {
      debugPrint('[StripeIdentity] Error checking status: $e');
      rethrow;
    }
  }

  @override
  void cancel() {
    debugPrint('[StripeIdentity] Verification cancelled');
  }
}

/// Stub implementation for testing without Firebase Cloud Functions
class StripeIdentityServiceStub implements StripeIdentityService {
  @override
  Future<StripeIdentityResult> startVerification() async {
    debugPrint('[StripeIdentity-STUB] Simulating verification session creation...');

    // Simule un délai réseau (2 secondes)
    await Future.delayed(const Duration(seconds: 2));

    debugPrint('[StripeIdentity-STUB] ✓ Verification session created (simulated)');

    return StripeIdentityResult(
      verificationSessionId: 'sim_${DateTime.now().millisecondsSinceEpoch}',
      clientSecret: 'stub_secret_${DateTime.now().millisecondsSinceEpoch}',
      status: 'verified',
    );
  }

  @override
  Future<StripeIdentityStatus> checkStatus(String verificationId) async {
    debugPrint('[StripeIdentity-STUB] Checking status for: $verificationId');

    await Future.delayed(const Duration(milliseconds: 500));

    return StripeIdentityStatus(
      id: verificationId,
      status: 'verified',
      ageAbove18: true,
      verifiedAt: DateTime.now(),
    );
  }

  @override
  void cancel() {
    debugPrint('[StripeIdentity-STUB] Verification cancelled');
  }
}

/// Result from starting verification
class StripeIdentityResult {
  final String verificationSessionId;
  final String clientSecret;
  final String status;

  StripeIdentityResult({
    required this.verificationSessionId,
    required this.clientSecret,
    required this.status,
  });
}

/// Status of identity verification
class StripeIdentityStatus {
  final String id;
  final String status; // "verified" | "requires_input" | "unverified"
  final bool ageAbove18;
  final DateTime? verifiedAt;

  StripeIdentityStatus({
    required this.id,
    required this.status,
    required this.ageAbove18,
    this.verifiedAt,
  });

  factory StripeIdentityStatus.fromJson(Map<String, dynamic> json) {
    return StripeIdentityStatus(
      id: json['id'] as String,
      status: json['status'] as String,
      ageAbove18: json['age_above_18'] as bool? ?? false,
      verifiedAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
    );
  }
}
