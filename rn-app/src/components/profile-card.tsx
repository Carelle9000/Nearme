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
import { Ionicons } from '@expo/vector-icons';
import { Profile } from '../models/user';

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

        {/* Gradient Overlay */}
        <View style={styles.gradient} />

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {profile.displayName || profile.name}, {age}
            </Text>
            {isFavorite && <Ionicons name="heart" size={20} color="#FF1744" />}
          </View>

          {profile.location?.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color="#fff" />
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
          <Ionicons name="close" size={28} color="#FF1744" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.infoButton} onPress={onViewProfile}>
          <Ionicons name="information-circle" size={28} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.favoriteButton} onPress={onFavorite}>
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={28} color="#FF1744" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.likeButton} onPress={onLike}>
          <Ionicons name="heart" size={28} color="#fff" />
        </TouchableOpacity>
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
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    color: '#fff',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: '#fff',
  },
  bio: {
    fontSize: 14,
    color: '#f0f0f0',
    marginBottom: 8,
    lineHeight: 20,
  },
  interestsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestText: {
    fontSize: 12,
    color: '#fff',
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
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF1744',
  },
  infoButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF1744',
  },
  likeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF1744',
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
    color: '#000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
