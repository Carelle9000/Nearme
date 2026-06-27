import 'package:flutter/material.dart';

/// Standardized spacing system for NearMe
/// All margins, paddings, and border radius use these constants
class AppSpacing {
  AppSpacing._();

  // ── Basic spacing scale (0-64)
  static const xs = 4.0;      // Minimal spacing
  static const sm = 8.0;      // Small gaps
  static const md = 12.0;     // Medium gaps
  static const lg = 16.0;     // Large gaps (default padding)
  static const xl = 20.0;     // Extra large
  static const xxl = 24.0;    // Double extra large
  static const xxxl = 32.0;   // Triple extra large
  static const huge = 40.0;   // Huge spacing
  static const massive = 64.0; // Massive spacing

  // ── Commonly used gaps as SizedBox
  static const gapXs = SizedBox(width: xs, height: xs);
  static const gapSm = SizedBox(width: sm, height: sm);
  static const gapMd = SizedBox(width: md, height: md);
  static const gapLg = SizedBox(width: lg, height: lg);
  static const gapXl = SizedBox(width: xl, height: xl);
  static const gapXxl = SizedBox(width: xxl, height: xxl);
  static const gapXxxl = SizedBox(width: xxxl, height: xxxl);

  // ── Horizontal gaps
  static const hGapSm = SizedBox(width: sm);
  static const hGapMd = SizedBox(width: md);
  static const hGapLg = SizedBox(width: lg);
  static const hGapXl = SizedBox(width: xl);
  static const hGapXxl = SizedBox(width: xxl);

  // ── Vertical gaps
  static const vGapSm = SizedBox(height: sm);
  static const vGapMd = SizedBox(height: md);
  static const vGapLg = SizedBox(height: lg);
  static const vGapXl = SizedBox(height: xl);
  static const vGapXxl = SizedBox(height: xxl);
  static const vGapXxxl = SizedBox(height: xxxl);

  // ── Border Radius (standardized to 24 as primary)
  static const radiusSm = 12.0;     // Small cards/inputs
  static const radiusMd = 16.0;     // Medium elements
  static const radiusLg = 20.0;     // Large cards
  static const radiusPrimary = 24.0; // Primary (most used)
  static const radiusXl = 28.0;     // Extra large
  static const radiusRound = 1000.0; // Full circle/pill

  // ── Common padding EdgeInsets
  static const paddingXs = EdgeInsets.all(xs);
  static const paddingSm = EdgeInsets.all(sm);
  static const paddingMd = EdgeInsets.all(md);
  static const paddingLg = EdgeInsets.all(lg);
  static const paddingXl = EdgeInsets.all(xl);
  static const paddingXxl = EdgeInsets.all(xxl);

  // ── Symmetric paddings
  static const paddingSymmetricH =
      EdgeInsets.symmetric(horizontal: lg, vertical: lg);
  static const paddingSymmetricHLarge =
      EdgeInsets.symmetric(horizontal: xl, vertical: xl);

  // ── Card/Surface padding
  static const paddingCard = EdgeInsets.all(lg);
  static const paddingCardLarge = EdgeInsets.all(xl);

  // ── Screen padding
  static const paddingScreen = EdgeInsets.all(lg);
  static const paddingScreenLarge = EdgeInsets.all(xl);

  // ── Standard button dimensions
  static const buttonHeight = 56.0;
  static const buttonHeightSmall = 44.0;
  static const buttonHeightLarge = 64.0;

  // ── Icon sizes
  static const iconSm = 16.0;
  static const iconMd = 20.0;
  static const iconLg = 24.0;
  static const iconXl = 32.0;
  static const iconXxl = 40.0;

  // ── Avatar sizes
  static const avatarSm = 32.0;
  static const avatarMd = 40.0;
  static const avatarLg = 48.0;
  static const avatarXl = 64.0;
  static const avatarXxl = 80.0;
  static const avatarHero = 100.0;

  // ── Common BorderRadius objects
  static const BorderRadius radiusSmBR = BorderRadius.all(Radius.circular(radiusSm));
  static const BorderRadius radiusMdBR = BorderRadius.all(Radius.circular(radiusMd));
  static const BorderRadius radiusLgBR = BorderRadius.all(Radius.circular(radiusLg));
  static const BorderRadius radiusPrimaryBR = BorderRadius.all(Radius.circular(radiusPrimary));
  static const BorderRadius radiusXlBR = BorderRadius.all(Radius.circular(radiusXl));
  static const BorderRadius radiusRoundBR = BorderRadius.all(Radius.circular(radiusRound));

  // ── Common BoxShadow values
  static final shadowSm = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.05),
      blurRadius: 4,
      offset: const Offset(0, 1),
    ),
  ];

  static final shadowMd = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.1),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
  ];

  static final shadowLg = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.15),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];

  // ── Input field standard spacing
  static const inputContentPadding =
      EdgeInsets.symmetric(horizontal: lg, vertical: lg);
  static const inputBorderRadius = radiusPrimary;
}
