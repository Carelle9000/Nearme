import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/widgets/signed_photo_image.dart';
import '../../../core/widgets/photo_viewer.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/animated_favorite_button.dart';
import '../../../data/models/profile.dart';

class ProfileCard extends StatefulWidget {
  final Profile profile;
  final bool isFavorite;
  final VoidCallback? onFavorite;
  final VoidCallback? onDoubleTap;
  final double? height;

  const ProfileCard({
    super.key,
    required this.profile,
    this.isFavorite = false,
    this.onFavorite,
    this.onDoubleTap,
    this.height,
  });

  @override
  State<ProfileCard> createState() => _ProfileCardState();
}

class _ProfileCardState extends State<ProfileCard> with SingleTickerProviderStateMixin {
  late AnimationController _heartController;
  late Animation<double> _heartScale;
  late Animation<double> _heartOpacity;
  bool _showHeart = false;

  @override
  void initState() {
    super.initState();
    _heartController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _heartScale = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.2).chain(CurveTween(curve: Curves.easeOutBack)), weight: 40),
      TweenSequenceItem(tween: Tween(begin: 1.2, end: 1.0).chain(CurveTween(curve: Curves.easeIn)), weight: 60),
    ]).animate(_heartController);

    _heartOpacity = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.0), weight: 20),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.0), weight: 60),
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.0), weight: 20),
    ]).animate(_heartController);

    _heartController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        setState(() => _showHeart = false);
      }
    });
  }

  @override
  void dispose() {
    _heartController.dispose();
    super.dispose();
  }

  void _triggerHeart() {
    setState(() => _showHeart = true);
    _heartController.forward(from: 0.0);
    widget.onDoubleTap?.call();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        if (widget.profile.photos.isNotEmpty) {
          PhotoViewer.show(context, photos: widget.profile.photos);
        }
      },
      onDoubleTap: _triggerHeart,
      child: Container(
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
        child: SizedBox(
          height: widget.height ?? 480,
          width: double.infinity,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // ── Photo / fond plein écran ────────────────────────────────────
              if (widget.profile.photos.isNotEmpty)
                ClipRRect(
                  child: SignedPhotoImage(
                    path: widget.profile.photos.first,
                    fit: BoxFit.cover,
                    cacheWidth: 1080,
                    cacheHeight: 1440,
                  ),
                )
              else
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
                      widget.profile.emoji,
                      style: const TextStyle(fontSize: 96),
                    ),
                  ),
                ),

              // ── Heart Animation Overlay ──────────────────────────────────────
              if (_showHeart)
                Center(
                  child: AnimatedBuilder(
                    animation: _heartController,
                    builder: (context, child) {
                      return Opacity(
                        opacity: _heartOpacity.value,
                        child: Transform.scale(
                          scale: _heartScale.value,
                          child: const Icon(
                            Icons.favorite_rounded,
                            color: Colors.white,
                            size: 100,
                            shadows: [
                              Shadow(color: Colors.black26, blurRadius: 20, offset: Offset(0, 10)),
                            ],
                          ),
                        ),
                      );
                    },
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
                            '${widget.profile.distanceKm.toStringAsFixed(1)} km',
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
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (widget.onFavorite != null)
                          _FrostedChip(
                            padding: const EdgeInsets.all(8),
                            color: widget.isFavorite
                                ? AppColors.pink.withValues(alpha: 0.3)
                                : Colors.black.withValues(alpha: 0.4),
                            child: AnimatedFavoriteButton(
                              isFavorite: widget.isFavorite,
                              onTap: widget.onFavorite!,
                              size: 18,
                            ),
                          ),
                        const SizedBox(width: 8),
                        _FrostedChip(
                          color: AppColors.violet.withValues(alpha: 0.38),
                          borderColor:
                              AppColors.violetGlow.withValues(alpha: 0.28),
                          child: Text(
                            widget.profile.badge,
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
                    // Nom + âge + online indicator
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${widget.profile.name}, ${widget.profile.age}',
                            style: GoogleFonts.dmSans(
                              fontSize: 28,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: -0.5,
                              height: 1.1,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (widget.profile.online) ...[
                          const SizedBox(width: 10),
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: AppColors.emerald,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.emerald.withValues(alpha: 0.5),
                                  blurRadius: 8,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 5),

                    // Quartier
                    Text(
                      widget.profile.hood,
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
                      children: widget.profile.tags.take(3).map((tag) {
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
                    if (widget.profile.bio.isNotEmpty) ...[
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
                          widget.profile.bio,
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
