/**
 * nearme currently ships a single dark palette (see constants/theme.ts).
 * useTheme returns that palette so the legacy Themed* components keep
 * compiling. If a light/dark switch is added later, expand this to pick
 * between Colors.light and Colors.dark based on useColorScheme().
 */

import { Colors } from '@/constants/theme';

export function useTheme() {
  return Colors;
}
