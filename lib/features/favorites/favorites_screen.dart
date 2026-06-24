import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_colors.dart';
import '../auth/auth_provider.dart';
import '../discover/widgets/profile_card.dart';
import 'favorites_provider.dart';

class FavoritesScreen extends StatelessWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final t = context.watch<AuthProvider>(); // To watch favorites list in user model
    final provider = context.watch<FavoritesProvider>();
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
                  child: Text(
                    'My Favorites',
                    style: GoogleFonts.fraunces(
                      fontSize: 32,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
                Expanded(
                  child: provider.isLoading
                      ? const Center(child: CircularProgressIndicator(color: AppColors.violet))
                      : (provider.favorites.isEmpty)
                          ? _EmptyState()
                          : GridView.builder(
                              padding: const EdgeInsets.all(16),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.7,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                              ),
                              itemCount: provider.favorites.length,
                              itemBuilder: (context, index) {
                                final profile = provider.favorites[index];
                                return ClipRRect(
                                  borderRadius: BorderRadius.circular(20),
                                  child: ProfileCard(
                                    profile: profile,
                                    isFavorite: auth.user?.favorites.contains(profile.id) ?? true,
                                    height: double.infinity,
                                    onFavorite: () async {
                                      final user = auth.user;
                                      if (user != null) {
                                        await auth.toggleFavorite(profile.id);
                                        // Refresh the list after toggle
                                        if (context.mounted) {
                                          context.read<FavoritesProvider>().refresh(user.id);
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
          Icon(
            Icons.star_border_rounded,
            size: 64,
            color: Colors.white.withValues(alpha: 0.1),
          ),
          const SizedBox(height: 16),
          Text(
            'No favorites yet',
            style: GoogleFonts.dmSans(
              fontSize: 16,
              color: Colors.white.withValues(alpha: 0.3),
            ),
          ),
        ],
      ),
    );
  }
}
