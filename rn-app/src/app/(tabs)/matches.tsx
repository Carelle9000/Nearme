import { View, FlatList, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/auth-context';
import { matchService, userService } from '../../services';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Match } from '../../models/user';
import { Profile } from '../../models/user';

interface MatchItem extends Match {
  otherUserProfile?: Profile;
}

export default function MatchesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadMatches();
    }
  }, [user?.id]);

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
              <Ionicons name="location-sharp" size={14} color="#FF1744" />
              <Text style={styles.locationText}>{profile.location.city}</Text>
            </View>
          )}
          <Text style={styles.matchedDate}>
            Matched {new Date(item.matchedAt).toLocaleDateString()}
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
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF1744" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {matches.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-discard-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No matches yet</Text>
          <Text style={styles.emptySubtext}>Keep discovering to find your match!</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  matchInfo: {
    padding: 12,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
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
    color: '#666',
  },
  matchedDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF1744',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  chatButtonText: {
    color: '#fff',
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
    color: '#000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});
