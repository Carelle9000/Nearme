import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/toasts.dart';
import '../../core/utils/logout_helper.dart';
import '../../data/models/profile.dart';
import '../auth/auth_provider.dart';
import '../locale/locale_provider.dart';
import '../matches/matches_provider.dart';
import '../notifications/notifications_provider.dart';
import '../notifications/notifications_screen.dart';
import '../favorites/favorites_provider.dart';
import 'discover_provider.dart';
import 'widgets/filter_panel.dart';
import 'widgets/match_modal.dart';
import 'widgets/profile_card.dart';

class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key});

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  DiscoverProvider? _discoverProvider;
  String? _lastCountryCode;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final newProvider = context.read<DiscoverProvider>();
    if (_discoverProvider != newProvider) {
      _discoverProvider?.removeListener(_onDiscoverChange);
      _discoverProvider = newProvider;
      _discoverProvider!.addListener(_onDiscoverChange);
    }

    // Update country filter if user changed their location
    final locale = context.read<LocaleProvider>();
    if (_lastCountryCode != locale.country.code) {
      _lastCountryCode = locale.country.code;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _discoverProvider?.setCountryFilter(locale.country.code);

          final auth = context.read<AuthProvider>();
          if (auth.user != null) {
            _discoverProvider?.loadUsers(auth.user!.id);
          }
        }
      });
    }
  }

  @override
  void dispose() {
    _discoverProvider?.removeListener(_onDiscoverChange);
    super.dispose();
  }

  void _onDiscoverChange() {
    final dp = _discoverProvider;
    if (dp == null || !mounted) return;

    final match = dp.lastMatch;
    if (match == null) return;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;

      // Access providers via context.read inside the callback
      final matchesProvider = context.read<MatchesProvider>();
      matchesProvider.addMatch(match);

      final matchId = matchesProvider.matches.first.id;
      dp.clearLastMatch();

      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (_) => MatchModal(profile: match, matchId: matchId),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;
    final discover = context.watch<DiscoverProvider>();
    final locale = context.watch<LocaleProvider>();

    return Scaffold(
      body: Stack(
        children: [
          // Modern Gradient Background
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: AppColors.midnightGradient,
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

          Positioned.fill(
            child: SafeArea(
              child: Column(
                children: [
                  _Header(
                    t: t,
                    location: '${locale.country.flag} ${locale.country.name}',
                  ),
                  _TrialBanner(t: t),
                  Expanded(
                    child: discover.isLoading
                        ? const Center(
                            child: CircularProgressIndicator(
                              color: AppColors.violet,
                            ),
                          )
                        : _Deck(provider: discover),
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
// Header — minimal dark, identité forte
// ─────────────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  final String Function(String) t;
  final String location;
  const _Header({required this.t, required this.location});

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
              // Logo icon + wordmark
              Container(
                width: 38, height: 38,
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
                    child: const Icon(Icons.near_me_rounded, color: Colors.white, size: 18),
                  ),
                ),
              ),
              const SizedBox(width: 12),
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
                  const SizedBox(height: 4),
                  // Updated Location Pill [ 🇦🇹 Austria ⌵ ]
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
                          location,
                          style: GoogleFonts.dmSans(
                            fontSize: 10,
                            color: Colors.white.withValues(alpha: 0.8),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: 4),
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
              // Actions icônes
              _IconAction(
                icon: Icons.tune_rounded,
                onTap: () => showFilterPanel(context),
              ),
              const SizedBox(width: 8),
              // Notification Bell replaced Language icon
              Consumer<NotificationsProvider>(
                builder: (context, NotificationsProvider np, _) => Stack(
                  clipBehavior: Clip.none,
                  children: [
                    _IconAction(
                      icon: Icons.notifications_none_rounded,
                      onTap: () {
                        // We need a way to navigate to notifications or change tab
                        // For now, let's assume we can push the screen or the shell manages it.
                        // But usually, in a shell, we might want to switch tab.
                        // If it's a button in header, pushing the screen is common too.
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => NotificationsScreen()),
                        );
                      },
                    ),
                    if (np.unreadCount > 0)
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
              ),
              const SizedBox(width: 8),
              _IconAction(
                icon: Icons.logout_rounded,
                onTap: () => confirmLogout(context),
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
  const _IconAction({required this.icon, required this.onTap});

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

// ─────────────────────────────────────────────────────────────────────────────
// Trial banner — dark doré
// ─────────────────────────────────────────────────────────────────────────────

class _TrialBanner extends StatelessWidget {
  final String Function(String) t;
  const _TrialBanner({required this.t});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.gold.withValues(alpha: 0.15),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: AppColors.gold.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.stars_rounded,
              size: 14,
              color: AppColors.gold,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Free Trial Active',
                  style: GoogleFonts.dmSans(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: LinearProgressIndicator(
                    value: 0.6,
                    backgroundColor: Colors.white.withValues(alpha: 0.05),
                    color: AppColors.gold,
                    minHeight: 2,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Text(
            '6 days left',
            style: GoogleFonts.dmSans(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.gold,
            ),
          ),
          const SizedBox(width: 4),
          Icon(
            Icons.chevron_right_rounded,
            size: 16,
            color: AppColors.gold.withValues(alpha: 0.5),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Card deck
// ─────────────────────────────────────────────────────────────────────────────

class _Deck extends StatelessWidget {
  final DiscoverProvider provider;
  const _Deck({required this.provider});

  @override
  Widget build(BuildContext context) {
    final profile = provider.current;
    if (profile == null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Updated Empty State Illustration
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.violet.withValues(alpha: 0.15),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Center(
                child: Icon(
                  Icons.radar_rounded,
                  size: 64,
                  color: AppColors.violet.withValues(alpha: 0.5),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'All caught up',
              style: GoogleFonts.dmSans(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                'No more profiles nearby right now. Come back soon!',
                style: GoogleFonts.dmSans(
                  fontSize: 15,
                  color: Colors.white.withValues(alpha: 0.6),
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 32),
            Container(
              decoration: BoxDecoration(
                gradient: AppColors.violetGradient,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.violet.withValues(alpha: 0.4),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: ElevatedButton(
                onPressed: () async {
                  final auth = context.read<AuthProvider>();
                  try {
                    await provider.reset(auth.user?.id);
                    if (context.mounted) AppToasts.success(context, 'Deck refreshed');
                  } catch (e) {
                    if (context.mounted) AppToasts.error(context, 'Failed to refresh deck');
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(24),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 40, vertical: 16,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.refresh_rounded,
                      size: 20,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Reset Deck',
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
      );
    }

    return Column(
      children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 6, 14, 0),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 360),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 280),
                  switchInCurve: Curves.easeOut,
                  switchOutCurve: Curves.easeIn,
                  child: _SwipeCard(
                    key: ValueKey('${profile.id}-${provider.index}'),
                    profile: profile,
                    index: provider.index,
                    provider: provider,
                    onFavoriteToggle: (isAdded) {
                      if (isAdded) {
                        AppToasts.success(context, 'Added to favorites');
                      } else {
                        AppToasts.info(context, 'Removed from favorites');
                      }
                    },
                  ),
                ),
              ),
            ),
          ),
        ),
        _ActionRow(provider: provider),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Swipeable card
// ─────────────────────────────────────────────────────────────────────────────

class _SwipeCard extends StatefulWidget {
  final Profile profile;
  final int index;
  final DiscoverProvider provider;
  final Function(bool)? onFavoriteToggle;

  const _SwipeCard({
    super.key,
    required this.profile,
    required this.index,
    required this.provider,
    this.onFavoriteToggle,
  });

  @override
  State<_SwipeCard> createState() => _SwipeCardState();
}

class _SwipeCardState extends State<_SwipeCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  double _dx = 0;
  double _dy = 0;
  double _startDx = 0;
  double _startDy = 0;
  bool _snapping = false;
  bool _animatingOut = false;

  static const double _swipeThreshold = 100.0;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    )
      ..addListener(() {
        if (_snapping) {
          final t = Curves.easeOut.transform(_ctrl.value);
          setState(() {
            _dx = _startDx * (1 - t);
            _dy = _startDy * (1 - t);
          });
        } else if (_animatingOut) {
          final t = Curves.easeIn.transform(_ctrl.value);
          setState(() {
            _dx = _startDx + (_swipeThreshold * 5 * (_startDx > 0 ? 1 : -1) * t);
            _dy = _startDy + (_startDy * 2 * t);
          });
        }
      })
      ..addStatusListener((s) {
        if (s == AnimationStatus.completed) {
          if (_snapping) {
            setState(() {
              _snapping = false;
              _dx = 0;
              _dy = 0;
            });
          } else if (_animatingOut) {
            _performSwipe();
          }
        }
      });
  }

  @override
  void didUpdateWidget(_SwipeCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.provider.pendingAction != null && !_animatingOut) {
      _triggerProgrammaticSwipe(widget.provider.pendingAction!);
    }
  }

  void _triggerProgrammaticSwipe(SwipeAction action) {
    _animatingOut = true;
    _snapping = false;
    _startDx = action == SwipeAction.nope ? -1 : 1;
    _startDy = 0;
    _ctrl.forward(from: 0);
  }

  void _performSwipe() {
    final auth = context.read<AuthProvider>();
    final user = auth.user;
    final uid = user?.id ?? '';
    final name = user?.name ?? 'NearMe User';
    final photo = user?.photos?.isNotEmpty == true ? user!.photos!.first : null;

    // Preserve the exact action (especially for Super Like)
    final action = widget.provider.pendingAction ?? (_dx > 0 ? SwipeAction.like : SwipeAction.nope);
    widget.provider.swipe(uid, name, photo, action);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _onPanStart(DragStartDetails d) {
    _snapping = false;
    _ctrl.stop();
  }

  void _onPanUpdate(DragUpdateDetails d) {
    setState(() {
      _dx += d.delta.dx;
      _dy += d.delta.dy * 0.4;
    });
  }

  void _onPanEnd(DragEndDetails d) {
    if (_animatingOut) return;

    final auth = context.read<AuthProvider>();
    final user = auth.user;
    final uid = user?.id ?? '';
    final name = user?.name ?? 'NearMe User';
    final photo = user?.photos?.isNotEmpty == true ? user!.photos!.first : null;

    if (_dx > _swipeThreshold) {
      _animatingOut = true;
      _startDx = _dx;
      _startDy = _dy;
      _ctrl.forward(from: 0);
    } else if (_dx < -_swipeThreshold) {
      _animatingOut = true;
      _startDx = _dx;
      _startDy = _dy;
      _ctrl.forward(from: 0);
    } else {
      _startDx = _dx;
      _startDy = _dy;
      _snapping = true;
      _ctrl.forward(from: 0);
    }
  }

  @override
  Widget build(BuildContext context) {
    final likeOpacity = (_dx / _swipeThreshold).clamp(0.0, 1.0);
    final nopeOpacity = (-_dx / _swipeThreshold).clamp(0.0, 1.0);
    final auth = context.watch<AuthProvider>();

    return GestureDetector(
      onPanStart: _animatingOut ? null : _onPanStart,
      onPanUpdate: _animatingOut ? null : _onPanUpdate,
      onPanEnd: _onPanEnd,
      child: Transform.translate(
        offset: Offset(_dx, _dy),
        child: Transform.rotate(
          angle: (_dx / 400).clamp(-0.35, 0.35),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              ProfileCard(
                profile: widget.profile,
                isFavorite: auth.user?.favorites.contains(widget.profile.id) ?? false,
                onFavorite: () async {
                  if (auth.user != null) {
                    final isRemoving = auth.user!.favorites.contains(widget.profile.id);
                    await auth.toggleFavorite(widget.profile.id);
                    if (context.mounted) {
                      context.read<FavoritesProvider>().refresh(auth.user!.id);
                      widget.onFavoriteToggle?.call(!isRemoving);
                    }
                  }
                },
                onDoubleTap: () {
                  final user = auth.user;
                  if (user != null) {
                    final photo = user.photos?.isNotEmpty == true ? user.photos!.first : null;
                    widget.provider.swipe(user.id, user.name, photo, SwipeAction.like, programmatic: true);
                  }
                },
                onNope: () {
                  final user = auth.user;
                  if (user != null) {
                    final photo = user.photos?.isNotEmpty == true ? user.photos!.first : null;
                    widget.provider.swipe(user.id, user.name, photo, SwipeAction.nope, programmatic: true);
                  }
                },
                onLike: () {
                  final user = auth.user;
                  if (user != null) {
                    final photo = user.photos?.isNotEmpty == true ? user.photos!.first : null;
                    widget.provider.swipe(user.id, user.name, photo, SwipeAction.like, programmatic: true);
                  }
                },
                onSuperLike: () {
                  final user = auth.user;
                  if (user != null) {
                    final photo = user.photos?.isNotEmpty == true ? user.photos!.first : null;
                    widget.provider.swipe(user.id, user.name, photo, SwipeAction.superLike, programmatic: true);
                  }
                },
              ),
              // ── LIKE stamp
              if (likeOpacity > 0 || (_animatingOut && _dx > 0))
                Positioned(
                  top: 40,
                  left: 20,
                  child: Opacity(
                    opacity: _animatingOut ? 1.0 : likeOpacity,
                    child: Transform.rotate(
                      angle: -0.2,
                      child: _Stamp(
                        text: widget.provider.pendingAction == SwipeAction.superLike
                          ? 'SUPER LIKE'
                          : 'LIKE',
                        color: widget.provider.pendingAction == SwipeAction.superLike
                          ? AppColors.gold
                          : AppColors.pink,
                      ),
                    ),
                  ),
                ),
              // ── NOPE stamp
              if (nopeOpacity > 0 || (_animatingOut && _dx < 0))
                Positioned(
                  top: 40,
                  right: 20,
                  child: Opacity(
                    opacity: _animatingOut ? 1.0 : nopeOpacity,
                    child: Transform.rotate(
                      angle: 0.2,
                      child: _Stamp(
                        text: 'NOPE',
                        color: AppColors.textMuted,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Stamp extends StatelessWidget {
  final String text;
  final Color color;
  const _Stamp({required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        border: Border.all(color: color, width: 2.5),
        borderRadius: BorderRadius.circular(8),
        color: color.withValues(alpha: 0.10),
      ),
      child: Text(
        text,
        style: GoogleFonts.dmSans(
          color: color,
          fontSize: 22,
          fontWeight: FontWeight.w800,
          letterSpacing: 3,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Action buttons row — redessinés premium
// ─────────────────────────────────────────────────────────────────────────────

class _ActionRow extends StatelessWidget {
  final DiscoverProvider provider;
  const _ActionRow({required this.provider});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final uid = user?.id ?? '';
    final name = user?.name ?? 'NearMe User';
    final photo = user?.photos?.isNotEmpty == true ? user!.photos!.first : null;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 20),
      decoration: BoxDecoration(
        color: AppColors.bg.withValues(alpha: 0.8),
        border: Border(
          top: BorderSide(
            color: Colors.white.withValues(alpha: 0.05),
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Nope
          _ActionBtn(
            size: 56,
            onTap: () => provider.swipe(uid, name, photo, SwipeAction.nope, programmatic: true),
            bg: Colors.white.withValues(alpha: 0.05),
            border: Colors.white.withValues(alpha: 0.1),
            child: const Icon(
              Icons.close_rounded,
              color: Colors.white,
              size: 24,
            ),
          ),

          // Super Like
          _ActionBtn(
            size: 56,
            onTap: () => provider.swipe(uid, name, photo, SwipeAction.superLike, programmatic: true),
            bg: Colors.white.withValues(alpha: 0.05),
            border: AppColors.gold.withValues(alpha: 0.3),
            child: const Icon(
              Icons.star_rounded,
              color: AppColors.gold,
              size: 24,
            ),
          ),

          // Like
          _ActionBtn(
            size: 56,
            onTap: () => provider.swipe(uid, name, photo, SwipeAction.like, programmatic: true),
            bg: AppColors.violet,
            shadow: AppColors.violet.withValues(alpha: 0.4),
            child: const Icon(
              Icons.favorite_rounded,
              color: Colors.white,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionBtn extends StatefulWidget {
  final double size;
  final VoidCallback onTap;
  final Widget child;
  final Color bg;
  final Color? border;
  final Color? shadow;

  const _ActionBtn({
    required this.size,
    required this.onTap,
    required this.child,
    required this.bg,
    this.border,
    this.shadow,
  });

  @override
  State<_ActionBtn> createState() => _ActionBtnState();
}

class _ActionBtnState extends State<_ActionBtn> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.88).animate(
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
        child: Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            color: widget.bg,
            shape: BoxShape.circle,
            border: widget.border != null
                ? Border.all(color: widget.border!, width: 1.5)
                : null,
            boxShadow: widget.shadow != null
                ? [
                    BoxShadow(
                      color: widget.shadow!,
                      blurRadius: 20,
                      spreadRadius: -2,
                      offset: const Offset(0, 6),
                    ),
                  ]
                : null,
          ),
          child: Center(child: widget.child),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ambient Glow
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
