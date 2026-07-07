import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text, Image, ScrollView } from 'react-native';
import { useDiscover } from '@/context/discover-context';
import { ProfileCard } from '@/components/profile-card';
import { ProfileCardSkeleton } from '@/components/profile-card-skeleton';
import { DiscoverHeader } from '@/components/discover-header';
import { FloatingHearts } from '@/components/floating-hearts';
import { ReactionFeedback } from '@/components/reaction-feedback';
import { ConfettiBurst } from '@/components/confetti-burst';
import { TrialStatusCard } from '@/components/TrialStatusCard';
import { PremiumRequiredModal } from '@/components/PremiumRequiredModal';
import { ExpiredTrialBanner } from '@/components/ExpiredTrialBanner';
import { locationService } from '@/services/location.service';
import { chatService } from '@/services/chat.service';
import { useEffect, useCallback, useState, memo, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useLocalization } from '@/context/localization-context';
import { useAuth } from '@/context/auth-context';
import { usePremium } from '@/context/premium-context';
import { PremiumFeature } from '@/models/premium';

const PremiumFeaturesButtons = memo(({
  isPremium,
  currentProfile,
  onFeatureAccess,
  t,
}: {
  isPremium: boolean;
  currentProfile: any;
  onFeatureAccess: (feature: PremiumFeature) => void;
  t: any;
}) => {
  if (!currentProfile) return null;

  return (
    <View style={styles.premiumFeaturesSection}>
      <TouchableOpacity
        style={[styles.premiumButton, !isPremium && styles.premiumButtonDisabled]}
        onPress={() => onFeatureAccess('undo')}
        disabled={!isPremium}
      >
        <Ionicons
          name="refresh-outline"
          size={16}
          color={isPremium ? Colors.primary : Colors.textSecondary}
        />
        <Text style={[styles.premiumButtonText, !isPremium && styles.premiumButtonTextDisabled]}>
          {t('premiumFeatureUndo')}
        </Text>
        {!isPremium && <Ionicons name="lock-closed" size={12} color={Colors.textSecondary} />}
      </TouchableOpacity>
    </View>
  );
});
PremiumFeaturesButtons.displayName = 'PremiumFeaturesButtons';

const AnimationLayer = memo(({
  showLikeHearts,
  showConfetti,
  showReaction,
  onHeartsComplete,
  onConfettiComplete,
  onReactionComplete,
}: {
  showLikeHearts: boolean;
  showConfetti: boolean;
  showReaction: { trigger: boolean; type: 'like' | 'favorite' | 'message' };
  onHeartsComplete: () => void;
  onConfettiComplete: () => void;
  onReactionComplete: () => void;
}) => (
  <>
    <FloatingHearts
      trigger={showLikeHearts}
      count={5}
      onComplete={onHeartsComplete}
    />
    <ConfettiBurst
      trigger={showConfetti}
      count={20}
      onComplete={onConfettiComplete}
    />
    <ReactionFeedback
      trigger={showReaction.trigger}
      type={showReaction.type}
      onComplete={onReactionComplete}
    />
  </>
));
AnimationLayer.displayName = 'AnimationLayer';

