import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../auth/auth_provider.dart';
import '../discover/widgets/profile_card.dart';
import 'likes_provider.dart';

class LikesScreen extends StatelessWidget {
  const LikesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<LikesProvider>();
    final auth = context.read<AuthProvider>();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Background
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF09090E),
                    Color(0xFF0F172A),
                  ],
                ),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 10),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Who Likes Me',
                        style: GoogleFonts.fraunces(
                          fontSize: 32,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.pink.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppColors.pink.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Text(
                          '${provider.likes.length}',
                          style: GoogleFonts.dmSans(
                            color: AppColors.pink,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: provider.isLoading
                      ? const Center(child: CircularProgressIndicator(color: AppColors.violet))
                      : (provider.likes.isEmpty)
                          ? _EmptyState()
                          : GridView.builder(
                              padding: const EdgeInsets.all(16),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.7,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                              ),
                              itemCount: provider.likes.length,
                              itemBuilder: (context, index) {
                                final profile = provider.likes[index];
                                final isFav = auth.user?.favorites.contains(profile.id) ?? false;
                                return ClipRRect(
                                  borderRadius: BorderRadius.circular(20),
                                  child: ProfileCard(
                                    profile: profile,
                                    isFavorite: isFav,
                                    height: double.infinity,
                                    onFavorite: () async {
                                      final user = auth.user;
                                      if (user != null) {
                                        await auth.toggleFavorite(profile.id);
                                        if (context.mounted) {
                                          context.read<LikesProvider>().refresh(user.id);
                                        }
                                      }
                                    },
                                  ),
                                );
                              },
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

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
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
            'No likes yet',
            style: GoogleFonts.fraunces(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              color: Colors.white,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(
            'When someone likes your profile, they\'ll appear here',
            style: GoogleFonts.dmSans(
              fontSize: 14,
              color: Colors.white.withValues(alpha: 0.4),
              height: 1.6,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
