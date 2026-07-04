import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { usePremium } from '@/context/premium-context';
import { useLocalization } from '@/context/localization-context';
import { WhoLikedYou } from '@/components/WhoLikedYou';
import { FeatureLock } from '@/components/FeatureLock';
import { Profile } from '@/models/user';

/**
 * Who Liked You Page
 * Premium feature - shows all profiles that liked the current user
 */
export default function WhoLikedYouScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLocalization();
  const { isPremium, canAccess, whoLikedYou, whoViewedYou, isLoadingAnalytics, loadAnalytics } =
    usePremium();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'liked' | 'viewed'>('liked');

  // Load data on mount
  useEffect(() => {
    if (isPremium) {
      loadAnalytics();
    }
  }, [isPremium, loadAnalytics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAnalytics();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isPremium) {
    return (
      <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('analytics') || 'Statistiques'}</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Locked Feature */}
          <View style={styles.lockedContent}>
            <FeatureLock
              isLocked={true}
              featureName={t('premium') || 'Premium'}
              description={t('unlockPremiumToSeeAnalytics') || 'Unlock premium to discover who liked and viewed you'}
              size="large"
              onUnlockPress={() => router.push('/premium')}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const currentProfiles = activeTab === 'liked' ? whoLikedYou : whoViewedYou;

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('analytics') || 'Statistiques'}</Text>
          <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Ionicons name="refresh" size={24} color={Colors.text} />
            )}
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'liked' && styles.activeTab]}
            onPress={() => setActiveTab('liked')}
          >
            <Ionicons
              name="heart"
              size={18}
              color={activeTab === 'liked' ? Colors.primary : Colors.textSecondary}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, activeTab === 'liked' && styles.activeTabText]}>
              {t('whoLikedYou') || 'Qui m\'a aimé'}
            </Text>
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{whoLikedYou.length}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'viewed' && styles.activeTab]}
            onPress={() => setActiveTab('viewed')}
          >
            <Ionicons
              name="eye"
              size={18}
              color={activeTab === 'viewed' ? Colors.primary : Colors.textSecondary}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, activeTab === 'viewed' && styles.activeTabText]}>
              {t('whoViewedYou') || 'Qui m\'a visionné'}
            </Text>
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{whoViewedYou.length}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <View style={[styles.card, styles.statsCard]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{currentProfiles.length}</Text>
            <Text style={styles.statLabel}>
              {activeTab === 'liked'
                ? (t('likedYou') || 'Vous ont aimé')
                : (t('viewedYou') || 'Vous ont visité')}
            </Text>
          </View>
        </View>

        {/* Profiles Grid */}
        <ScrollView style={styles.profilesContainer} showsVerticalScrollIndicator={false}>
          <WhoLikedYou
            profiles={currentProfiles}
            isLoading={isLoadingAnalytics}
            onRefresh={handleRefresh}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  lockedContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeTab: {
    backgroundColor: 'rgba(232, 61, 81, 0.1)',
    borderColor: Colors.primary,
  },
  tabIcon: {
    marginRight: Spacing.one,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    flex: 1,
  },
  activeTabText: {
    color: Colors.primary,
  },
  tabBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: Spacing.one,
    paddingVertical: 2,
    minWidth: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  card: {
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    paddingVertical: Spacing.three,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.one,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.border,
  },
  profilesContainer: {
    paddingHorizontal: Spacing.three,
  },
});

