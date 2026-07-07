import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing } from '../constants/theme';

interface UndoButtonProps {
  isLocked: boolean;
  onPress?: () => void;
  onLockedPress?: () => void; // Called when user taps locked button (show upsell)
  disabled?: boolean;
  isLoading?: boolean;
  style?: ViewStyle;
}

/**
 * UndoButton: Premium feature for reverting last like/nope action
 * Shows locked state for free users with tap-to-upgrade
 */
export function UndoButton({
  isLocked,
  onPress,
  onLockedPress,
  disabled = false,
  isLoading = false,
  style,
}: UndoButtonProps) {
  const handlePress = () => {
    if (isLocked) {
      onLockedPress?.();
    } else if (!disabled && !isLoading) {
      onPress?.();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isLocked && styles.locked,
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled && !isLocked}
    >
      {isLoading ? (
        <ActivityIndicator color={Colors.text} size="small" />
      ) : (
        <>
          <Ionicons
            name={isLocked ? 'lock-closed' : 'refresh'}
            size={20}
            color={isLocked ? Colors.textSecondary : Colors.accent}
            style={styles.icon}
          />
          <Text
            style={[
              styles.text,
              isLocked && styles.lockedText,
              disabled && styles.disabledText,
            ]}
          >
            {isLocked ? '🔒 UNDO' : '🔄 UNDO'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cardSurface,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  locked: {
    borderColor: Colors.textSecondary,
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: Spacing.two,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  lockedText: {
    color: Colors.textSecondary,
  },
  disabledText: {
    color: Colors.textSecondary,
  },
});
