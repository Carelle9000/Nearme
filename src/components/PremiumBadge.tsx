import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  style?: any;
}

/**
 * PremiumBadge: Visual indicator for premium users
 * Displays: ⭐ PREMIUM badge in gold
 */
export function PremiumBadge({
  size = 'medium',
  showIcon = true,
  style,
}: PremiumBadgeProps) {
  const sizeStyles = {
    small: styles.sizeSmall,
    medium: styles.sizeMedium,
    large: styles.sizeLarge,
  };

  const textSizes = {
    small: 10,
    medium: 12,
    large: 14,
  };

  const iconSizes = {
    small: 10,
    medium: 12,
    large: 14,
  };

  return (
    <View style={[styles.container, sizeStyles[size], style]}>
      {showIcon && (
        <Ionicons
          name="star"
          size={iconSizes[size]}
          color="#FFD700"
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { fontSize: textSizes[size] }]}>
        PREMIUM
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)', // Gold tint
    borderColor: '#FFD700',
    borderWidth: 1,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  sizeSmall: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  sizeMedium: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  sizeLarge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  icon: {
    marginRight: Spacing.one,
  },
  text: {
    color: '#FFD700',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
