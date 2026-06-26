import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_colors.dart';
import 'photo_viewer.dart';
import 'signed_photo_image.dart';

/// Tuile photo de profil réutilisable (grille inscription / edit profil).
/// Tap par défaut → [PhotoViewer] plein écran.
class ProfilePhotoTile extends StatelessWidget {
  final String path;
  final List<String>? allPhotos;
  final int? photoIndex;
  final VoidCallback? onTap;
  final VoidCallback? onDelete;
  final VoidCallback? onLongPress;
  final bool isMain;
  final double borderRadius;
  final int? cacheWidth;
  final BoxFit fit;

  const ProfilePhotoTile({
    super.key,
    required this.path,
    this.allPhotos,
    this.photoIndex,
    this.onTap,
    this.onDelete,
    this.onLongPress,
    this.isMain = false,
    this.borderRadius = 16,
    this.cacheWidth = 300,
    this.fit = BoxFit.cover,
  });

  void _openViewer(BuildContext context) {
    final photos = allPhotos ?? [path];
    if (photos.isEmpty) return;
    final index = photoIndex ?? photos.indexOf(path).clamp(0, photos.length - 1);
    PhotoViewer.show(context, photos: photos, initialIndex: index);
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        GestureDetector(
          onTap: onTap ?? () => _openViewer(context),
          onLongPress: onLongPress,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(borderRadius),
            child: SignedPhotoImage(
              path: path,
              fit: fit,
              cacheWidth: cacheWidth,
            ),
          ),
        ),
        if (onDelete != null)
          Positioned(
            top: 4,
            right: 4,
            child: GestureDetector(
              onTap: onDelete,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Colors.black26,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, color: Colors.white, size: 14),
              ),
            ),
          ),
        if (isMain)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 4),
              color: AppColors.violet.withValues(alpha: 0.8),
              child: Text(
                'MAIN',
                textAlign: TextAlign.center,
                style: GoogleFonts.dmSans(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// Bouton « + » pour ajouter une photo dans une grille.
class ProfilePhotoAddTile extends StatelessWidget {
  final VoidCallback onTap;
  final double borderRadius;
  final Color? backgroundColor;

  const ProfilePhotoAddTile({
    super.key,
    required this.onTap,
    this.borderRadius = 16,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: backgroundColor ?? AppColors.surface,
          borderRadius: BorderRadius.circular(borderRadius),
          border: Border.all(color: Colors.white12),
        ),
        child: const Icon(
          Icons.add_a_photo_outlined,
          color: AppColors.violet,
          size: 28,
        ),
      ),
    );
  }
}
