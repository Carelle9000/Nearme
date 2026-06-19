import 'package:cloud_functions/cloud_functions.dart';

/// Abstract interface for Stripe Identity verification
abstract class StripeIdentityService {
  /// Start identity verification session
  Future<StripeIdentityResult> startVerification();

  /// Check verification status (fallback)
  Future<StripeIdentityStatus> checkStatus(String verificationId);

  /// Cancel ongoing verification
  void cancel();
}

/// Implementation using Firebase Cloud Functions
class StripeIdentityServiceImpl implements StripeIdentityService {
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  StripeIdentityServiceImpl();

  @override
  Future<StripeIdentityResult> startVerification() async {
    try {
      // Call Firebase Cloud Function
      final result =
          await _functions.httpsCallable('createVerificationSession').call();

      final data = result.data as Map<String, dynamic>;
      final sessionId = data['sessionId'] as String;
      final clientSecret = data['clientSecret'] as String;

      if (clientSecret.isEmpty) {
        throw Exception('No client_secret returned from backend');
      }

      return StripeIdentityResult(
        verificationSessionId: sessionId,
        status: 'pending',
      );
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<StripeIdentityStatus> checkStatus(String verificationId) async {
    try {
      final result = await _functions
          .httpsCallable('getVerificationStatus')
          .call({'verificationId': verificationId});

      final data = result.data as Map<String, dynamic>;
      return StripeIdentityStatus.fromJson(data);
    } catch (e) {
      rethrow;
    }
  }

  @override
  void cancel() {}
}

/// Result from starting verification
class StripeIdentityResult {
  final String verificationSessionId;
  final String status;

  StripeIdentityResult({
    required this.verificationSessionId,
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
