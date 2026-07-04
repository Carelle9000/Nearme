import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text, Image } from 'react-native';
import { useDiscover } from '@/context/discover-context';
import { ProfileCard } from '@/components/profile-card';
import { ProfileCardSkeleton } from '@/components/profile-card-skeleton';
import { DiscoverHeader } from '@/components/discover-header';
import { FloatingHearts } from '@/components/floating-hearts';
import { ReactionFeedback } from '@/components/reaction-feedback';
import { ConfettiBurst } from '@/components/confetti-burst';
import { locationService } from '@/services/location.service';
import { chatService } from '@/services/chat.service';
import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useLocalization } from '@/context/localization-context';
import { useAuth } from '@/context/auth-context';

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
  const router = useRouter();

  // Animation states
  const [showLikeHearts, setShowLikeHearts] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showReaction, setShowReaction] = useState<{
    trigger: boolean;
    type: 'like' | 'favorite' | 'message';
  }>({ trigger: false, type: 'like' });

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

        {/* Profile Card */}
        <ProfileCard
          profile={currentProfile}
          isFavorite={isFavorite}
          onLike={handleLike}
          onFavorite={handleFavorite}
          onNope={handleNope}
          onMessage={handleMessage}
        />

        {/* Floating Hearts Animation */}
        <FloatingHearts
          trigger={showLikeHearts}
          count={5}
          onComplete={() => setShowLikeHearts(false)}
        />

        {/* Confetti Burst Animation */}
        <ConfettiBurst
          trigger={showConfetti}
          count={20}
          onComplete={() => setShowConfetti(false)}
        />

        {/* Reaction Feedback Animation */}
        <ReactionFeedback
          trigger={showReaction.trigger}
          type={showReaction.type}
          onComplete={() => setShowReaction({ trigger: false, type: 'like' })}
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
});

