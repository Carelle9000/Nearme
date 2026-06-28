import 'package:flutter/material.dart';

class ColorPalette {
  final Color bg;
  final Color surface;
  final Color surfaceHigh;
  final Color violet;
  final Color violetGlow;
  final Color purple;
  final Color pink;
  final Color gold;
  final Color goldLight;
  final Color emerald;
  final Color cyan;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color border;
  final Color borderLight;
  final Color error;
  final LinearGradient violetGradient;
  final LinearGradient purpleGradient;
  final LinearGradient pinkGradient;
  final LinearGradient cyanGradient;
  final LinearGradient darkGradient;
  final LinearGradient midnightGradient;

  const ColorPalette({
    required this.bg,
    required this.surface,
    required this.surfaceHigh,
    required this.violet,
    required this.violetGlow,
    required this.purple,
    required this.pink,
    required this.gold,
    required this.goldLight,
    required this.emerald,
    required this.cyan,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.border,
    required this.borderLight,
    required this.error,
    required this.violetGradient,
    required this.purpleGradient,
    required this.pinkGradient,
    required this.cyanGradient,
    required this.darkGradient,
    required this.midnightGradient,
  });
}

final ColorPalette appColorsDark = ColorPalette(
  bg: const Color(0xFF000000),
  surface: const Color(0xFF1A1A1A),
  surfaceHigh: const Color(0xFF242424),
  violet: const Color(0xFFCE1B3B),
  violetGlow: const Color(0xFFFF4D6A),
  purple: const Color(0xFF3D0018),
  pink: const Color(0xFFFF6B8A),
  gold: const Color(0xFFFBBF24),
  goldLight: const Color(0x1AFBBF24),
  emerald: const Color(0xFF34D399),
  cyan: const Color(0xFF22D3EE),
  textPrimary: const Color(0xFFF1F0F5),
  textSecondary: const Color(0xFF9CA3AF),
  textMuted: const Color(0xFF4B5563),
  border: const Color(0xFF252534),
  borderLight: const Color(0xFF2F2F40),
  error: const Color(0xFFEF4444),
  violetGradient: const LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFF3357), Color(0xFFBE1030)],
  ),
  purpleGradient: const LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF000000), Color(0xFF1A1A1A)],
  ),
  pinkGradient: const LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFF6B8A), Color(0xFFE8334A)],
  ),
  cyanGradient: const LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF22D3EE), Color(0xFF06B6D4)],
  ),
  darkGradient: const LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF000000), Color(0xFF1A1A1A)],
  ),
  midnightGradient: const LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [
      Color(0xFF000000),
      Color(0xFF0F0F0F),
      Color(0xFF1A1A1A),
    ],
  ),
);

final ColorPalette appColorsLight = ColorPalette(
  bg: const Color(0xFFFAFAFA),
  surface: const Color(0xFFFFFFFF),
  surfaceHigh: const Color(0xFFF3F4F6),
  violet: const Color(0xFFCE1B3B),
  violetGlow: const Color(0xFFFF4D6A),
  purple: const Color(0xFFDEE0ED),
  pink: const Color(0xFFFF6B8A),
  gold: const Color(0xFFFBBF24),
  goldLight: const Color(0x1AFBBF24),
  emerald: const Color(0xFF34D399),
  cyan: const Color(0xFF22D3EE),
  textPrimary: const Color(0xFF1F2937),
  textSecondary: const Color(0xFF6B7280),
  textMuted: const Color(0xFF9CA3AF),
  border: const Color(0xFFE5E7EB),
  borderLight: const Color(0xFFF3F4F6),
  error: const Color(0xFFDC2626),
  violetGradient: const LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFF3357), Color(0xFFBE1030)],
  ),
  purpleGradient: const LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFFFAFAFA), Color(0xFFFFFFFF)],
  ),
  pinkGradient: const LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFF6B8A), Color(0xFFE8334A)],
  ),
  cyanGradient: const LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF22D3EE), Color(0xFF06B6D4)],
  ),
  darkGradient: const LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFFFAFAFA), Color(0xFFFFFFFF)],
  ),
  midnightGradient: const LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [
      Color(0xFFFAFAFA),
      Color(0xFFF3F4F6),
      Color(0xFFFFFFFF),
    ],
  ),
);

// Backward compat - static access to dark colors
class AppColors {
  AppColors._();

  static const bg           = Color(0xFF000000);
  static const dark         = Color(0xFF000000);
  static const surface      = Color(0xFF1A1A1A);
  static const surfaceHigh  = Color(0xFF242424);
  static const violet       = Color(0xFFCE1B3B);
  static const violetGlow   = Color(0xFFFF4D6A);
  static const purple       = Color(0xFF3D0018);
  static const pink         = Color(0xFFFF6B8A);
  static const gold         = Color(0xFFFBBF24);
  static const goldLight    = Color(0x1AFBBF24);
  static const emerald      = Color(0xFF34D399);
  static const cyan         = Color(0xFF22D3EE);
  static const textPrimary  = Color(0xFFF1F0F5);
  static const textSecondary= Color(0xFF9CA3AF);
  static const textMuted    = Color(0xFF4B5563);
  static const border       = Color(0xFF252534);
  static const borderLight  = Color(0xFF2F2F40);
  static const error        = Color(0xFFEF4444);
  static const violetGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFF3357), Color(0xFFBE1030)],
  );
  static const purpleGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF000000), Color(0xFF1A1A1A)],
  );
  static const pinkGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFF6B8A), Color(0xFFE8334A)],
  );
  static const cyanGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF22D3EE), Color(0xFF06B6D4)],
  );
  static const darkGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF000000), Color(0xFF1A1A1A)],
  );
  static const midnightGradient = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [
      Color(0xFF000000),
      Color(0xFF0F0F0F),
      Color(0xFF1A1A1A),
    ],
  );
  static const rose      = pink;
  static const navy      = dark;
  static const navyLight = surface;
  static const navy3     = surface;
  static const card      = surface;
  static const text      = textPrimary;
  static const muted     = textMuted;
  static const bgCard    = surface;
}
