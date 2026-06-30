import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
import { useAuth } from '../../context/auth-context';
import { useDiscover } from '../../context/discover-context';
import { ProfileCard } from '../../components/profile-card';
import { locationService } from '../../services/location.service';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

export default function DiscoverScreen() {
  const { user } = useAuth();
  const { profiles, currentIndex, isLoading, loadNearbyProfiles, like, nope, favorite, favoriteIds } =
    useDiscover();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setIsLoadingLocation(true);
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        await loadNearbyProfiles(location.latitude, location.longitude);
      } else {
        Alert.alert('Permission refusée', 'Veuillez activer les services de localisation pour découvrir des personnes');
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      Alert.alert('Erreur', 'Impossible de charger les profils');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const currentProfile = profiles[currentIndex] || null;
  const isFavorite = currentProfile ? favoriteIds.has(currentProfile.uid) : false;

  if (isLoading || isLoadingLocation) {
    return (
      <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>nearme</Text>
          <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="menu" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <ProfileCard
          profile={currentProfile}
          isFavorite={isFavorite}
          onNope={() => currentProfile && nope(currentProfile.uid)}
          onLike={() => currentProfile && like(currentProfile.uid)}
          onFavorite={() => currentProfile && favorite(currentProfile.uid)}
          onViewProfile={() => {
            // TODO: Navigate to profile detail view
          }}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
});
