import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/toasts.dart';
import '../../core/widgets/loading_overlay.dart';
import '../auth/auth_provider.dart';
import '../discover/widgets/profile_card.dart';
import 'favorites_provider.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  int? _hoveredIndex;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FavoritesProvider>();
    final auth = context.read<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Premium Gradient Background
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF09090E),
                    Color(0xFF0F172A),
                    Color(0xFF1E1B4B),
                    Color(0xFF09090E),
                  ],
                  stops: [0.0, 0.3, 0.7, 1.0],
                ),
              ),
            ),
          ),

          // Ambient Glows
          const _AmbientGlow(
            offset: Offset(1.0, 0.0),
            color: AppColors.cyan,
            radius: 400,
            opacity: 0.1,
          ),
          const _AmbientGlow(
            offset: Offset(0.0, 1.0),
            color: AppColors.pink,
            radius: 350,
            opacity: 0.08,
          ),

          // Content
          LoadingOverlay(
            isLoading: provider.isLoading,
            message: 'Loading favorites...',
            child: SafeArea(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Padding(
                    padding: EdgeInsets.fromLTRB(
                      AppSpacing.lg,
                      AppSpacing.lg,
                      AppSpacing.lg,
                      AppSpacing.md,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '❤️ Saved',
                                  style: GoogleFonts.fraunces(
                                    fontSize: 32,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: -1,
                                  ),
                                ),
                                AppSpacing.vGapSm,
                                Text(
                                  'Your favorite connections',
                                  style: GoogleFonts.dmSans(
                                    fontSize: 14,
                                    color: Colors.white.withValues(alpha: 0.6),
                                  ),
                                ),
                              ],
                            ),
                            // Favorite count badge
                            if (provider.favorites.isNotEmpty)
                              Container(
                                padding: EdgeInsets.symmetric(
                                  horizontal: AppSpacing.md,
                                  vertical: AppSpacing.sm,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.pink.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: AppColors.pink.withValues(alpha: 0.5),
                                  ),
                                ),
                                child: Text(
                                  '${provider.favorites.length}',
                                  style: GoogleFonts.dmSans(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.pink,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Content
                  Expanded(
                    child: provider.favorites.isEmpty
                        ? _EmptyState()
                        : _FavoritesGrid(
                            favorites: provider.favorites,
                            user: user,
                            onRemove: (profileId) async {
                              if (user != null) {
                                await auth.toggleFavorite(profileId);
                                if (context.mounted) {
                                  provider.refresh(user.id);
                                  AppToasts.success(
                                    context,
                                    'Removed from favorites',
                                  );
                                }
                              }
                            },
                            onHover: (index, isHover) {
                              setState(() => _hoveredIndex = isHover ? index : null);
                            },
                            hoveredIndex: _hoveredIndex,
                          ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Favorites Grid
// ─────────────────────────────────────────────────────────────────────────────

class _FavoritesGrid extends StatelessWidget {
  final List<dynamic> favorites;
  final dynamic user;
  final Function(String) onRemove;
  final Function(int, bool) onHover;
  final int? hoveredIndex;

  const _FavoritesGrid({
    required this.favorites,
    required this.user,
    required this.onRemove,
    required this.onHover,
    required this.hoveredIndex,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.lg,
      ),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.7,
        crossAxisSpacing: AppSpacing.lg,
        mainAxisSpacing: AppSpacing.lg,
      ),
      itemCount: favorites.length,
      itemBuilder: (context, index) {
        final profile = favorites[index];
        final isHovered = hoveredIndex == index;

        return MouseRegion(
          onEnter: (_) => onHover(index, true),
          onExit: (_) => onHover(index, false),
          child: AnimatedScale(
            scale: isHovered ? 1.05 : 1.0,
            duration: const Duration(milliseconds: 200),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(AppSpacing.radiusPrimary),
              child: ProfileCard(
                profile: profile,
                isFavorite: user?.favorites.contains(profile.id) ?? true,
                height: double.infinity,
                onFavorite: () async {
                  if (user != null) {
                    await context.read<AuthProvider>().toggleFavorite(profile.id);
                    if (context.mounted) {
                      onRemove(profile.id);
                    }
                  }
                },
              ),
            ),
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Illustration
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.pink.withValues(alpha: 0.15),
                    Colors.transparent,
                  ],
                ),
              ),
              child: const Center(
                child: Icon(
                  Icons.favorite_border_rounded,
                  size: 64,
                  color: AppColors.pink,
                ),
              ),
            ),
            AppSpacing.vGapXxl,

            // Title
            Text(
              'No favorites yet',
              style: GoogleFonts.fraunces(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
                letterSpacing: -0.5,
              ),
            ),
            AppSpacing.vGapMd,

            // Description
            Padding(
              padding: EdgeInsets.symmetric(horizontal: AppSpacing.xl),
              child: Text(
                'Start exploring and save your favorite connections here',
                textAlign: TextAlign.center,
                style: GoogleFonts.dmSans(
                  fontSize: 15,
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
            ),
            AppSpacing.vGapXxl,

            // CTA Button
            Container(
              decoration: BoxDecoration(
                gradient: AppColors.violetGradient,
                borderRadius: BorderRadius.circular(AppSpacing.radiusPrimary),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.violet.withValues(alpha: 0.4),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: ElevatedButton(
                onPressed: () {
                  // Navigate to discover
                  Navigator.of(context).pop();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.circular(AppSpacing.radiusPrimary),
                  ),
                  padding: EdgeInsets.symmetric(
                    horizontal: AppSpacing.xl,
                    vertical: AppSpacing.lg,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.explore_rounded, size: 20),
                    AppSpacing.hGapMd,
                    Text(
                      'Explore Profiles',
                      style: GoogleFonts.dmSans(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ambient Glow (reused from Discover)
// ─────────────────────────────────────────────────────────────────────────────

class _AmbientGlow extends StatelessWidget {
  final Offset offset;
  final Color color;
  final double radius;
  final double opacity;

  const _AmbientGlow({
    required this.offset,
    required this.color,
    required this.radius,
    required this.opacity,
  });

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Positioned(
      left: size.width * offset.dx - radius,
      top: size.height * offset.dy - radius,
      child: Container(
        width: radius * 2,
        height: radius * 2,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color.withValues(alpha: opacity),
        ),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 100, sigmaY: 100),
          child: Container(color: Colors.transparent),
        ),
      ),
    );
  }
}
