import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { ref, get, getDatabase } from 'firebase/database';
import { firebaseApp } from '../../config/firebase';
import { Profile } from '../../models/user';
import { userService } from '../../services';

type Tab = 'likes' | 'favorites' | 'blocked';

interface Like {
  swiperId: string;
  action: 'like' | 'pass';
  profile?: Profile;
}

export default function ActivityScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('likes');
  const [likes, setLikes] = useState<Like[]>([]);
  const [favorites, setFavorites] = useState<Profile[]>([]);
  const [blocked, setBlocked] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLikes = useCallback(async () => {
    if (!user?.id) return;
    try {
      const db = getDatabase(firebaseApp);
      const likesRef = ref(db, `profiles/${user.id}/received_likes`);
      const snapshot = await get(likesRef);

      const likesData: Like[] = [];
      if (snapshot.exists()) {
        const likes = snapshot.val();
        for (const swiperId of Object.keys(likes)) {
          const profileRef = ref(db, `profiles/${swiperId}`);
          const profileSnapshot = await get(profileRef);
          if (profileSnapshot.exists()) {
            const profileData = profileSnapshot.val();
            likesData.push({
              swiperId,
              action: 'like',
              profile: { uid: swiperId, ...profileData } as Profile,
            });
          }
        }
      }
      setLikes(likesData);
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  }, [user?.id]);

  const loadFavorites = useCallback(async () => {
    if (!user?.id) return;
    try {
      const db = getDatabase(firebaseApp);
      const favoritesRef = ref(db, `profiles/${user.id}/favorites`);
      const snapshot = await get(favoritesRef);

      const favProfiles: Profile[] = [];
      if (snapshot.exists()) {
        const favorites = snapshot.val();
        for (const favId of Object.keys(favorites)) {
          const profileRef = ref(db, `profiles/${favId}`);
          const profileSnapshot = await get(profileRef);
          if (profileSnapshot.exists()) {
            const profileData = profileSnapshot.val();
            favProfiles.push({ uid: favId, ...profileData } as Profile);
          }
        }
      }
      setFavorites(favProfiles);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, [user?.id]);

  const loadBlocked = useCallback(async () => {
    if (!user?.id) return;
    try {
      const db = getDatabase(firebaseApp);
      const blocksRef = ref(db, 'blocks');
      const snapshot = await get(blocksRef);

      const blockedProfiles: Profile[] = [];
      if (snapshot.exists()) {
        const blocks = snapshot.val();
        for (const blockId of Object.keys(blocks)) {
          const block = blocks[blockId];
          if (block.blockerId === user.id) {
            const blockedRef = ref(db, `profiles/${block.blockedId}`);
            const blockedSnapshot = await get(blockedRef);
            if (blockedSnapshot.exists()) {
              const profileData = blockedSnapshot.val();
              blockedProfiles.push({ uid: block.blockedId, ...profileData } as Profile);
            }
          }
        }
      }
      setBlocked(blockedProfiles);
    } catch (error) {
      console.error('Error loading blocked:', error);
    }
  }, [user?.id]);

  const loadActivityData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      if (activeTab === 'likes') {
        await loadLikes();
      } else if (activeTab === 'favorites') {
        await loadFavorites();
      } else if (activeTab === 'blocked') {
        await loadBlocked();
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, loadLikes, loadFavorites, loadBlocked]);

  useEffect(() => {
    if (user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadActivityData();
    }
  }, [user?.id, loadActivityData]);

  const renderEmptyState = (title: string) => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons
          name={
            activeTab === 'likes'
              ? 'heart'
              : activeTab === 'favorites'
              ? 'star'
              : 'ban'
          }
          size={64}
          color={Colors.primary}
        />
      </View>
      <Text style={styles.emptyText}>{`Pas encore de ${title}`}</Text>
      <Text style={styles.emptySubtext}>{getEmptyMessage()}</Text>
    </View>
  );

  const renderProfileCard = (profile: Profile) => {
    const age = profile.birthDate
      ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear()
      : '?';

    return (
      <TouchableOpacity
        style={[styles.profileCard, Shadows.soft]}
        key={profile.uid}
        onPress={() =>
          router.push({
            pathname: '/profile/[id]',
            params: { id: profile.uid },
          })
        }
      >
        <Image
          source={{ uri: profile.photoUrl || 'https://via.placeholder.com/200' }}
          style={styles.profileImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.profileOverlay}
        >
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile.displayName || profile.name}, {age}
            </Text>
            {profile.location?.city && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={Colors.accent} />
                <Text style={styles.profileLocation}>{profile.location.city}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const getActiveData = () => {
    switch (activeTab) {
      case 'likes':
        return likes.map(l => l.profile).filter(Boolean) as Profile[];
      case 'favorites':
        return favorites;
      case 'blocked':
        return blocked;
      default:
        return [];
    }
  };

  const getEmptyTitle = () => {
    switch (activeTab) {
      case 'likes':
        return 'like';
      case 'favorites':
        return 'favoris';
      case 'blocked':
        return 'blocages';
      default:
        return '';
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'likes':
        return 'Les profils qui vous ont aimé apparaîtront ici';
      case 'favorites':
        return 'Les profils que vous avez aimés apparaîtront ici';
      case 'blocked':
        return 'Les profils que vous avez bloqués apparaîtront ici';
      default:
        return '';
    }
  };

  const activeData = getActiveData();
  const isEmpty = activeData.length === 0;

  if (isLoading) {
    return (
      <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Activité</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'likes' && styles.activeTab]}
            onPress={() => setActiveTab('likes')}
          >
            <Ionicons
              name="heart-outline"
              size={20}
              color={activeTab === 'likes' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[styles.tabText, activeTab === 'likes' && styles.activeTabText]}
            >
              Likes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
            onPress={() => setActiveTab('favorites')}
          >
            <Ionicons
              name="star"
              size={20}
              color={activeTab === 'favorites' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}
            >
              Favoris
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'blocked' && styles.activeTab]}
            onPress={() => setActiveTab('blocked')}
          >
            <Ionicons
              name="ban"
              size={20}
              color={activeTab === 'blocked' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[styles.tabText, activeTab === 'blocked' && styles.activeTabText]}
            >
              Bloqués
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isEmpty ? (
          renderEmptyState(getEmptyTitle())
        ) : (
          <FlatList
            data={activeData}
            renderItem={({ item }) => renderProfileCard(item)}
            keyExtractor={(item) => item.uid}
            contentContainerStyle={styles.listContent}
            numColumns={2}
            scrollEnabled={false}
          />
        )}
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 8,
    gap: 8,
  },
  profileCard: {
    flex: 0.5,
    aspectRatio: 0.7,
    margin: 4,
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    paddingBottom: 12,
  },
  profileInfo: {
    paddingHorizontal: 12,
    gap: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileLocation: {
    fontSize: 12,
    color: Colors.accent,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.cardSurface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
