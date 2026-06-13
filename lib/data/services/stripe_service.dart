// Stub for Stripe integration. In production, replace these methods with
// real calls to your backend that creates Stripe Checkout sessions and
// Stripe Identity VerificationSessions. Never put your Stripe secret key
// in the client. The publishable key can live in --dart-define or env config.

enum IdentityStatus { notStarted, pending, approved, failed }

class IdentityResult {
  final IdentityStatus status;
  final String? sessionId;
  final DateTime? verifiedAt;
  const IdentityResult({
    required this.status,
    this.sessionId,
    this.verifiedAt,
  });
}

class StripeService {
  Future<IdentityResult> startIdentityVerification({
    required String residenceCountry,
    required String documentCountry,
    required String documentType,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
    return const IdentityResult(status: IdentityStatus.pending);
  }

  Future<IdentityResult> simulateResult({required bool approve}) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    return IdentityResult(
      status: approve ? IdentityStatus.approved : IdentityStatus.failed,
      sessionId: approve ? 'vs_demo_123' : null,
      verifiedAt: approve ? DateTime.now() : null,
    );
  }

  Future<bool> startTrial({required String plan}) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
    return true;
  }
}
