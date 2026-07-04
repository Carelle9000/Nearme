import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../constants/theme';
import { useLocalization } from '../context/localization-context';

interface ExpiredTrialBannerProps {
  onPressDismiss?: () => void;
  onPressUpgrade: () => void;
}

/**
 * ExpiredTrialBanner: Displayed when user's trial has expired
 * Shows at the top of Discover screen with upgrade CTA
 */
export function ExpiredTrialBanner({
  onPressDismiss,
  onPressUpgrade,
}: ExpiredTrialBannerProps) {
  const { t } = useLocalization();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onPressDismiss?.();
  };

  return (
    <LinearGradient
      colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 165, 0, 0.1)']}
      style={styles.banner}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Ionicons name="time-outline" size={20} color="#FFA500" />
          <View style={styles.textSection}>
            <Text style={styles.title}>{t('trialExpired')}</Text>
            <Text style={styles.subtitle}>
              {t('trialExpiredBannerMessage')}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity style={styles.upgradeBtn} onPress={onPressUpgrade}>
            <Text style={styles.upgradeBtnText}>Voir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={handleDismiss}
            accessibilityLabel={t('close')}
          >
            <Ionicons name="close-outline" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Border bottom */}
      <View style={styles.border} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  textSection: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFA500',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  upgradeBtn: {
    backgroundColor: '#FFA500',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 16,
  },
  upgradeBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  dismissBtn: {
    padding: Spacing.one,
  },
  border: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: Spacing.two,
  },
});
