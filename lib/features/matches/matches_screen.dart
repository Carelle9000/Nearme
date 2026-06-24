import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../../core/widgets/signed_photo_image.dart';
import '../../../core/widgets/photo_viewer.dart';
import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../locale/locale_provider.dart';
import 'matches_provider.dart';

class MatchesScreen extends StatelessWidget {
  const MatchesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;
    final provider = context.watch<MatchesProvider>();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Modern Gradient Background
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
            offset: Offset(0.85, 0.15),
            color: AppColors.pink,
            radius: 350,
            opacity: 0.12,
          ),
          const _AmbientGlow(
            offset: Offset(0.1, 0.85),
            color: AppColors.violet,
            radius: 300,
            opacity: 0.1,
          ),

          SafeArea(
            child: Column(
              children: [
                _MatchesHeader(t: t),
                Expanded(
                  child: provider.matches.isEmpty
                      ? _EmptyState(t: t)
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                          itemCount: provider.matches.length,
                          separatorBuilder: (context, i) =>
                              const SizedBox(height: 10),
                          itemBuilder: (context, i) => _MatchTile(
                            entry: provider.matches[i],
                            onTap: () => Navigator.of(context).pushNamed(
                              AppRoutes.chat,
                              arguments: provider.matches[i].id,
                            ),
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────

class _MatchesHeader extends StatelessWidget {
  final String Function(String) t;
  const _MatchesHeader({required this.t});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 14),
      child: Row(
        children: [
          Text(
            t('matches'),
            style: GoogleFonts.fraunces(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(width: 12),
          Consumer<MatchesProvider>(
            builder: (context2, mp, child) {
              if (mp.unreadCount == 0) return const SizedBox.shrink();
              return AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.pink.withValues(alpha: 0.25),
                      AppColors.pink.withValues(alpha: 0.15),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: AppColors.pink.withValues(alpha: 0.4),
                    width: 1.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.pink.withValues(alpha: 0.15),
                      blurRadius: 10,
                      spreadRadius: 0,
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.notifications_active_rounded,
                      color: AppColors.pink,
                      size: 16,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${mp.unreadCount}',
                      style: GoogleFonts.dmSans(
                        color: AppColors.pink,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Match Tile — Modern Card with Blur
// ─────────────────────────────────────────────────────────────────────────────

class _MatchTile extends StatefulWidget {
  final MatchEntry entry;
  final VoidCallback onTap;
  const _MatchTile({required this.entry, required this.onTap});

  @override
  State<_MatchTile> createState() => _MatchTileState();
}

class _MatchTileState extends State<_MatchTile>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.98).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasUnread = widget.entry.hasUnread;

    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onTap();
      },
      onTapCancel: () => _controller.reverse(),
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: hasUnread
                ? AppColors.surface.withValues(alpha: 0.4)
                : AppColors.surface.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: hasUnread
                  ? AppColors.pink.withValues(alpha: 0.35)
                  : Colors.white.withValues(alpha: 0.06),
              width: hasUnread ? 1.5 : 1.2,
            ),
            boxShadow: hasUnread
                ? [
                    BoxShadow(
                      color: AppColors.pink.withValues(alpha: 0.15),
                      blurRadius: 15,
                      spreadRadius: 0,
                    ),
                  ]
                : [],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
              child: Row(
                children: [
                  // Avatar with Online Indicator
                  Stack(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          gradient: AppColors.violetGradient,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.violet.withValues(alpha: 0.2),
                              blurRadius: 12,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: Center(
                          child: widget.entry.profile.photos.isNotEmpty
                              ? GestureDetector(
                                  onTap: () => PhotoViewer.show(context, photos: widget.entry.profile.photos),
                                  child: SignedPhotoImage(
                                    path: widget.entry.profile.photos.first,
                                    fit: BoxFit.cover,
                                    cacheWidth: 300,
                                  ),
                                )
                              : Text(
                                  widget.entry.profile.emoji,
                                  style: const TextStyle(fontSize: 28),
                                ),
                        ),
                      ),
                      if (widget.entry.profile.online)
                        Positioned(
                          right: 0,
                          bottom: 0,
                          child: Container(
                            width: 16,
                            height: 16,
                            decoration: BoxDecoration(
                              color: AppColors.emerald,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.surface,
                                width: 2.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.emerald.withValues(alpha: 0.4),
                                  blurRadius: 8,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.circle,
                                size: 6,
                                color: AppColors.emerald,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: 14),
                  // Info Section
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '${widget.entry.profile.name}, ${widget.entry.profile.age}',
                              style: GoogleFonts.dmSans(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            Text(
                              _timeAgo(widget.entry.matchedAt),
                              style: GoogleFonts.dmSans(
                                fontSize: 11,
                                color: AppColors.textMuted,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Icon(
                              widget.entry.lastMessage == null
                                  ? Icons.favorite_outline_rounded
                                  : Icons.mail_outline_rounded,
                              size: 14,
                              color: hasUnread
                                  ? AppColors.pink
                                  : AppColors.textSecondary,
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                widget.entry.lastMessage ??
                                    'New match — say hello',
                                style: GoogleFonts.dmSans(
                                  fontSize: 13,
                                  color: hasUnread
                                      ? AppColors.textPrimary
                                      : AppColors.textMuted,
                                  fontWeight: hasUnread
                                      ? FontWeight.w500
                                      : FontWeight.normal,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  if (hasUnread)
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: AppColors.pink,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.pink.withValues(alpha: 0.5),
                            blurRadius: 6,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  static String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State — Modern Design
// ─────────────────────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final String Function(String) t;
  const _EmptyState({required this.t});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Modern Icon Container
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    AppColors.pink.withValues(alpha: 0.15),
                    AppColors.violet.withValues(alpha: 0.15),
                  ],
                ),
                shape: BoxShape.circle,
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.1),
                  width: 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.pink.withValues(alpha: 0.1),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(50),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Center(
                    child: Icon(
                      Icons.favorite_outline_rounded,
                      size: 50,
                      color: AppColors.pink.withValues(alpha: 0.6),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 28),
            Text(
              t('noMatchesYet'),
              style: GoogleFonts.fraunces(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
                letterSpacing: -0.5,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Start swiping to find your perfect match nearby!',
              style: GoogleFonts.dmSans(
                fontSize: 14,
                color: AppColors.textMuted,
                height: 1.6,
                fontWeight: FontWeight.w400,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.violet.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.violet.withValues(alpha: 0.3),
                  width: 1.2,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.explore_rounded,
                    size: 18,
                    color: AppColors.violet,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Go to Discover',
                    style: GoogleFonts.dmSans(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.violet,
                    ),
                  ),
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
// Ambient Glow Animation
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
