/**
 * NearMe Dark Red Theme
 * OKLCH Colors: Background, Cards, Primary, Accent, Secondary
 */

import { Platform } from 'react-native';

// OKLCH colors converted to RGB hex for React Native
export const Colors = {
  // Dark red OKLCH palette
  background: '#1E1117', // oklch(0.12 0.03 270) - near-black navy
  cardSurface: '#2D1B1B', // oklch(0.18 0.04 25) - deep red
  primary: '#E83D51', // oklch(0.62 0.27 25) - vivid red/pink
  accent: '#F5A5B5', // oklch(0.78 0.16 18) - soft pink
  secondary: '#4A2B2B', // oklch(0.24 0.06 22) - dark red
  text: '#FFFFFF',
  textSecondary: '#D0D0D0',
  border: '#3D2B2B',
  success: '#10B981', // green for success
  warning: '#F59E0B', // amber for warning
} as const;

// Gradient definitions
export const Gradients = {
  // Linear 135° light red to dark red
  warm: {
    start: '#F5A5B5', // soft pink (accent)
    end: '#8B3A47', // darker red
    angle: 135,
  },
  // Radial soft dark
  soft: {
    center: 'rgba(0,0,0,0.3)',
    outer: 'rgba(0,0,0,0.7)',
  },
} as const;

// Shadow definitions
export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  glow: {
    shadowColor: '#E83D51',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// Border radius
export const BorderRadius = {
  base: 20, // 1.25rem
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

export const Fonts = Platform.select({
  ios: {
    // Serif for titles (Fraunces fallback)
    serif: 'Georgia',
    // Sans for body (Plus Jakarta Sans fallback)
    sans: 'system-ui',
  },
  default: {
    serif: 'serif',
    sans: 'sans-serif',
  },
  web: {
    serif: '"Fraunces", Georgia, serif',
    sans: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
