import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/profile.dart';

class ProfileCard extends StatelessWidget {
  final Profile profile;
  const ProfileCard({super.key, required this.profile});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.65),
            blurRadius: 48,
            offset: const Offset(0, 20),
          ),
          BoxShadow(
            color: AppColors.violet.withValues(alpha: 0.06),
            blurRadius: 64,
            spreadRadius: -8,
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      // Card height: fixe portrait adapté à toutes les tailles d'écran
      child: SizedBox(
        height: 480,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // ── Photo / fond plein écran ────────────────────────────────────
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF1E0A38), Color(0xFF0A0A1C)],
                ),
              ),
              child: Center(
                child: Text(
                  profile.emoji,
                  style: const TextStyle(fontSize: 96),
                ),
              ),
            ),

            // ── Dégradé overlay bas-de-carte ────────────────────────────────
            const Positioned.fill(
              child: IgnorePointer(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Color(0xB009090E),
                        Color(0xF209090E),
                      ],
                      stops: [0.28, 0.62, 1.0],
                    ),
                  ),
                ),
              ),
            ),

            // ── Barre supérieure : distance + badge intention ────────────────
            Positioned(
              top: 18,
              left: 18,
              right: 18,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Distance — hero de l'identité hyperlocale
                  _FrostedChip(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 7,
                          height: 7,
                          decoration: const BoxDecoration(
                            color: AppColors.emerald,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 7),
                        Text(
                          '${profile.distanceKm.toStringAsFixed(1)} km',
                          style: GoogleFonts.dmSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Badge intention
                  _FrostedChip(
                    color: AppColors.violet.withValues(alpha: 0.38),
                    borderColor:
                        AppColors.violetGlow.withValues(alpha: 0.28),
                    child: Text(
                      profile.badge,
                      style: GoogleFonts.dmSans(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // ── Infos bas de carte ────────────────────────────────────────
            Positioned(
              left: 20,
              right: 20,
              bottom: 20,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Nom + âge
                  Text(
                    '${profile.name}, ${profile.age}',
                    style: GoogleFonts.fraunces(
                      fontSize: 30,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                      letterSpacing: -0.4,
                      height: 1.05,
                    ),
                  ),
                  const SizedBox(height: 5),

                  // Quartier
                  Text(
                    profile.hood,
                    style: GoogleFonts.dmSans(
                      fontSize: 13,
                      color: Colors.white.withValues(alpha: 0.60),
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Tags
                  Wrap(
                    spacing: 7,
                    runSpacing: 7,
                    children: profile.tags.take(3).map((tag) {
                      return _FrostedChip(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 11, vertical: 5),
                        child: Text(
                          tag,
                          style: GoogleFonts.dmSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: Colors.white.withValues(alpha: 0.90),
                          ),
                        ),
                      );
                    }).toList(),
                  ),

                  // Bio — prompt éditorial style Hinge
                  if (profile.bio.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(13),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.07),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.10),
                        ),
                      ),
                      child: Text(
                        profile.bio,
                        style: GoogleFonts.dmSans(
                          fontSize: 12.5,
                          color: Colors.white.withValues(alpha: 0.72),
                          height: 1.55,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Chip glassmorphique réutilisable
// ─────────────────────────────────────────────────────────────────────────────

class _FrostedChip extends StatelessWidget {
  final Widget child;
  final Color? color;
  final Color? borderColor;
  final EdgeInsets padding;

  const _FrostedChip({
    required this.child,
    this.color,
    this.borderColor,
    this.padding = const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: color ?? Colors.black.withValues(alpha: 0.40),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: borderColor ?? Colors.white.withValues(alpha: 0.12),
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}
