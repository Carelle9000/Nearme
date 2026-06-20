import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../auth/auth_provider.dart';
import '../discover/discover_screen.dart';
import '../matches/matches_provider.dart';
import '../matches/matches_screen.dart';
import '../profile/profile_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _tab = 0;

  static const _screens = [
    DiscoverScreen(),
    MatchesScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAgeVerification();
    });
  }

  void _checkAgeVerification() {
    final authProvider = context.read<AuthProvider>();
    final user = authProvider.user;

    if (user != null && !user.isAgeVerified) {
      Navigator.of(context).pushReplacementNamed(AppRoutes.identity);
    }
  }

  @override
  Widget build(BuildContext context) {
    final unread =
        context.select<MatchesProvider, int>((mp) => mp.unreadCount);

    return Scaffold(
      extendBody: true,
      body: IndexedStack(index: _tab, children: _screens),
      bottomNavigationBar: _ModernBottomNav(
        currentIndex: _tab,
        unreadCount: unread,
        onTap: (i) => setState(() => _tab = i),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Modern Bottom Navigation Bar — With Labels & Modern Design
// ─────────────────────────────────────────────────────────────────────────────

class _ModernBottomNav extends StatelessWidget {
  final int currentIndex;
  final int unreadCount;
  final ValueChanged<int> onTap;

  const _ModernBottomNav({
    required this.currentIndex,
    required this.unreadCount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.bg.withValues(alpha: 0.85),
            border: Border(
              top: BorderSide(
                color: Colors.white.withValues(alpha: 0.08),
                width: 1,
              ),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 15,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _ModernNavItem(
                    icon: Icons.explore_outlined,
                    activeIcon: Icons.explore_rounded,
                    label: 'Explore',
                    active: currentIndex == 0,
                    onTap: () => onTap(0),
                  ),
                  _ModernNavItem(
                    icon: Icons.mail_outline_rounded,
                    activeIcon: Icons.mail_rounded,
                    label: 'Messages',
                    active: currentIndex == 1,
                    badge: unreadCount > 0 ? unreadCount : null,
                    onTap: () => onTap(1),
                  ),
                  _ModernNavItem(
                    icon: Icons.person_outline_rounded,
                    activeIcon: Icons.person_rounded,
                    label: 'Profile',
                    active: currentIndex == 2,
                    onTap: () => onTap(2),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ModernNavItem extends StatefulWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool active;
  final int? badge;
  final VoidCallback onTap;

  const _ModernNavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.active,
    required this.onTap,
    this.badge,
  });

  @override
  State<_ModernNavItem> createState() => _ModernNavItemState();
}

class _ModernNavItemState extends State<_ModernNavItem>
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
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.9).animate(
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
      onTapUp: (_) {
        _controller.reverse();
        widget.onTap();
      },
      onTapCancel: () => _controller.reverse(),
      behavior: HitTestBehavior.opaque,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: widget.active
                        ? AppColors.violet.withValues(alpha: 0.2)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(14),
                    border: widget.active
                        ? Border.all(
                            color: AppColors.violet.withValues(alpha: 0.3),
                            width: 1.2,
                          )
                        : null,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        widget.active ? widget.activeIcon : widget.icon,
                        color: widget.active
                            ? AppColors.violet
                            : AppColors.textMuted,
                        size: 24,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.label,
                        style: GoogleFonts.dmSans(
                          fontSize: 10,
                          fontWeight:
                              widget.active ? FontWeight.w700 : FontWeight.w500,
                          color: widget.active
                              ? AppColors.violet
                              : AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                // Badge for unread messages
                if (widget.badge != null && widget.badge! > 0)
                  Positioned(
                    right: -4,
                    top: -4,
                    child: Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        color: AppColors.pink,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.bg,
                          width: 2.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.pink.withValues(alpha: 0.4),
                            blurRadius: 8,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          widget.badge! > 9 ? '9+' : '${widget.badge}',
                          style: GoogleFonts.dmSans(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
