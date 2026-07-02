import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

interface FeatureLockProps {
  isLocked: boolean;
  featureName: string;
  onUnlockPress?: () => void;
  description?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  showButton?: boolean;
}

/**
 * FeatureLock: Shows when a feature is locked and requires premium
 * Can be used as an overlay, inline, or standalone component
 */
export function FeatureLock({
  isLocked,
  featureName,
  onUnlockPress,
  description,
  size = 'medium',
  style,
  showButton = true,
}: FeatureLockProps) {
  if (!isLocked) {
    return null; // Feature is not locked, don't show anything
  }

  const sizeStyles = {
    small: styles.sizeSmall,
    medium: styles.sizeMedium,
    large: styles.sizeLarge,
  };

  const iconSizes = {
    small: 20,
    medium: 28,
    large: 36,
  };

  return (
    <View style={[styles.container, sizeStyles[size], style]}>
      {/* Lock Icon */}
      <Ionicons
        name="lock-closed"
        size={iconSizes[size]}
        color={Colors.accent}
        style={styles.icon}
      />

      {/* Feature Name */}
      <Text style={styles.featureName}>{featureName}</Text>

      {/* Description (optional) */}
      {description && <Text style={styles.description}>{description}</Text>}

      {/* Unlock Button (optional) */}
      {showButton && (
        <TouchableOpacity
          style={styles.unlockButton}
          onPress={onUnlockPress}
          activeOpacity={0.7}
        >
          <Text style={styles.unlockButtonText}>Débloquer Premium</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={Colors.primary}
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.three,
  },
  sizeSmall: {
    paddingVertical: Spacing.two,
  },
  sizeMedium: {
    paddingVertical: Spacing.three,
  },
  sizeLarge: {
    paddingVertical: Spacing.four,
  },
  icon: {
    marginBottom: Spacing.two,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.two,
  },
  unlockButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: Spacing.one,
  },
});
