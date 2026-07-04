import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, Shadows } from '../constants/theme';
import { useLocalization } from '../context/localization-context';

interface AnalyticsCardProps {
  isPremium: boolean;
  profileViews?: number;
  likesReceived?: number;
  monthlyViewsTrend?: number;
  monthlyLikesTrend?: number;
  onViewAnalytics?: () => void;
  onUpgrade?: () => void;
  isLoading?: boolean;
  style?: ViewStyle;
}

/**
 * AnalyticsCard: Shows profile statistics (Premium feature)
 * For free users, shows lock with upgrade CTA
 */
export function AnalyticsCard({
  isPremium,
  profileViews = 0,
  likesReceived = 0,
  monthlyViewsTrend = 0,
  monthlyLikesTrend = 0,
  onViewAnalytics,
  onUpgrade,
  isLoading = false,
  style,
}: AnalyticsCardProps) {
  const { t } = useLocalization();
  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!isPremium) {
    return (
      <View style={[styles.container, styles.locked, style]}>
        <Ionicons
          name="lock-closed"
          size={32}
          color={Colors.accent}
          style={styles.lockIcon}
        />
        <Text style={styles.lockedTitle}>{t('premiumStatistics') || 'Statistiques Premium'}</Text>
        <Text style={styles.lockedDescription}>
          {t('unlockAnalysisToSeeWhoLikedAndViewed') || 'Déverrouillez votre analyse pour voir qui vous a aimé et visionné'}
        </Text>
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={onUpgrade}
          activeOpacity={0.7}
        >
          <Text style={styles.upgradeButtonText}>{t('upgradeToPremium') || 'Passer Premium'}</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={Colors.text}
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, styles.premiumContainer, style]}
      onPress={onViewAnalytics}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="analytics" size={24} color={Colors.primary} />
          <Text style={styles.headerTitle}>{t('statistics') || 'Statistiques'}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.accent}
          style={styles.chevron}
        />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Profile Views */}
        <View style={styles.statBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="eye" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{profileViews}</Text>
          <Text style={styles.statLabel}>{t('profileViews') || 'Vues du profil'}</Text>
          <Text style={styles.statTrend}>
            {monthlyViewsTrend > 0 ? `+${monthlyViewsTrend}` : monthlyViewsTrend} {t('thisMonth') || 'ce mois'}
          </Text>
        </View>

        {/* Likes Received */}
        <View style={styles.statBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="heart" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{likesReceived}</Text>
          <Text style={styles.statLabel}>{t('likesReceived') || 'Likes reçus'}</Text>
          <Text style={styles.statTrend}>
            {monthlyLikesTrend > 0 ? `+${monthlyLikesTrend}` : monthlyLikesTrend} {t('thisMonth') || 'ce mois'}
          </Text>
        </View>
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <Text style={styles.ctaText}>{t('viewFullDetails') || 'Voir les détails complets'} →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  locked: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 220,
  },
  premiumContainer: {
    minHeight: 240,
  },
  lockIcon: {
    marginBottom: Spacing.two,
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.one,
    textAlign: 'center',
  },
  lockedDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.three,
    lineHeight: 18,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: BorderRadius.md,
  },
  upgradeButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: Spacing.two,
  },
  chevron: {
    opacity: 0.6,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: Spacing.one,
    padding: Spacing.two,
    backgroundColor: 'rgba(232, 61, 81, 0.05)',
    borderRadius: BorderRadius.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(232, 61, 81, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.one,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.half,
    textAlign: 'center',
  },
  statTrend: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '500',
  },
  cta: {
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500',
  },
});
