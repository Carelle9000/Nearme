import { View, FlatList, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/auth-context';
import { matchService, userService } from '../../services';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Match, Profile } from '../../models/user';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';

interface MatchItem extends Match {
  otherUserProfile?: Profile;
}

export default function MatchesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMatches = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const userMatches = await matchService.getUserMatches(user.id);

      // Load other users' profiles
      const matchesWithProfiles = await Promise.all(
        userMatches.map(async (match) => {
          const otherUserId = matchService.getOtherUserId(match, user.id);
          const profile = await userService.getProfile(otherUserId);
          return { ...match, otherUserProfile: profile };
        })
      );

      setMatches(matchesWithProfiles);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadMatches();
    }
  }, [user?.id, loadMatches]);

  const renderMatch = ({ item }: { item: MatchItem }) => {
    const profile = item.otherUserProfile;
    if (!profile) return null;

    const age = profile.birthDate
      ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear()
      : '?';

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() =>
          router.push({
            pathname: '/matches/[id]',
            params: { id: profile.uid },
          })
        }
      >
        <Image
          source={{
            uri: profile.photoUrl || 'https://via.placeholder.com/300x400?text=No+Photo',
          }}
          style={styles.matchImage}
        />

        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>
            {profile.displayName || profile.name}, {age}
          </Text>
          {profile.location?.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color={Colors.primary} />
              <Text style={styles.locationText}>{profile.location.city}</Text>
            </View>
          )}
          <Text style={styles.matchedDate}>
            Match du {new Date(item.matchedAt).toLocaleDateString()}
          </Text>

          <TouchableOpacity
            style={styles.chatButton}
            onPress={() =>
              router.push({
                pathname: '/chat/[id]',
                params: { id: item.id },
              })
            }
          >
            <Ionicons name="chatbubbles" size={16} color="#fff" />
            <Text style={styles.chatButtonText}>Message</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      {matches.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-discard-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Aucun match pour l&apos;instant</Text>
          <Text style={styles.emptySubtext}>Continuez à découvrir pour trouver votre match !</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 8,
  },
  matchCard: {
    flex: 1,
    margin: 8,
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
    backgroundColor: Colors.cardSurface,
    ...Shadows.soft,
  },
  matchImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.secondary,
  },
  matchInfo: {
    padding: 12,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  matchedDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: BorderRadius.base,
    gap: 6,
  },
  chatButtonText: {
    color: Colors.text,
    fontWeight: '500',
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
