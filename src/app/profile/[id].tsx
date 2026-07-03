import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { get, ref } from 'firebase/database';
import { rtdb } from '@/config/firebase';
import { useAuth } from '@/context/auth-context';
import { useDiscover } from '@/context/discover-context';
import { userService } from '@/services/user.service';
import { matchService } from '@/services/match.service';
import { Ionicons } from '@expo/vector-icons';
import { Profile } from '@/models/user';
import { Colors, BorderRadius, Shadows } from '@/constants/theme';

// RTDB may return interests as a numeric-keyed object depending on seed shape;
// normalize to a plain string[] so .map/.slice never crash.
function normalizeInterests(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string');
  if (raw && typeof raw === 'object') {
    return Object.values(raw as Record<string, unknown>).filter(
      (v): v is string => typeof v === 'string'
    );
  }
  return [];
}

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { like, nope, likedIds, clearLastMatch } = useDiscover();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLikedMe, setHasLikedMe] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const iLiked = !!id && likedIds.has(id);
  const matchId = useMemo(
    () => (user?.id && id ? [user.id, id].sort().join('_') : ''),
    [user, id]
  );

  useEffect(() => {
    if (!id || !user?.id) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const [prof, receivedSnap, matched, blocked] = await Promise.all([
          userService.getProfile(id),
          get(ref(rtdb, `profiles/${user.id}/received_likes/${id}`)),
          matchService.checkMatch(user.id, id),
          userService.isBlocked(user.id, id),
        ]);
        if (cancelled) return;
        setProfile(prof);
        setHasLikedMe(receivedSnap.exists());
        setIsMatched(matched);
        setIsBlocked(blocked);
      } catch (err) {
        console.error('[PublicProfile] load failed:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  const handleLike = async () => {
    if (!id || isActing) return;
    setIsActing(true);
    try {
      const result = await like(id);
      // Avoid a duplicate "It's a match!" alert on Discover when we handle it here.
      clearLastMatch();
      if (result.isMatch) {
        setIsMatched(true);
        Alert.alert(
          "It's a match!",
          'You liked each other.',
          [
            { text: 'Later', style: 'cancel', onPress: () => router.back() },
            {
              text: 'Send a message',
              onPress: () => router.replace(`/chat/${matchId}`),
            },
          ]
        );
      } else {
        Alert.alert(
          'Like sent',
          'We will let you know if the match is confirmed.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (err) {
      console.error('[PublicProfile] like failed:', err);
      Alert.alert('Error', 'Unable to send the like');
    } finally {
      setIsActing(false);
    }
  };

  const handleNope = async () => {
    if (!id || isActing) return;
    setIsActing(true);
    try {
      await nope(id);
      router.back();
    } catch (err) {
      console.error('[PublicProfile] nope failed:', err);
      Alert.alert('Error', 'Unable to pass this profile');
    } finally {
      setIsActing(false);
    }
  };

  const handleMessage = () => {
    if (matchId) router.push(`/chat/${matchId}`);
  };

  const handleBlock = async () => {
    if (!id || !user?.id || isActing) return;

    Alert.alert(
      'Block this profile',
      'This profile will no longer be able to see or contact you.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setIsActing(true);
            try {
              await userService.saveBlock(user.id, id);
              setIsBlocked(true);
              Alert.alert('Profile blocked', 'This profile has been blocked.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err) {
              console.error('[PublicProfile] block failed:', err);
              Alert.alert('Error', 'Unable to block this profile');
            } finally {
              setIsActing(false);
            }
          },
        },
      ]
    );
  };

  const handleUnblock = async () => {
    if (!id || !user?.id || isActing) return;

    Alert.alert(
      'Unblock this profile',
      'This profile will be able to see and contact you again.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unblock',
          onPress: async () => {
            setIsActing(true);
            try {
              await userService.unblock(user.id, id);
              setIsBlocked(false);
              Alert.alert('Profile unblocked', 'This profile has been unblocked.', [
                { text: 'OK' },
              ]);
            } catch (err) {
              console.error('[PublicProfile] unblock failed:', err);
              Alert.alert('Error', 'Unable to unblock this profile');
            } finally {
              setIsActing(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </LinearGradient>
    );
  }

  if (!profile) {
    return (
      <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Profile not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.emptyLink}>Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const age = profile.birthDate
    ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear()
    : '?';
  const interests = normalizeInterests(profile.interests);

  const renderActions = () => {
    if (isMatched) {
      return (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleMessage}
          disabled={isActing}
        >
          <Ionicons name="chatbubbles" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Send a message</Text>
        </TouchableOpacity>
      );
    }

    if (hasLikedMe && !iLiked) {
      return (
        <>
          <Text style={styles.actionsHint}>This profile liked you.</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, styles.actionHalf]}
              onPress={handleNope}
              disabled={isActing}
            >
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
              <Text style={styles.secondaryButtonText}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, styles.actionHalf]}
              onPress={handleLike}
              disabled={isActing}
            >
              {isActing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="heart" size={22} color="#fff" />
                  <Text style={styles.primaryButtonText}>Like back</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      );
    }

    if (iLiked) {
      return (
        <View style={[styles.primaryButton, styles.primaryButtonDisabled]}>
          <Ionicons name="hourglass-outline" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Waiting for a match…</Text>
        </View>
      );
    }

    return (
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.secondaryButton, styles.actionHalf]}
          onPress={handleNope}
          disabled={isActing}
        >
          <Ionicons name="close" size={22} color={Colors.textSecondary} />
          <Text style={styles.secondaryButtonText}>Passer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, styles.actionHalf]}
          onPress={handleLike}
          disabled={isActing}
        >
          {isActing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="heart" size={22} color="#fff" />
              <Text style={styles.primaryButtonText}>Like</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.displayName || profile.name}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={{
            uri: profile.photoUrl || 'https://via.placeholder.com/400x500?text=No+Photo',
          }}
          style={styles.photo}
        />

        <View style={styles.infoSection}>
          <Text style={styles.name}>
            {profile.displayName || profile.name}, {age}
          </Text>

          {profile.location?.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color={Colors.accent} />
              <Text style={styles.location}>{profile.location.city}</Text>
            </View>
          )}

          {profile.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          )}

          {interests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.interestsList}>
                {interests.map((interest, index) => (
                  <View key={`${interest}-${index}`} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.actionsContainer}>
            {isBlocked ? (
              <TouchableOpacity
                style={[styles.secondaryButton, styles.blockButton]}
                onPress={handleUnblock}
                disabled={isActing}
              >
                <Ionicons name="ban" size={18} color={Colors.textSecondary} />
                <Text style={styles.blockButtonText}>Unblock this profile</Text>
              </TouchableOpacity>
            ) : (
              <>
                {renderActions()}
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.blockButton]}
                  onPress={handleBlock}
                  disabled={isActing}
                >
                  <Ionicons name="ban" size={18} color={Colors.textSecondary} />
                  <Text style={styles.blockButtonText}>Block this profile</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: { fontSize: 16, color: Colors.text },
  emptyLink: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  scrollContent: { paddingBottom: 32 },
  photo: {
    width: '100%',
    height: 420,
    backgroundColor: Colors.cardSurface,
  },
  infoSection: { padding: 16 },
  name: { fontSize: 28, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  location: { fontSize: 14, color: Colors.accent },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  bioText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  interestsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestTag: {
    backgroundColor: 'rgba(245, 165, 181, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: 'rgba(245, 165, 181, 0.3)',
  },
  interestText: { fontSize: 13, color: Colors.accent, fontWeight: '500' },
  actionsContainer: { marginTop: 8 },
  actionsHint: {
    fontSize: 13,
    color: Colors.accent,
    marginBottom: 12,
    textAlign: 'center',
  },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionHalf: { flex: 1 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.base,
    gap: 8,
    ...Shadows.glow,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardSurface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    borderRadius: BorderRadius.base,
    gap: 8,
  },
  secondaryButtonText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  blockButton: { marginTop: 12 },
  blockButtonText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
});
