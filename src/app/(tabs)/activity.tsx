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
import { useAuth } from '../../context/auth-context';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Profile } from '../../models/user';

type Tab = 'matches' | 'likes' | 'favorites' | 'blocked';

interface Like {
  swiperId: string;
  action: 'like' | 'pass';
  profile?: Profile;
}

export default function ActivityScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('matches');
  const [matches, setMatches] = useState<Profile[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [favorites, setFavorites] = useState<Profile[]>([]);
  const [blocked, setBlocked] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadActivityData();
    }
  }, [user?.id, loadActivityData]);

  const loadMatches = useCallback(async () => {
    if (!user?.id) return;
    try {
      const q1 = query(collection(db, 'swipes'), where('swiped_id', '==', user.id), where('action', '==', 'like'));
      const likesSnapshot = await getDocs(q1);
      const likerIds = likesSnapshot.docs.map(doc => doc.data().swiper_id);

      const q2 = query(collection(db, 'swipes'), where('swiper_id', '==', user.id), where('action', '==', 'like'));
      const likedSnapshot = await getDocs(q2);
      const likedIds = likedSnapshot.docs.map(doc => doc.data().swiped_id);

      const matchIds = likerIds.filter(id => likedIds.includes(id));

      const matchProfiles: Profile[] = [];
      for (const matchId of matchIds) {
        const profileRef = doc(db, 'users', matchId);
        const profileDoc = await getDoc(profileRef);
        if (profileDoc.exists()) {
          matchProfiles.push({ uid: profileDoc.id, ...profileDoc.data() } as Profile);
        }
      }
      setMatches(matchProfiles);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  }, [user?.id]);

  const loadLikes = useCallback(async () => {
    if (!user?.id) return;
    try {
      const q = query(collection(db, 'swipes'), where('swiped_id', '==', user.id));
      const snapshot = await getDocs(q);

      const likesData: Like[] = [];
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.action === 'like') {
          likesData.push({
            swiperId: data.swiper_id,
            action: 'like',
          });
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
      const userRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userRef);
      const favoriteIds = userDoc.data()?.favoriteIds || [];

      const favProfiles: Profile[] = [];
      for (const favId of favoriteIds) {
        const favRef = doc(db, 'users', favId);
        const favDoc = await getDoc(favRef);
        if (favDoc.exists()) {
          favProfiles.push({ uid: favDoc.id, ...favDoc.data() } as Profile);
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
      const q = query(collection(db, 'blocks'), where('blocker_id', '==', user.id));
      const snapshot = await getDocs(q);

      const blockedProfiles: Profile[] = [];
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const blockedRef = doc(db, 'users', data.blocked_id);
        const blockedDoc = await getDoc(blockedRef);
        if (blockedDoc.exists()) {
          blockedProfiles.push({ uid: blockedDoc.id, ...blockedDoc.data() } as Profile);
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
      if (activeTab === 'matches') {
        await loadMatches();
      } else if (activeTab === 'likes') {
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
  }, [activeTab, loadMatches, loadLikes, loadFavorites, loadBlocked]);

  const renderEmptyState = (title: string) => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons
          name={
            activeTab === 'matches'
              ? 'heart'
              : activeTab === 'likes'
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
      <TouchableOpacity style={[styles.profileCard, Shadows.soft]} key={profile.uid}>
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
      case 'matches':
        return matches;
      case 'likes':
        return likes;
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
      case 'matches':
        return 'match';
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
      case 'matches':
        return 'Vos correspondances mutuelles apparaîtront ici';
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
            style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
            onPress={() => setActiveTab('matches')}
          >
            <Ionicons
              name="heart"
              size={20}
              color={activeTab === 'matches' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[styles.tabText, activeTab === 'matches' && styles.activeTabText]}
            >
              Matches
            </Text>
          </TouchableOpacity>

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
            renderItem={({ item }) => renderProfileCard(item as any)}
            keyExtractor={(item) => (item as any).uid || (item as any).swiperId}
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
