import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Profile } from '../models/user';
import { Colors, BorderRadius, Shadows } from '../constants/theme';

interface ProfileCardProps {
  profile: Profile | null;
  isFavorite?: boolean;
  onLike?: () => void;
  onNope?: () => void;
  onFavorite?: () => void;
  onViewProfile?: () => void;
}

const { width, height } = Dimensions.get('window');

export function ProfileCard({
  profile,
  isFavorite = false,
  onLike,
  onNope,
  onFavorite,
  onViewProfile,
}: ProfileCardProps) {
  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No more profiles</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters or check back later</Text>
        </View>
      </View>
    );
  }

  const age = profile.birthDate
    ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear()
    : '?';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Profile Photo */}
        <Image
          source={{
            uri: profile.photoUrl || 'https://via.placeholder.com/400x500?text=No+Photo',
          }}
          style={styles.photo}
          resizeMode="cover"
        />

        {/* Dark Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(30, 17, 23, 0.9)']}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradient}
        />

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {profile.displayName || profile.name}, {age}
            </Text>
            {isFavorite && <Ionicons name="heart" size={20} color={Colors.primary} />}
          </View>

          {profile.location?.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color={Colors.accent} />
              <Text style={styles.location}>{profile.location.city}</Text>
            </View>
          )}

          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.interestsRow}>
              {profile.interests.slice(0, 3).map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.nopButton} onPress={onNope}>
          <Ionicons name="close" size={28} color={Colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoButton} onPress={onViewProfile}>
          <Ionicons name="information-circle" size={28} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.favoriteButton} onPress={onFavorite}>
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={28} color={Colors.primary} />
        </TouchableOpacity>

        <LinearGradient
          colors={[Colors.primary, '#C82E42']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.likeButtonGradient}
        >
          <TouchableOpacity style={styles.likeButton} onPress={onLike}>
            <Ionicons name="heart" size={28} color={Colors.text} />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: width - 32,
    height: height * 0.65,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.cardSurface,
    ...Shadows.card,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  infoSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: Colors.accent,
  },
  bio: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  interestsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: 'rgba(245, 165, 181, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: 'rgba(245, 165, 181, 0.3)',
  },
  interestText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  nopButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    ...Shadows.soft,
  },
  infoButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.soft,
  },
  favoriteButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    ...Shadows.soft,
  },
  likeButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  likeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
