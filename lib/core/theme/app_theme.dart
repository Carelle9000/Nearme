import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData light() {
    final base = ThemeData.dark(useMaterial3: true);

    // Body → DM Sans (clean geometric, excellent lisibilité sur dark)
    final bodyBase = GoogleFonts.dmSansTextTheme(base.textTheme);

    // Fusion : titres Fraunces (Serif éditorial moderne), corps DM Sans
    final textTheme = bodyBase
        .copyWith(
          displayLarge: GoogleFonts.fraunces(
            fontSize: 48,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
            letterSpacing: -1.5,
            height: 1.05,
          ),
          displayMedium: GoogleFonts.fraunces(
            fontSize: 38,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
            letterSpacing: -1.0,
            height: 1.1,
          ),
          headlineLarge: GoogleFonts.fraunces(
            fontSize: 30,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
            height: 1.2,
          ),
          headlineMedium: GoogleFonts.fraunces(
            fontSize: 24,
            fontWeight: FontWeight.w500,
            color: AppColors.textPrimary,
            height: 1.2,
          ),
          headlineSmall: GoogleFonts.fraunces(
            fontSize: 20,
            fontWeight: FontWeight.w500,
            color: AppColors.textPrimary,
          ),
          titleLarge: GoogleFonts.dmSans(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
          titleMedium: GoogleFonts.dmSans(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
          bodyLarge: GoogleFonts.dmSans(
            fontSize: 16,
            color: AppColors.textSecondary,
            height: 1.6,
          ),
          bodyMedium: GoogleFonts.dmSans(
            fontSize: 14,
            color: AppColors.textSecondary,
            height: 1.6,
          ),
        )
        .apply(
          bodyColor: AppColors.textPrimary,
          displayColor: AppColors.textPrimary,
          fontFamilyFallback: ['Noto Color Emoji'],
        );

    return base.copyWith(
      scaffoldBackgroundColor: AppColors.bg,
      colorScheme: base.colorScheme.copyWith(
        primary: AppColors.violet,
        secondary: AppColors.pink,
        surface: AppColors.surface,
        onSurface: AppColors.textPrimary,
        error: const Color(0xFFEF4444),
      ),
      textTheme: textTheme,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.bg,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: AppColors.border, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: const BorderSide(color: AppColors.violet, width: 1.5),
        ),
        hintStyle:
            const TextStyle(color: AppColors.textMuted, fontSize: 15),
        labelStyle: const TextStyle(color: AppColors.textSecondary),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.violet,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(28),
          ),
          textStyle: GoogleFonts.dmSans(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.2,
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.surface,
        selectedColor: AppColors.violet,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        side: const BorderSide(color: AppColors.border),
        labelStyle: GoogleFonts.dmSans(
          fontSize: 13,
          color: AppColors.textSecondary,
        ),
      ),
      dialogTheme: DialogThemeData(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: AppColors.surfaceHigh,
        titleTextStyle: GoogleFonts.dmSans(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
        contentTextStyle: GoogleFonts.dmSans(
          fontSize: 14,
          color: AppColors.textSecondary,
          height: 1.5,
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected)
              ? AppColors.violet
              : AppColors.textMuted,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected)
              ? AppColors.violet.withValues(alpha: 0.30)
              : AppColors.surface,
        ),
      ),
      sliderTheme: SliderThemeData(
        activeTrackColor: AppColors.violet,
        thumbColor: AppColors.violet,
        inactiveTrackColor: AppColors.border,
        overlayColor: AppColors.violet.withValues(alpha: 0.15),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.surfaceHigh,
        surfaceTintColor: Colors.transparent,
      ),
    );
  }

  /// Titre — Fraunces (Serif éditorial, premium sur dark)
  static TextStyle display({
    double size = 30,
    Color color = AppColors.textPrimary,
    FontWeight weight = FontWeight.w600,
  }) =>
      GoogleFonts.fraunces(
        fontSize: size,
        fontWeight: weight,
        color: color,
        letterSpacing: -0.4,
        height: 1.15,
      );

  /// Corps — DM Sans (Sans-Serif, lisibilité maximale sur dark)
  static TextStyle body({
    double size = 16,
    Color color = AppColors.textSecondary,
    FontWeight weight = FontWeight.normal,
  }) =>
      GoogleFonts.dmSans(
        fontSize: size,
        fontWeight: weight,
        color: color,
        height: 1.6,
      );
}
