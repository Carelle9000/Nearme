import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/router/app_routes.dart';
import '../../core/utils/toasts.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/app_user.dart';
import '../auth/auth_provider.dart';
import '../locale/locale_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;
    final user = context.select<AuthProvider, AppUser?>((a) => a.user);

    if (user == null) {
      return Scaffold(
        backgroundColor: AppColors.bg,
        body: const Center(
          child: CircularProgressIndicator(color: AppColors.violet),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: CustomScrollView(
        slivers: [
          _ProfileSliverHeader(user: user, t: t),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if ((user.bio ?? '').isNotEmpty) ...[
                    const SizedBox(height: 20),
                    _SectionTitle(t('aboutMe')),
                    const SizedBox(height: 8),
                    _InfoCard(
                      child: Text(
                        user.bio!,
                        style: GoogleFonts.dmSans(
                          fontSize: 14,
                          color: AppColors.textSecondary,
                          height: 1.6,
                        ),
                      ),
                    ),
                  ],
                  if (user.interests.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    _SectionTitle(t('myInterests')),
                    const SizedBox(height: 10),
                    _InterestWrap(interests: user.interests),
                  ],
                  const SizedBox(height: 24),
                  _SectionTitle(t('settings')),
                  const SizedBox(height: 10),
                  _SettingsTile(
                    icon: Icons.person_outline_rounded,
                    label: t('editProfile'),
                    onTap: () =>
                        Navigator.of(context).pushNamed(AppRoutes.editProfile),
                  ),
                  const SizedBox(height: 8),
                  _SettingsTile(
                    icon: Icons.language_rounded,
                    label: t('chooseLanguage'),
                    onTap: () =>
                        Navigator.of(context).pushNamed(AppRoutes.langSelect),
                  ),
                  const SizedBox(height: 8),
                  _SettingsTile(
                    icon: Icons.workspace_premium_rounded,
                    label: 'Premium',
                    iconColor: AppColors.gold,
                    onTap: () => _showComingSoon(context),
                  ),
                  const SizedBox(height: 8),
                  _SettingsTile(
                    icon: Icons.logout_rounded,
                    label: t('logout'),
                    iconColor: AppColors.pink,
                    textColor: AppColors.pink,
                    onTap: () => _confirmLogout(context, t),
                  ),
                  const SizedBox(height: 36),
                  Center(
                    child: Text(
                      'NearMe v1.0.0',
                      style: GoogleFonts.dmSans(
                        fontSize: 11,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  static void _showComingSoon(BuildContext context) {
    AppToasts.info(context, 'Premium — coming soon!');
  }

  static Future<void> _confirmLogout(
      BuildContext context, String Function(String) t) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(t('logout')),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(
              'Cancel',
              style: GoogleFonts.dmSans(color: AppColors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.pink),
            child: Text(t('logout')),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      await context.read<AuthProvider>().logout();
      if (context.mounted) {
        Navigator.of(context).pushReplacementNamed(AppRoutes.landing);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sliver header
// ─────────────────────────────────────────────────────────────────────────────

class _ProfileSliverHeader extends StatelessWidget {
  final AppUser user;
  final String Function(String) t;
  const _ProfileSliverHeader({required this.user, required this.t});

  @override
  Widget build(BuildContext context) {
    return SliverAppBar(
      expandedHeight: 240,
      pinned: true,
      backgroundColor: AppColors.surface,
      surfaceTintColor: Colors.transparent,
      automaticallyImplyLeading: false,
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF1A0A2E), Color(0xFF0A0A1C)],
                ),
              ),
            ),
            // Halo décoratif
            Positioned(
              top: -60,
              right: -60,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.violet.withValues(alpha: 0.08),
                ),
              ),
            ),
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: AppColors.violet.withValues(alpha: 0.50),
                          width: 2),
                      color: AppColors.violet.withValues(alpha: 0.10),
                    ),
                    child: const Center(
                      child: Text('👤', style: TextStyle(fontSize: 44)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user.name,
                    style: GoogleFonts.fraunces(
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user.email,
                    style: GoogleFonts.dmSans(
                      fontSize: 12,
                      color: AppColors.textMuted,
                    ),
                  ),
                  if (user.isFaceVerified ?? false) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.emerald.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: AppColors.emerald.withValues(alpha: 0.40),
                            width: 1),
                      ),
                      child: Text(
                        '✓ Verified',
                        style: GoogleFonts.dmSans(
                          color: AppColors.emerald,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      title: Text(
        t('profile'),
        style: GoogleFonts.fraunces(
          fontSize: 17,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
      ),
      centerTitle: true,
      actions: const [],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Composants réutilisables
// ─────────────────────────────────────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Text(
      title.toUpperCase(),
      style: GoogleFonts.dmSans(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: AppColors.textMuted,
        letterSpacing: 1.0,
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final Widget child;
  const _InfoCard({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: child,
    );
  }
}



class _InterestWrap extends StatelessWidget {
  final List<String> interests;
  const _InterestWrap({required this.interests});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: interests
          .map((tag) => Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 13, vertical: 7),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Text(
                  tag,
                  style: GoogleFonts.dmSans(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
              ))
          .toList(),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color? iconColor;
  final Color? textColor;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.label,
    required this.onTap,
    this.iconColor,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveIconColor = iconColor ?? AppColors.textSecondary;
    final effectiveTextColor = textColor ?? AppColors.textPrimary;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Icon(icon, color: effectiveIconColor, size: 20),
            const SizedBox(width: 13),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.dmSans(
                  fontSize: 14,
                  color: effectiveTextColor,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Icon(Icons.chevron_right_rounded,
                color: AppColors.textMuted, size: 18),
          ],
        ),
      ),
    );
  }
}
