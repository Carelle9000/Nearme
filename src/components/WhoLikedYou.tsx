import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Profile } from '../models/user';
import { Colors, BorderRadius, Spacing, Shadows } from '../constants/theme';

interface WhoLikedYouProps {
  profiles: Profile[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const { width } = Dimensions.get('window');
const GRID_COLS = 2;
const ITEM_WIDTH = (width - Spacing.three * 2 - Spacing.two) / GRID_COLS;

/**
 * WhoLikedYou: Displays grid of profiles that liked the current user
 * Premium feature only
 */
export function WhoLikedYou({ profiles, isLoading = false, onRefresh }: WhoLikedYouProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (profiles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={64} color={Colors.accent} />
        <Text style={styles.emptyTitle}>Pas encore de likes</Text>
        <Text style={styles.emptyDescription}>
          Soyez patient, bientôt quelqu'un va vous liker !
        </Text>
      </View>
    );
  }

  const renderProfile = ({ item }: { item: Profile }) => {
    const age = item.birthDate
      ? new Date().getFullYear() - new Date(item.birthDate).getFullYear()
      : '?';

    return (
      <TouchableOpacity
        style={styles.profileCard}
        onPress={() => router.push(`/profile/${item.uid}`)}
        activeOpacity={0.8}
      >
        {/* Profile Image */}
        <Image
          source={{
            uri: item.photoUrl || 'https://via.placeholder.com/300x400?text=No+Photo',
          }}
          style={styles.profileImage}
          resizeMode="cover"
        />

        {/* Overlay */}
        <View style={styles.overlay} />

        {/* Info */}
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {item.displayName || item.name}, {age}
          </Text>
          {item.location?.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={12} color={Colors.accent} />
              <Text style={styles.locationText}>{item.location.city}</Text>
            </View>
          )}
        </View>

        {/* Heart Badge */}
        <View style={styles.heartBadge}>
          <Ionicons name="heart" size={20} color={Colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={profiles}
        renderItem={renderProfile}
        keyExtractor={(item) => item.uid}
        numColumns={GRID_COLS}
        columnWrapperStyle={styles.columnWrapper}
        scrollEnabled={false}
        refreshing={isLoading}
        onRefresh={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.two,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  profileCard: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.3,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  profileInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.half,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 11,
    color: Colors.accent,
    marginLeft: Spacing.half,
  },
  heartBadge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.glow,
  },
});
