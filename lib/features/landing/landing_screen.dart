import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:video_player/video_player.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';
import '../locale/locale_provider.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen> {
  VideoPlayerController? _videoCtrl;
  bool _videoReady = false;

  @override
  void initState() {
    super.initState();
    _initVideo();
  }

  Future<void> _initVideo() async {
    try {
      final ctrl = VideoPlayerController.asset('assets/videos/couple_loop.mp4');
      await ctrl.initialize();
      await ctrl.setLooping(true);
      await ctrl.setVolume(0.0);
      await ctrl.play();
      if (mounted) {
        setState(() { _videoCtrl = ctrl; _videoReady = true; });
      } else {
        await ctrl.dispose();
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _videoCtrl?.dispose();
    super.dispose();
  }

  void _start() => Navigator.of(context).pushNamed(AppRoutes.onboarding);

  void _showLegal(String title, String content) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (_, controller) => Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(2))),
              const SizedBox(height: 24),
              Text(title, style: GoogleFonts.fraunces(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
              const SizedBox(height: 24),
              Expanded(
                child: ListView(
                  controller: controller,
                  children: [
                    Text(content, style: GoogleFonts.dmSans(color: AppColors.textSecondary, height: 1.6, fontSize: 14)),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Background
          if (_videoReady && _videoCtrl != null)
            FittedBox(fit: BoxFit.cover, child: SizedBox(width: _videoCtrl!.value.size.width, height: _videoCtrl!.value.size.height, child: VideoPlayer(_videoCtrl!)))
          else ...[
            Container(decoration: const BoxDecoration(gradient: AppColors.midnightGradient)),
            const _AmbientGlow(offset: Offset(0.75, 0.15), color: AppColors.violet, radius: 320, opacity: 0.15),
            const _AmbientGlow(offset: Offset(0.10, 0.55), color: AppColors.pink, radius: 260, opacity: 0.1),
            const Positioned.fill(child: _DotGrid()),
          ],

          Container(decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0x22000000), Color(0x66000000), Color(0xAA000000)]))),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                children: [
                  const Spacer(flex: 3),
                  Column(
                    children: [
                      Container(
                        width: 72, height: 72,
                        decoration: BoxDecoration(shape: BoxShape.circle, gradient: AppColors.violetGradient, boxShadow: [BoxShadow(color: AppColors.violet.withValues(alpha: 0.5), blurRadius: 30, spreadRadius: 5)]),
                        child: const Icon(Icons.near_me_rounded, color: Colors.white, size: 34),
                      ),
                      const SizedBox(height: 20),
                      Text('NearMe', style: GoogleFonts.fraunces(fontSize: 36, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -1.0)),
                      const SizedBox(height: 8),
                      Text(t('meetPeopleNearby'), textAlign: TextAlign.center, style: GoogleFonts.dmSans(fontSize: 13, color: Colors.white.withValues(alpha: 0.7), letterSpacing: 0.2)),
                    ],
                  ),
                  const Spacer(flex: 4),
                  SizedBox(
                    width: double.infinity,
                    child: Container(
                      decoration: BoxDecoration(borderRadius: BorderRadius.circular(26), boxShadow: [BoxShadow(color: AppColors.violet.withValues(alpha: 0.45), blurRadius: 25, offset: const Offset(0, 8))]),
                      child: ElevatedButton(
                        onPressed: _start,
                        style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), backgroundColor: AppColors.violet, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24))),
                        child: Text(t('startNow'), style: GoogleFonts.dmSans(fontSize: 15, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 12,
                    children: [
                      _LegalLink(label: t('privacyPolicyTitle'), onTap: () => _showLegal(t('privacyPolicyTitle'), t('privacy_policy_content'))),
                      Container(width: 4, height: 4, decoration: const BoxDecoration(color: Colors.white24, shape: BoxShape.circle)),
                      _LegalLink(label: t('safetyRulesTitle'), onTap: () => _showLegal(t('safetyRulesTitle'), t('safety_rules_content'))),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(t('termsOfUseShort'), textAlign: TextAlign.center, style: GoogleFonts.dmSans(fontSize: 10, color: Colors.white.withValues(alpha: 0.3), height: 1.6)),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LegalLink extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _LegalLink({required this.label, required this.onTap});
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Text(label, style: GoogleFonts.dmSans(fontSize: 11, color: Colors.white.withValues(alpha: 0.5), decoration: TextDecoration.underline, decorationColor: Colors.white.withValues(alpha: 0.2))),
    );
  }
}

const _privacyPolicy = """
Chez NearMe, nous prenons votre vie privée très au sérieux.

1. Collecte des données
Nous collectons les informations que vous nous fournissez directement : nom, email, photos, et préférences de profil. Nous utilisons également votre localisation en temps réel pour vous proposer des rencontres pertinentes à proximité.

2. Utilisation de la localisation
Votre position exacte n'est jamais partagée avec d'autres utilisateurs. Nous affichons uniquement une distance approximative pour préserver votre sécurité.

3. Partage des données
Nous ne vendons jamais vos données personnelles à des tiers. Vos informations sont utilisées exclusivement pour le bon fonctionnement de l'application et l'amélioration de votre expérience.

4. Sécurité
Toutes vos données sont cryptées et stockées sur des serveurs sécurisés. Vous pouvez supprimer votre compte et vos données à tout moment depuis les paramètres.
""";

const _safetyRules = """
Pour que NearMe reste un endroit sûr et agréable pour tous :

1. Soyez respectueux
Les comportements abusifs, le harcèlement ou les discours de haine ne sont pas tolérés. Tout signalement fera l'objet d'une enquête immédiate.

2. Authenticité
Utilisez de vraies photos de vous. L'usurpation d'identité est strictement interdite et entraîne un bannissement définitif.

3. Rencontres réelles
Lorsque vous rencontrez quelqu'un pour la première fois, faites-le dans un lieu public et informez un proche de vos projets.

4. Signalement
N'hésitez pas à signaler tout profil suspect ou comportement déplacé. Notre équipe de modération est active 24/7.
""";

class _AmbientGlow extends StatelessWidget {
  final Offset offset;
  final Color color;
  final double radius;
  final double opacity;
  const _AmbientGlow({required this.offset, required this.color, required this.radius, required this.opacity});
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Positioned(
      left: size.width * offset.dx - radius, top: size.height * offset.dy - radius,
      child: Container(width: radius * 2, height: radius * 2, decoration: BoxDecoration(shape: BoxShape.circle, color: color.withValues(alpha: opacity)), child: BackdropFilter(filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80), child: Container(color: Colors.transparent))),
    );
  }
}

class _DotGrid extends StatelessWidget {
  const _DotGrid();
  @override
  Widget build(BuildContext context) {
    return CustomPaint(painter: _DotGridPainter());
  }
}

class _DotGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0x0CFFFFFF)..style = PaintingStyle.fill;
    const step = 28.0; const dotRadius = 1.0;
    for (var x = step / 2; x < size.width; x += step) {
      for (var y = step / 2; y < size.height; y += step) {
        canvas.drawCircle(Offset(x, y), dotRadius, paint);
      }
    }
  }
  @override bool shouldRepaint(_DotGridPainter oldDelegate) => false;
}
