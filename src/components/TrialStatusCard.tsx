import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows } from '../constants/theme';
import { AppUser } from '../models/user';
import { useLocalization } from '../context/localization-context';
import { usePremium } from '../context/premium-context';

interface TrialStatusCardProps {
  user: AppUser | null;
  onPressUpgrade: () => void;
}

export function TrialStatusCard({ user, onPressUpgrade }: TrialStatusCardProps) {
  const { t } = useLocalization();
  const { isPremium, isTrial, subscriptionInfo } = usePremium();

  if (!user || !isPremium) {
    return null;
  }

  const daysRemaining = subscriptionInfo.daysRemaining ?? 0;
  const statusText = isTrial
    ? `${t('trialActive') || 'Essai actif'} 🎁`
    : `${t('youArePremium') || 'Vous êtes Premium'} ⭐`;

  const expiryText = isTrial
    ? `${daysRemaining} ${daysRemaining === 1 ? t('day') || 'jour' : t('days') || 'jours'}`
    : `Se renouvelle dans ${daysRemaining} jours`;

  const gradientColors = isTrial
    ? ['rgba(100, 200, 255, 0.1)', 'rgba(100, 150, 255, 0.05)']
    : ['rgba(255, 215, 0, 0.1)', 'rgba(200, 170, 0, 0.05)'];

  const borderColor = isTrial ? 'rgba(100, 200, 255, 0.3)' : 'rgba(255, 215, 0, 0.3)';

  return (
    <LinearGradient
      colors={gradientColors}
      style={[styles.container, { borderColor }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        {/* Left side: Status info */}
        <View style={styles.infoSection}>
          <View style={styles.statusRow}>
            <Ionicons
              name={isTrial ? 'gift' : 'star'}
              size={18}
              color={isTrial ? Colors.primary : '#FFD700'}
              style={styles.icon}
            />
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
          <Text style={styles.expiryText}>{expiryText}</Text>
        </View>

        {/* Right side: Action button */}
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={onPressUpgrade}
        >
          <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Progress bar for trial days */}
      {isTrial && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.max((daysRemaining / 7) * 100, 5)}%`,
              },
            ]}
          />
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: BorderRadius.base,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  infoSection: {
    flex: 1,
    gap: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginRight: 2,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  expiryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 26,
  },
  upgradeButton: {
    padding: 8,
    marginLeft: 8,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
});
