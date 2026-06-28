import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';
import 'app_spacing.dart';

class AppTheme {
  AppTheme._();

  static ThemeData light() {
    final base = ThemeData.light(useMaterial3: true);
    return _buildTheme(base, appColorsLight, isLight: true);
  }

  static ThemeData dark() {
    final base = ThemeData.dark(useMaterial3: true);
    return _buildTheme(base, appColorsDark, isLight: false);
  }

  static ThemeData _buildTheme(ThemeData base, ColorPalette colors, {required bool isLight}) {
    final bodyBase = GoogleFonts.dmSansTextTheme(base.textTheme);

    final textTheme = bodyBase
        .copyWith(
          displayLarge: GoogleFonts.fraunces(
            fontSize: 48,
            fontWeight: FontWeight.w700,
            color: colors.textPrimary,
            letterSpacing: -1.5,
            height: 1.05,
          ),
          displayMedium: GoogleFonts.fraunces(
            fontSize: 38,
            fontWeight: FontWeight.w600,
            color: colors.textPrimary,
            letterSpacing: -1.0,
            height: 1.1,
          ),
          headlineLarge: GoogleFonts.fraunces(
            fontSize: 30,
            fontWeight: FontWeight.w600,
            color: colors.textPrimary,
            height: 1.2,
          ),
          headlineMedium: GoogleFonts.fraunces(
            fontSize: 24,
            fontWeight: FontWeight.w500,
            color: colors.textPrimary,
            height: 1.2,
          ),
          headlineSmall: GoogleFonts.fraunces(
            fontSize: 20,
            fontWeight: FontWeight.w500,
            color: colors.textPrimary,
          ),
          titleLarge: GoogleFonts.dmSans(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: colors.textPrimary,
          ),
          titleMedium: GoogleFonts.dmSans(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: colors.textPrimary,
          ),
          bodyLarge: GoogleFonts.dmSans(
            fontSize: 16,
            color: colors.textSecondary,
            height: 1.6,
          ),
          bodyMedium: GoogleFonts.dmSans(
            fontSize: 14,
            color: colors.textSecondary,
            height: 1.6,
          ),
        )
        .apply(
          bodyColor: colors.textPrimary,
          displayColor: colors.textPrimary,
          fontFamilyFallback: ['Noto Color Emoji'],
        );

    return base.copyWith(
      scaffoldBackgroundColor: colors.bg,
      colorScheme: base.colorScheme.copyWith(
        primary: colors.violet,
        secondary: colors.pink,
        surface: colors.surface,
        onSurface: colors.textPrimary,
        error: colors.error,
      ),
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: colors.bg,
        foregroundColor: colors.textPrimary,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.surface,
        contentPadding: AppSpacing.inputContentPadding,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.inputBorderRadius),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.inputBorderRadius),
          borderSide: BorderSide(color: colors.border, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.inputBorderRadius),
          borderSide: BorderSide(color: colors.violet, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.inputBorderRadius),
          borderSide: BorderSide(color: colors.error, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.inputBorderRadius),
          borderSide: BorderSide(color: colors.error, width: 1.5),
        ),
        hintStyle: TextStyle(color: colors.textMuted, fontSize: 15),
        labelStyle: TextStyle(color: colors.textSecondary),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colors.violet,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.lg),
          minimumSize: const Size.fromHeight(AppSpacing.buttonHeight),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusPrimary),
          ),
          textStyle: GoogleFonts.dmSans(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.2,
          ),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: colors.surface,
        selectedColor: colors.violet,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusPrimary),
        ),
        side: BorderSide(color: colors.border),
        labelStyle: GoogleFonts.dmSans(
          fontSize: 13,
          color: colors.textSecondary,
        ),
      ),
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSpacing.radiusPrimary)),
        backgroundColor: colors.surfaceHigh,
        elevation: 0,
        titleTextStyle: GoogleFonts.dmSans(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: colors.textPrimary,
        ),
        contentTextStyle: GoogleFonts.dmSans(
          fontSize: 14,
          color: colors.textSecondary,
          height: 1.5,
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected)
              ? colors.violet
              : colors.textMuted,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected)
              ? colors.violet.withValues(alpha: 0.30)
              : colors.surface,
        ),
      ),
      sliderTheme: SliderThemeData(
        activeTrackColor: colors.violet,
        thumbColor: colors.violet,
        inactiveTrackColor: colors.border,
        overlayColor: colors.violet.withValues(alpha: 0.15),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: colors.surfaceHigh,
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
