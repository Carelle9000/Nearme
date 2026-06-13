import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/foundation.dart' show debugPrint;
import 'package:http/http.dart' as http;

import '../../core/config/app_config.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Result value type
// ─────────────────────────────────────────────────────────────────────────────

/// Outcome of a face comparison request.
class FaceCompareResult {
  /// True when both images show the same person
  /// (confidence ≥ [AppConfig.faceMatchThreshold]).
  final bool matched;

  /// Raw similarity score 0–100 returned by Face++.
  /// Zero for graceful-fallback results (timeout / network error).
  final double confidence;

  /// True when the comparison was skipped because the API timed out.
  /// [matched] is forced to `true` in this case — we never block a user
  /// for an infrastructure problem.
  final bool timedOut;

  /// Human-readable description of what went wrong, or `null` on success.
  final String? errorMessage;

  const FaceCompareResult({
    required this.matched,
    required this.confidence,
    this.timedOut = false,
    this.errorMessage,
  });

  bool get hasError => errorMessage != null;

  @override
  String toString() =>
      'FaceCompareResult(matched=$matched, confidence=${confidence.toStringAsFixed(1)}, '
      'timedOut=$timedOut, error=$errorMessage)';
}

// ─────────────────────────────────────────────────────────────────────────────
// Abstract interface  (swap providers without touching the UI)
// ─────────────────────────────────────────────────────────────────────────────

/// Compares a live selfie against a reference photo.
///
/// Inject via `Provider<FaceCompareService>` so the backend can be switched
/// (Face++ → AWS Rekognition) without any change to the UI layer.
abstract class FaceCompareService {
  /// Compare [selfieBytes] (JPEG captured from the front camera) against
  /// [referenceBytes] (the user's first uploaded profile photo).
  ///
  /// Never throws — always returns a [FaceCompareResult], using graceful
  /// fallback on network / API errors.
  Future<FaceCompareResult> compare({
    required Uint8List selfieBytes,
    required Uint8List referenceBytes,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Face++ concrete implementation
// ─────────────────────────────────────────────────────────────────────────────

/// [FaceCompareService] backed by the Supabase Edge Function proxy.
///
/// The proxy forwards requests to Face++ server-side so API credentials
/// are never embedded in the APK/IPA.
///
/// Le serveur lit FACE_PLUS_PLUS_KEY et FACE_PLUS_PLUS_SECRET depuis ses
/// variables d'environnement (fichier .env ou docker-compose.yml).
class FacePlusPlusService implements FaceCompareService {
  static const Duration _timeout = Duration(seconds: 20);

  @override
  Future<FaceCompareResult> compare({
    required Uint8List selfieBytes,
    required Uint8List referenceBytes,
  }) async {
    try {
      debugPrint('[FaceCompare] Sending request to proxy…');

      final response = await http
          .post(
            Uri.parse(AppConfig.compareFacesUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'image_base64_1': base64Encode(selfieBytes),
              'image_base64_2': base64Encode(referenceBytes),
            }),
          )
          .timeout(_timeout);

      debugPrint('[FaceCompare] HTTP ${response.statusCode}');

      // ── Non-2xx ─────────────────────────────────────────────────────────────
      // Treat infrastructure failures (proxy not deployed, 5xx, etc.) as a
      // graceful fallback — same philosophy as timeouts. Only a 200 with a
      // real low-confidence score constitutes a genuine mismatch.
      if (response.statusCode != 200) {
        debugPrint(
            '[FaceCompare] HTTP ${response.statusCode} — graceful fallback');
        return FaceCompareResult(
          matched: true,
          confidence: 0,
          timedOut: true,
          errorMessage: 'Service unavailable (HTTP ${response.statusCode})',
        );
      }

      // ── Parse JSON ───────────────────────────────────────────────────────────
      final json = jsonDecode(response.body) as Map<String, dynamic>;

      // Face++ returns `error_message` on bad input (no face, bad key, etc.)
      if (json.containsKey('error_message')) {
        final msg = json['error_message'] as String;
        debugPrint('[FaceCompare] API error_message: $msg');

        // FACE_NOT_FOUND means one image had no detectable face at all
        final isNoFace = msg.contains('FACE_NOT_FOUND');
        return FaceCompareResult(
          matched: false,
          confidence: 0,
          errorMessage: isNoFace
              ? 'No face detected — please use a clearer photo.'
              : 'API returned: $msg',
        );
      }

      // ── Success ──────────────────────────────────────────────────────────────
      final confidence = (json['confidence'] as num).toDouble();
      final matched = confidence >= AppConfig.faceMatchThreshold;

      debugPrint('[FaceCompare] confidence=${confidence.toStringAsFixed(1)} '
          'threshold=${AppConfig.faceMatchThreshold} matched=$matched');

      return FaceCompareResult(matched: matched, confidence: confidence);

      // ── Error paths ──────────────────────────────────────────────────────────
    } on TimeoutException {
      debugPrint('[FaceCompare] Timed out — graceful fallback (matched=true)');
      return const FaceCompareResult(
        matched: true, // never block the user for a slow network
        confidence: 0,
        timedOut: true,
        errorMessage: 'Verification timed out — proceeding.',
      );
    } catch (e) {
      debugPrint('[FaceCompare] Unexpected error: $e');
      // Any parse / network error → graceful fallback
      return FaceCompareResult(
        matched: true,
        confidence: 0,
        errorMessage: 'Comparison unavailable: $e',
      );
    }
  }
}
