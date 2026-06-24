import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/widgets/signed_photo_image.dart';
import '../../../core/widgets/photo_viewer.dart';
import '../../../core/router/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/profile.dart';

class MatchModal extends StatelessWidget {
  final Profile profile;
  final String matchId;

  const MatchModal({
    super.key,
    required this.profile,
    required this.matchId,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceHigh,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        border: Border.all(color: AppColors.borderLight),
      ),
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.borderLight,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 30),

          // Avatars superposés
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const _Avatar(emoji: '🫵', color: AppColors.violetGlow),
              Transform.translate(
                offset: const Offset(-14, 0),
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    shape: BoxShape.circle,
                    border: Border.all(
                        color: AppColors.border, width: 2),
                  ),
                  child: const Center(
                    child: Text('💫', style: TextStyle(fontSize: 16)),
                  ),
                ),
              ),
              Transform.translate(
                offset: const Offset(-14, 0),
                child: _Avatar(
                  profile: profile,
                  color: AppColors.pink,
                ),
              ),
            ],
          ),

          const SizedBox(height: 22),

          // Titre avec gradient
          ShaderMask(
            shaderCallback: (b) => const LinearGradient(
              colors: [AppColors.violetGlow, AppColors.pink],
            ).createShader(b),
            child: Text(
              "It's a Match!",
              style: GoogleFonts.fraunces(
                fontSize: 30,
                fontWeight: FontWeight.w700,
                color: Colors.white,
                letterSpacing: -0.5,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'You and ${profile.name} liked each other.',
            style: GoogleFonts.dmSans(
              fontSize: 15,
              color: AppColors.textSecondary,
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 32),

          // CTA principal
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.violet,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 0,
              ),
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(context)
                    .pushNamed(AppRoutes.chat, arguments: matchId);
              },
              child: Text(
                'Send a Message',
                style: GoogleFonts.dmSans(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              'Keep Swiping',
              style: GoogleFonts.dmSans(
                fontSize: 14,
                color: AppColors.textMuted,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final Profile? profile;
  final String? emoji;
  final Color color;
  const _Avatar({this.profile, this.emoji, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 78,
      height: 78,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        shape: BoxShape.circle,
        border: Border.all(color: color.withValues(alpha: 0.45), width: 2),
      ),
      clipBehavior: Clip.antiAlias,
      child: Center(
        child: profile != null && profile!.photos.isNotEmpty
            ? GestureDetector(
                onTap: () => PhotoViewer.show(context, photos: profile!.photos, initialIndex: 0),
                child: SignedPhotoImage(path: profile!.photos.first, fit: BoxFit.cover, cacheWidth: 300),
              )
            : Text(emoji ?? profile?.emoji ?? '👤',
                style: const TextStyle(fontSize: 36)),
      ),
    );
  }
}