export default function DiscoverScreen() {
  const {
    profiles,
    currentIndex,
    isLoading,
    loadNearbyProfiles,
    like,
    nope,
    favorite,
    favoriteIds,
    lastMatch,
    clearLastMatch,
  } = useDiscover();
  const { t } = useLocalization();
  const { user } = useAuth();
  const { isPremium, subscriptionInfo } = usePremium();
  const router = useRouter();

  // Animation states
  const [showLikeHearts, setShowLikeHearts] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showReaction, setShowReaction] = useState<{
    trigger: boolean;
    type: 'like' | 'favorite' | 'message';
  }>({ trigger: false, type: 'like' });

  // Stable callbacks for animations
  const handleHeartsComplete = useCallback(() => {
    setShowLikeHearts(false);
  }, []);

  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

  const handleReactionComplete = useCallback(() => {
    setShowReaction({ trigger: false, type: 'like' });
  }, []);

  // Premium modal states
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState<PremiumFeature | null>(null);

  // Declare currentProfile early so it can be used in callbacks
  const currentProfile = profiles[currentIndex] || null;
  const isFavorite = currentProfile ? favoriteIds.has(currentProfile.uid) : false;

  useEffect(() => {
    if (!lastMatch) return;
    Alert.alert(
      t('itsAMatch'),
      t('youLikedEachOther'),
      [
        { text: t('later'), style: 'cancel', onPress: clearLastMatch },
        {
          text: t('sendMessage'),
          onPress: () => {
            clearLastMatch();
            router.push(`/chat/${lastMatch.matchId}`);
          },
        },
      ]
    );
  }, [lastMatch, clearLastMatch, router, t]);

  const loadProfiles = useCallback(async () => {
    try {
      // Prefer the profile's stored location (intent-based, kept fresh by
      // locationSyncService). Fall back to the device's live position only if
      // no valid coords are on file — otherwise a user swiping abroad would
      // suddenly see profiles around their travel spot instead of home.
      const stored = user?.location;
      const hasStored =
        stored &&
        typeof stored.latitude === 'number' &&
        typeof stored.longitude === 'number' &&
        Number.isFinite(stored.latitude) &&
        Number.isFinite(stored.longitude) &&
        !(stored.latitude === 0 && stored.longitude === 0);

      if (hasStored) {
        console.log(`[Discover] Using stored profile location (${stored!.latitude}, ${stored!.longitude})`);
        await loadNearbyProfiles(stored!.latitude, stored!.longitude);
        return;
      }

      const live = await locationService.getCurrentLocation();
      if (live) {
        console.log(`[Discover] Using device live location (${live.latitude}, ${live.longitude})`);
        await loadNearbyProfiles(live.latitude, live.longitude);
      } else {
        Alert.alert(t('error'), t('pleaseEnableLocation'));
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      Alert.alert(t('error'), t('noProfiles'));
    }
  }, [loadNearbyProfiles, user?.location]);

  const handleNope = useCallback(async () => {
    if (!currentProfile) return;
    try {
      await nope(currentProfile.uid);
    } catch (error) {
      console.error('Error rejecting profile:', error);
    }
  }, [currentProfile, nope]);

  const handleMessage = useCallback(async () => {
    if (!currentProfile || !user) return;

    setShowReaction({ trigger: true, type: 'message' });

    try {
      const conversation = await chatService.getOrCreateConversation(
        user.id,
        currentProfile.uid,
        user.displayName || user.name,
        currentProfile.displayName || currentProfile.name
      );

      setTimeout(() => {
        router.push(`/chat/${conversation.id}`);
      }, 300);
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert(t('error'), t('unableToCreateConversation'));
    }
  }, [currentProfile, user, router, t]);

  const handleLike = useCallback(() => {
    if (!currentProfile) return;
    setShowLikeHearts(true);
    setShowConfetti(true);
    setShowReaction({ trigger: true, type: 'like' });
    like(currentProfile.uid);
  }, [currentProfile, like]);

  const handleFavorite = useCallback(() => {
    if (!currentProfile) return;
    setShowReaction({ trigger: true, type: 'favorite' });
    favorite(currentProfile.uid);
  }, [currentProfile, favorite]);

  const handlePremiumFeatureAccess = useCallback((feature: PremiumFeature) => {
    if (!isPremium) {
      setBlockedFeature(feature);
      setShowPremiumModal(true);
      return;
    }
    // Handle the actual feature access based on type
    switch (feature) {
      case 'view_who_liked':
        router.push('/premium?tab=liked');
        break;
      case 'profile_analytics':
        router.push('/premium?tab=analytics');
        break;
      default:
        break;
    }
  }, [isPremium, router]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  if (isLoading) {
    return (
      <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.loaderContainer}>
        <SafeAreaView style={styles.safeArea}>
          <DiscoverHeader onNotificationsPress={() => router.push('/notifications')} />
          <ProfileCardSkeleton />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (profiles.length === 0 && !isLoading) {
    return (
      <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <DiscoverHeader onNotificationsPress={() => router.push('/notifications')} />

          {/* Trial Status Card */}
          <TrialStatusCard
            user={user}
            onPressUpgrade={() => router.push('/premium')}
          />

          {/* Empty State */}
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={Colors.primary} />
            <Text style={styles.emptyTitle}>{t('noProfiles')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('noResults')}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => loadProfiles()}
            >
              <Text style={styles.emptyButtonText}>{t('tryAgain')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <DiscoverHeader onNotificationsPress={() => router.push('/notifications')} />

        {/* Expired Trial Banner */}
        {subscriptionInfo.status === 'expired' && (
          <ExpiredTrialBanner
            onPressUpgrade={() => router.push('/premium')}
          />
        )}

        {/* Trial Status Card */}
        <TrialStatusCard
          user={user}
          onPressUpgrade={() => router.push('/premium')}
        />

        {/* Profile Card */}
        <ProfileCard
          profile={currentProfile}
          isFavorite={isFavorite}
          onLike={handleLike}
          onFavorite={handleFavorite}
          onNope={handleNope}
          onMessage={handleMessage}
        />

        <AnimationLayer
          showLikeHearts={showLikeHearts}
          showConfetti={showConfetti}
          showReaction={showReaction}
          onHeartsComplete={handleHeartsComplete}
          onConfettiComplete={handleConfettiComplete}
          onReactionComplete={handleReactionComplete}
        />

        {/* Premium Required Modal */}
        <PremiumRequiredModal
          visible={showPremiumModal}
          featureName={blockedFeature || undefined}
          onClose={() => setShowPremiumModal(false)}
          onUpgrade={() => {
            setShowPremiumModal(false);
            router.push('/premium');
          }}
        />
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  premiumFeaturesSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    gap: 10,
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(100, 200, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 200, 255, 0.2)',
    gap: 10,
  },
  premiumButtonDisabled: {
    backgroundColor: 'rgba(200, 200, 200, 0.05)',
    borderColor: 'rgba(200, 200, 200, 0.1)',
  },
  premiumButtonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
  },
  premiumButtonTextDisabled: {
    color: Colors.textSecondary,
  },
});

