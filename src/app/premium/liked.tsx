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
  const { isPremium, canAccess, whoLikedYou, isLoadingAnalytics, loadAnalytics } =
    usePremium();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
            <Text style={styles.headerTitle}>Who liked me</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Locked Feature */}
          <View style={styles.lockedContent}>
            <FeatureLock
              isLocked={true}
              featureName="Who liked me"
              description="Unlock premium to discover who liked you"
              size="large"
              onUnlockPress={() => router.push('/premium')}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Who liked me</Text>
          <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Ionicons name="refresh" size={24} color={Colors.text} />
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <View style={[styles.card, styles.statsCard]}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{whoLikedYou.length}</Text>
            <Text style={styles.statLabel}>Liked you</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="heart" size={24} color={Colors.primary} />
            <Text style={styles.statLabel}>This week</Text>
          </View>
        </View>

        {/* Profiles Grid */}
        <ScrollView style={styles.profilesContainer} showsVerticalScrollIndicator={false}>
          <WhoLikedYou
            profiles={whoLikedYou}
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

