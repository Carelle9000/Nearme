import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

class DiscoverHeader extends StatefulWidget {
  final String location;
  final VoidCallback onFilter;
  final VoidCallback onNotifications;
  final VoidCallback onLogout;
  final int unreadNotifications;

  const DiscoverHeader({
    super.key,
    required this.location,
    required this.onFilter,
    required this.onNotifications,
    required this.onLogout,
    this.unreadNotifications = 0,
  });

  @override
  State<DiscoverHeader> createState() => _DiscoverHeaderState();
}

class _DiscoverHeaderState extends State<DiscoverHeader> {
  @override
  Widget build(BuildContext context) {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          color: AppColors.bg.withValues(alpha: 0.5),
          padding: const EdgeInsets.fromLTRB(20, 14, 16, 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Logo
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.violet.withValues(alpha: 0.2),
                      blurRadius: 10,
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: Image.asset(
                  'assets/images/logo.jpeg',
                  fit: BoxFit.cover,
                  errorBuilder: (ctx, _, __) => Container(
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppColors.violetGradient,
                    ),
                    child: const Icon(
                      Icons.near_me_rounded,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                ),
              ),
              AppSpacing.hGapMd,
              // Branding + Location
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Nearme',
                    style: GoogleFonts.fraunces(
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.3,
                    ),
                  ),
                  AppSpacing.vGapSm,
                  // Location Pill
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.1),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          widget.location,
                          style: GoogleFonts.dmSans(
                            fontSize: 10,
                            color: Colors.white.withValues(alpha: 0.8),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        AppSpacing.hGapSm,
                        Icon(
                          Icons.keyboard_arrow_down_rounded,
                          size: 12,
                          color: Colors.white.withValues(alpha: 0.5),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Spacer(),
              // Action Icons
              _IconAction(
                icon: Icons.tune_rounded,
                onTap: widget.onFilter,
              ),
              AppSpacing.hGapSm,
              Stack(
                clipBehavior: Clip.none,
                children: [
                  _IconAction(
                    icon: Icons.notifications_none_rounded,
                    onTap: widget.onNotifications,
                  ),
                  if (widget.unreadNotifications > 0)
                    Positioned(
                      right: 0,
                      top: 0,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: const BoxDecoration(
                          color: AppColors.pink,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                ],
              ),
              AppSpacing.hGapSm,
              _IconAction(
                icon: Icons.logout_rounded,
                onTap: widget.onLogout,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _IconAction extends StatefulWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _IconAction({
    required this.icon,
    required this.onTap,
  });

  @override
  State<_IconAction> createState() => _IconActionState();
}

class _IconActionState extends State<_IconAction>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.92).animate(
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
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) => _controller.reverse(),
      onTapCancel: () => _controller.reverse(),
      onTap: widget.onTap,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: AppColors.surface.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.08),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Icon(
                widget.icon,
                color: AppColors.textSecondary,
                size: 19,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
