import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Dark Surfaces ─────────────────────────────────────────────────────────
  static const bg           = Color(0xFF09090E);   // deepest background
  static const dark         = Color(0xFF09090E);   // alias
  static const surface      = Color(0xFF111118);   // card / list item
  static const surfaceHigh  = Color(0xFF1A1A26);   // modals / sheets / elevated

  // ── Brand Violet ──────────────────────────────────────────────────────────
  static const violet       = Color(0xFF7C3AED);   // primary CTA
  static const violetGlow   = Color(0xFFA78BFA);   // active / focus glow
  static const purple       = Color(0xFF1E1B4B);   // deep indigo surface

  // ── Action Colors ─────────────────────────────────────────────────────────
  static const pink         = Color(0xFFF472B6);   // like / romantic
  static const gold         = Color(0xFFFBBF24);   // super like / premium
  static const goldLight    = Color(0x1AFBBF24);   // gold subtle bg
  static const emerald      = Color(0xFF34D399);   // online indicator
  static const cyan         = Color(0xFF22D3EE);   // chat / message accent

  // ── Text ──────────────────────────────────────────────────────────────────
  static const textPrimary  = Color(0xFFF1F0F5);   // near-white, warm
  static const textSecondary= Color(0xFF9CA3AF);   // gray-400
  static const textMuted    = Color(0xFF4B5563);   // gray-600

  // ── Borders ───────────────────────────────────────────────────────────────
  static const border       = Color(0xFF252534);   // subtle dark border
  static const borderLight  = Color(0xFF2F2F40);   // slightly lighter

  // ── Gradients ─────────────────────────────────────────────────────────────
  static const violetGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF7C3AED), Color(0xFF4C1D95)],
  );

  static const purpleGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF09090E), Color(0xFF111118)],
  );

  static const pinkGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFF472B6), Color(0xFFEC4899)],
  );

  static const cyanGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF22D3EE), Color(0xFF06B6D4)],
  );

  static const darkGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF09090E), Color(0xFF111118)],
  );

  // ── Backward-compat aliases ───────────────────────────────────────────────
  static const rose      = pink;
  static const navy      = dark;
  static const navyLight = surface;
  static const navy3     = surface;
  static const card      = surface;
  static const text      = textPrimary;
  static const muted     = textMuted;

  // ── Divers ─────────────────────────────────────────────────────────────────
  static const bgCard    = surface;
}
