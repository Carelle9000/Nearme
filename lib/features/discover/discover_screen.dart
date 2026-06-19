import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/profile.dart';
import '../auth/auth_provider.dart';
import '../locale/locale_provider.dart';
import '../matches/matches_provider.dart';
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
  bool _listenerAdded = false;
  String? _lastCountryCode;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_listenerAdded) {
      _listenerAdded = true;
      context.read<DiscoverProvider>().addListener(_onDiscoverChange);
    }

    // Update country filter if user changed their location
    final locale = context.read<LocaleProvider>();
    if (_lastCountryCode != locale.country.code) {
      _lastCountryCode = locale.country.code;
      context.read<DiscoverProvider>().setCountryFilter(locale.country.code);
    }
  }

  @override
  void dispose() {
    try {
      context.read<DiscoverProvider>().removeListener(_onDiscoverChange);
    } catch (_) {}
    super.dispose();
  }

  void _onDiscoverChange() {
    final dp = context.read<DiscoverProvider>();
    final match = dp.lastMatch;
    if (match == null || !mounted) return;

    context.read<MatchesProvider>().addMatch(match);
    final matchId = context.read<MatchesProvider>().matches.first.id;
    dp.clearLastMatch();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
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
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            _Header(
              t: t,
              location: '${locale.country.flag} ${locale.country.name}',
            ),
            _TrialBanner(t: t),
            Expanded(child: _Deck(provider: discover)),
            _ActionRow(provider: discover),
          ],
        ),
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
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 16, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Logo + wordmark
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'NearMe',
                style: GoogleFonts.fraunces(
                  fontSize: 22,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  Container(
                    width: 5,
                    height: 5,
                    decoration: const BoxDecoration(
                      color: AppColors.emerald,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    location,
                    style: GoogleFonts.dmSans(
                      fontSize: 11,
                      color: AppColors.textMuted,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const Spacer(),
          // Actions icônes
          _IconAction(
            icon: Icons.tune_rounded,
            onTap: () => showFilterPanel(context),
          ),
          const SizedBox(width: 6),
          _IconAction(
            icon: Icons.language_rounded,
            onTap: () =>
                Navigator.of(context).pushNamed(AppRoutes.langSelect),
          ),
          const SizedBox(width: 6),
          _IconAction(
            icon: Icons.logout_rounded,
            onTap: () async {
              await context.read<AuthProvider>().logout();
              if (!context.mounted) return;
              Navigator.of(context)
                  .pushReplacementNamed(AppRoutes.landing);
            },
          ),
        ],
      ),
    );
  }
}

