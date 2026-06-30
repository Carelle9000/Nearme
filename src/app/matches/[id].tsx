import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/auth-context';
import { userService } from '../../services';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Profile } from '../../models/user';

export default function MatchProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

  const loadProfile = async () => {
    try {
      const data = await userService.getProfile(id!);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const age = profile.birthDate
    ? new Date().getFullYear() - new Date(profile.birthDate).getFullYear()
    : '?';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
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
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {profile.displayName || profile.name}, {age}
            </Text>
          </View>

          {profile.location?.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color="#FF1744" />
              <Text style={styles.location}>{profile.location.city}</Text>
            </View>
          )}

          {profile.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.interestsList}>
                {profile.interests.map((interest, index) => (
                  <View key={index} style={styles.interestTag}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.messageButton}
            onPress={() =>
              router.push({
                pathname: '/chat/[id]',
                params: { id: id },
              })
            }
          >
            <Ionicons name="chatbubbles" size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Send Message</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  photo: {
    width: '100%',
    height: 400,
    backgroundColor: '#f0f0f0',
  },
  infoSection: {
    padding: 16,
  },
  nameRow: {
    marginBottom: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  location: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestText: {
    fontSize: 14,
    color: '#000',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF1744',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
