import 'package:flutter/foundation.dart';
import 'package:image/image.dart' as img;

/// Utilitaire pour traiter les images de chat
/// - Compression
/// - Validation de taille
/// - Extraction de métadonnées
class ImageProcessor {
  // Limites
  static const int maxFileSizeMb = 5;
  static const int maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
  static const int maxImageDimension = 2000;
  static const int compressionQuality = 80;

  /// Valide une image avant upload
  /// Retourne l'erreur ou null si valide
  static String? validateImage(Uint8List imageBytes) {
    if (imageBytes.isEmpty) {
      return 'Image is empty';
    }

    if (imageBytes.length > maxFileSizeBytes) {
      return 'Image too large (max ${maxFileSizeMb}MB)';
    }

    return null;
  }

  /// Compresse une image pour optimiser l'upload/stockage
  static Future<Uint8List> compressImage(
    Uint8List imageBytes,
  ) async {
    try {
      // Décoder l'image
      final image = img.decodeImage(imageBytes);
      if (image == null) {
        return imageBytes; // Return original if decode fails
      }

      // Redimensionner si nécessaire
      img.Image resized = image;
      if (image.width > maxImageDimension ||
          image.height > maxImageDimension) {
        resized = img.copyResize(
          image,
          width: image.width > image.height ? maxImageDimension : null,
          height: image.height > image.width ? maxImageDimension : null,
          interpolation: img.Interpolation.linear,
        );

        if (kDebugMode) {
          debugPrint(
            'Image resized: ${image.width}x${image.height} → ${resized.width}x${resized.height}',
          );
        }
      }

      // Encoder en JPEG avec compression
      final compressed = Uint8List.fromList(
        img.encodeJpg(resized, quality: compressionQuality),
      );

      final reduction =
          ((1 - (compressed.length / imageBytes.length)) * 100).toInt();
      if (kDebugMode) {
        debugPrint(
          'Image compressed: ${imageBytes.length} → ${compressed.length} bytes ($reduction% reduction)',
        );
      }

      return compressed;
    } catch (e) {
      debugPrint('Error compressing image: $e');
      return imageBytes; // Return original on error
    }
  }

  /// Extrait les dimensions d'une image
  static ImageDimensions? getImageDimensions(Uint8List imageBytes) {
    try {
      final image = img.decodeImage(imageBytes);
      if (image == null) return null;

      return ImageDimensions(
        width: image.width,
        height: image.height,
      );
    } catch (e) {
      debugPrint('Error getting image dimensions: $e');
      return null;
    }
  }

  /// Valide et compresse une image pour chat
  static Future<ImageProcessResult> processImageForChat(
    Uint8List imageBytes,
  ) async {
    try {
      // 1. Valider
      final error = validateImage(imageBytes);
      if (error != null) {
        return ImageProcessResult(
          success: false,
          error: error,
        );
      }

      // 2. Compresser
      final compressed = await compressImage(imageBytes);

      // 3. Extraire métadonnées
      final dimensions = getImageDimensions(compressed);

      return ImageProcessResult(
        success: true,
        compressedBytes: compressed,
        width: dimensions?.width,
        height: dimensions?.height,
        fileSize: compressed.length,
      );
    } catch (e) {
      return ImageProcessResult(
        success: false,
        error: 'Failed to process image: $e',
      );
    }
  }
}

/// Dimensions d'une image
class ImageDimensions {
  final int width;
  final int height;

  ImageDimensions({required this.width, required this.height});
}

/// Résultat du traitement d'image
class ImageProcessResult {
  final bool success;
  final String? error;
  final Uint8List? compressedBytes;
  final int? width;
  final int? height;
  final int? fileSize;

  ImageProcessResult({
    required this.success,
    this.error,
    this.compressedBytes,
    this.width,
    this.height,
    this.fileSize,
  });
}
