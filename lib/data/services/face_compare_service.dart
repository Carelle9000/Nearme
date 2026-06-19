import 'dart:async';
import 'dart:convert' show base64Encode;
import 'dart:typed_data';

import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart' show debugPrint;

class FaceCompareResult {
  final bool matched;
  final double confidence;
  final bool timedOut;
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

abstract class FaceCompareService {
  Future<FaceCompareResult> compare({
    required Uint8List selfieBytes,
    required Uint8List referenceBytes,
  });
}

class FacePlusPlusService implements FaceCompareService {
  static const Duration _timeout = Duration(seconds: 20);
  static const double _threshold = 75.0;

  @override
  Future<FaceCompareResult> compare({
    required Uint8List selfieBytes,
    required Uint8List referenceBytes,
  }) async {
    try {
      debugPrint('[FaceCompare] Calling Cloud Function compareFaces…');

      final callable = FirebaseFunctions.instance.httpsCallable('compareFaces');
      final result = await callable.call({
        'image1': base64Encode(selfieBytes),
        'image2': base64Encode(referenceBytes),
      }).timeout(_timeout);

      final confidence = (result.data['confidence'] as num).toDouble();
      final matched = confidence >= _threshold;

      debugPrint('[FaceCompare] confidence=$confidence matched=$matched');

      return FaceCompareResult(matched: matched, confidence: confidence);
    } on TimeoutException {
      debugPrint('[FaceCompare] Timed out — graceful fallback');
      return const FaceCompareResult(
        matched: true,
        confidence: 0,
        timedOut: true,
        errorMessage: 'Verification timed out — proceeding.',
      );
    } catch (e) {
      debugPrint('[FaceCompare] Error: $e');
      return FaceCompareResult(
        matched: true,
        confidence: 0,
        errorMessage: 'Comparison unavailable: $e',
      );
    }
  }
}
