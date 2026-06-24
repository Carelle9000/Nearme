import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/router/app_routes.dart';
import '../../core/theme/app_colors.dart';

import '../locale/locale_provider.dart';
import 'package:provider/provider.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentIndex = 0;

  List<OnboardingData> _getPages(String Function(String) t) => [
    OnboardingData(
      title: t('realProximityTitle'),
      description: t('realProximityDesc'),
      image: 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?q=80&w=2070&auto=format&fit=crop',
      icon: Icons.location_on_rounded,
    ),
    OnboardingData(
      title: t('maxSafetyTitle'),
      description: t('maxSafetyDesc'),
      image: 'https://images.unsplash.com/photo-1557200134-90327ee9fafa?q=80&w=2070&auto=format&fit=crop',
      icon: Icons.verified_user_rounded,
    ),
    OnboardingData(
      title: t('instantConnectionsTitle'),
      description: t('instantConnectionsDesc'),
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2070&auto=format&fit=crop',
      icon: Icons.bolt_rounded,
    ),
  ];

  void _onNext(int totalPages) {
    if (_currentIndex < totalPages - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOutCubic,
      );
    } else {
      Navigator.of(context).pushNamed(AppRoutes.languageSelect);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.watch<LocaleProvider>().t;
    final pages = _getPages(t);

    return Scaffold(
      body: Stack(
        children: [
          // Background Gradient (Bleu Nuit)
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0xFF09090E), // Deep black-blue
                    Color(0xFF0F172A), // Slate 900
                    Color(0xFF1E1B4B), // Indigo/Midnight (AppColors.purple)
                  ],
                ),
              ),
            ),
          ),

          // Ambient Glows
          const _AmbientGlow(
            offset: Offset(0.8, 0.2),
            color: AppColors.violet,
            radius: 200,
            opacity: 0.1,
          ),
          const _AmbientGlow(
            offset: Offset(0.2, 0.7),
            color: AppColors.pink,
            radius: 180,
            opacity: 0.05,
          ),

          // PageView
          PageView.builder(
            controller: _pageController,
            onPageChanged: (index) => setState(() => _currentIndex = index),
            itemCount: pages.length,
            itemBuilder: (context, index) {
              return _OnboardingPage(data: pages[index]);
            },
          ),

          // Navigation and Dots
          Positioned(
            bottom: 60,
            left: 32,
            right: 32,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Indicators
                Row(
                  children: List.generate(
                    pages.length,
                    (index) => AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.only(right: 8),
                      height: 8,
                      width: _currentIndex == index ? 24 : 8,
                      decoration: BoxDecoration(
                        color: _currentIndex == index
                            ? AppColors.violet
                            : AppColors.textMuted.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ),

                // Next Button
                GestureDetector(
                  onTap: () => _onNext(pages.length),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.violet,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.violet.withValues(alpha: 0.4),
                          blurRadius: 15,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Icon(
                      _currentIndex == pages.length - 1
                          ? Icons.check_rounded
                          : Icons.arrow_forward_ios_rounded,
                      color: Colors.white,
                      size: 24,
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

class OnboardingData {
  final String title;
  final String description;
  final String image;
  final IconData icon;

  OnboardingData({
    required this.title,
    required this.description,
    required this.image,
    required this.icon,
  });
}

class _OnboardingPage extends StatelessWidget {
  final OnboardingData data;

  const _OnboardingPage({required this.data});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Image with schematic border
          Stack(
            alignment: Alignment.center,
            children: [
              // Rotating decorative ring (static for now)
              Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.violet.withValues(alpha: 0.2),
                    width: 1,
                  ),
                ),
              ),
              Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  image: DecorationImage(
                    image: NetworkImage(data.image),
                    fit: BoxFit.cover,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.3),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
              ),
              // Icon Badge
              Positioned(
                bottom: 10,
                right: 20,
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceHigh,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.violet, width: 2),
                  ),
                  child: Icon(data.icon, color: AppColors.violet, size: 28),
                ),
              ),
            ],
          ),
          const SizedBox(height: 60),
          Text(
            data.title,
            textAlign: TextAlign.center,
            style: GoogleFonts.fraunces(
              fontSize: 32,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            data.description,
            textAlign: TextAlign.center,
            style: GoogleFonts.dmSans(
              fontSize: 16,
              color: AppColors.textSecondary,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }
}

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
          filter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
          child: Container(color: Colors.transparent),
        ),
      ),
    );
  }
}