class _IconAction extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _IconAction({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Icon(icon, color: AppColors.textSecondary, size: 18),
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
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 9),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: 0.08),
        border: Border(
          top: BorderSide(
              color: AppColors.gold.withValues(alpha: 0.20), width: 1),
          bottom: BorderSide(
              color: AppColors.gold.withValues(alpha: 0.20), width: 1),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            t('trialBanner'),
            style: GoogleFonts.dmSans(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppColors.gold.withValues(alpha: 0.85),
            ),
          ),
          Text(
            '6 days left →',
            style: GoogleFonts.dmSans(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.gold,
            ),
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
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: AppColors.surface,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.border),
              ),
              child: const Center(
                child: Text('✨', style: TextStyle(fontSize: 32)),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'All caught up',
              style: GoogleFonts.fraunces(
                fontSize: 22,
                fontWeight: FontWeight.w500,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'No more profiles nearby right now.',
              style: GoogleFonts.dmSans(
                fontSize: 14,
                color: AppColors.textMuted,
              ),
            ),
            const SizedBox(height: 24),
            OutlinedButton(
              onPressed: provider.reset,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.violet,
                side: const BorderSide(color: AppColors.border),
                shape: const StadiumBorder(),
                padding: const EdgeInsets.symmetric(
                    horizontal: 28, vertical: 12),
              ),
              child: Text(
                'Reset deck',
                style: GoogleFonts.dmSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.violetGlow,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 360),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 280),
            switchInCurve: Curves.easeOut,
            switchOutCurve: Curves.easeIn,
            child: _SwipeCard(
              key: ValueKey('${profile.name}-${provider.index}'),
              profile: profile,
              index: provider.index,
              provider: provider,
            ),
          ),
        ),
      ),
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

  const _SwipeCard({
    super.key,
    required this.profile,
    required this.index,
    required this.provider,
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

  static const double _swipeThreshold = 100.0;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    )
      ..addListener(() {
        if (!_snapping) return;
        final t = Curves.easeOut.transform(_ctrl.value);
        setState(() {
          _dx = _startDx * (1 - t);
          _dy = _startDy * (1 - t);
        });
      })
      ..addStatusListener((s) {
        if (s == AnimationStatus.completed && _snapping) {
          setState(() {
            _snapping = false;
            _dx = 0;
            _dy = 0;
          });
        }
      });
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
    if (_dx > _swipeThreshold) {
      widget.provider.swipe(SwipeAction.like);
      setState(() {
        _dx = 0;
        _dy = 0;
      });
    } else if (_dx < -_swipeThreshold) {
      widget.provider.swipe(SwipeAction.nope);
      setState(() {
        _dx = 0;
        _dy = 0;
      });
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

    return GestureDetector(
      onPanStart: _onPanStart,
      onPanUpdate: _onPanUpdate,
      onPanEnd: _onPanEnd,
      child: Transform.translate(
        offset: Offset(_dx, _dy),
        child: Transform.rotate(
          angle: (_dx / 320).clamp(-0.35, 0.35) * 0.15,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              ProfileCard(profile: widget.profile),
              // ── LIKE stamp
              if (likeOpacity > 0)
                Positioned(
                  top: 24,
                  left: 20,
                  child: Opacity(
                    opacity: likeOpacity,
                    child: Transform.rotate(
                      angle: -0.35,
                      child: _Stamp(
                        text: 'LIKE',
                        color: AppColors.pink,
                      ),
                    ),
                  ),
                ),
              // ── NOPE stamp
              if (nopeOpacity > 0)
                Positioned(
                  top: 24,
                  right: 20,
                  child: Opacity(
                    opacity: nopeOpacity,
                    child: Transform.rotate(
                      angle: 0.35,
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
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
          decoration: BoxDecoration(
            color: AppColors.bg.withValues(alpha: 0.85),
            border: Border(
              top: BorderSide(
                  color: AppColors.border.withValues(alpha: 0.5)),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              // Nope — grand bouton gauche
              _ActionBtn(
                size: 62,
                onTap: () => provider.swipe(SwipeAction.nope),
                bg: AppColors.surface,
                border: AppColors.border,
                child: const Icon(
                  Icons.close_rounded,
                  color: AppColors.textMuted,
                  size: 26,
                ),
              ),

              // Super Like — bouton central plus petit
              _ActionBtn(
                size: 50,
                onTap: () => provider.swipe(SwipeAction.superLike),
                bg: AppColors.gold.withValues(alpha: 0.10),
                border: AppColors.gold.withValues(alpha: 0.20),
                child: const Icon(
                  Icons.star_rounded,
                  color: AppColors.gold,
                  size: 22,
                ),
              ),

              // Like — bouton droit, dominant, glow rose
              _ActionBtn(
                size: 62,
                onTap: () => provider.swipe(SwipeAction.like),
                bg: AppColors.pink,
                shadow: AppColors.pink.withValues(alpha: 0.45),
                child: const Icon(
                  Icons.favorite_rounded,
                  color: Colors.white,
                  size: 26,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
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
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: bg,
          shape: BoxShape.circle,
          border: border != null
              ? Border.all(color: border!, width: 1.5)
              : null,
          boxShadow: shadow != null
              ? [
                  BoxShadow(
                    color: shadow!,
                    blurRadius: 20,
                    spreadRadius: -2,
                    offset: const Offset(0, 6),
                  ),
                ]
              : null,
        ),
        child: Center(child: child),
      ),
    );
  }
}
