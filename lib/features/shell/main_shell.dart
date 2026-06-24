import 'dart:async';
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
import '../notifications/notifications_provider.dart';
import '../notifications/notifications_screen.dart';
import '../favorites/favorites_provider.dart';
import '../favorites/favorites_screen.dart';
import '../profile/profile_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> with WidgetsBindingObserver {
  int _tab = 0;
  Timer? _presenceTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      if (auth.user != null) {
        context.read<MatchesProvider>().init(auth.user!.id);
        context.read<FavoritesProvider>().loadFavorites(auth.user!.id);
        context.read<NotificationsProvider>().init(auth.user!.id);
        auth.updatePresence(true);
      }
      _startPresenceTimer();
    });
  }

  void _startPresenceTimer() {
    _presenceTimer?.cancel();
    _presenceTimer = Timer.periodic(const Duration(minutes: 3), (timer) {
      final auth = context.read<AuthProvider>();
      if (auth.user != null && auth.isLoggedIn) {
        auth.updatePresence(true);
      }
    });
  }

  @override
  void dispose() {
    _presenceTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    final auth = context.read<AuthProvider>();
    if (auth.user == null) return;

    if (state == AppLifecycleState.resumed) {
      auth.updatePresence(true);
    } else if (state == AppLifecycleState.paused ||
               state == AppLifecycleState.inactive ||
               state == AppLifecycleState.detached) {
      auth.updatePresence(false);
    }
  }

  static const _screens = [
    DiscoverScreen(),
    MatchesScreen(), // ❤️ Matchs
    Center(child: Text('Messages Coming Soon', style: TextStyle(color: Colors.white))), // 💬 Messages
    FavoritesScreen(), // ⭐ Favoris
    ProfileScreen(), // 👤 Profil
  ];

  @override
  Widget build(BuildContext context) {
    final unreadMatches =
        context.select<MatchesProvider, int>((mp) => mp.unreadCount);

    return Scaffold(
      extendBody: true,
      body: IndexedStack(index: _tab, children: _screens),
      bottomNavigationBar: _ModernBottomNav(
        currentIndex: _tab,
        unreadCount: unreadMatches,
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
                    label: 'Discover',
                    active: currentIndex == 0,
                    onTap: () => onTap(0),
                  ),
                  _ModernNavItem(
                    icon: Icons.favorite_outline_rounded,
                    activeIcon: Icons.favorite_rounded,
                    label: 'Matches',
                    active: currentIndex == 1,
                    onTap: () => onTap(1),
                  ),
                  _ModernNavItem(
                    icon: Icons.chat_bubble_outline_rounded,
                    activeIcon: Icons.chat_bubble_rounded,
                    label: 'Messages',
                    active: currentIndex == 2,
                    badge: unreadCount > 0 ? unreadCount : null,
                    onTap: () => onTap(2),
                  ),
                  _ModernNavItem(
                    icon: Icons.star_outline_rounded,
                    activeIcon: Icons.star_rounded,
                    label: 'Favorites',
                    active: currentIndex == 3,
                    onTap: () => onTap(3),
                  ),
                  _ModernNavItem(
                    icon: Icons.person_outline_rounded,
                    activeIcon: Icons.person_rounded,
                    label: 'Profile',
                    active: currentIndex == 4,
                    onTap: () => onTap(4),
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
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
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
        child: SizedBox(
          width: 70,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(
                    widget.active ? widget.activeIcon : widget.icon,
                    color: widget.active
                        ? AppColors.violet
                        : Colors.white.withValues(alpha: 0.3),
                    size: 24,
                  ),
                  // Badge for unread messages
                  if (widget.badge != null && widget.badge! > 0)
                    Positioned(
                      right: -6,
                      top: -4,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: AppColors.pink,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 14,
                          minHeight: 14,
                        ),
                        child: Center(
                          child: Text(
                            widget.badge! > 9 ? '!' : '${widget.badge}',
                            style: GoogleFonts.dmSans(
                              color: Colors.white,
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              if (widget.active)
                Container(
                  width: 4,
                  height: 4,
                  decoration: const BoxDecoration(
                    color: AppColors.violet,
                    shape: BoxShape.circle,
                  ),
                )
              else
                Text(
                  widget.label,
                  style: GoogleFonts.dmSans(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: Colors.white.withValues(alpha: 0.3),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
