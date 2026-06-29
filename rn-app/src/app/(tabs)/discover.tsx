import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../context/auth-context';
import { useDiscover } from '../../context/discover-context';
import { ProfileCard } from '../../components/profile-card';
import { locationService } from '../../services/location.service';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        Alert.alert('Permission Denied', 'Please enable location services to discover people');
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      Alert.alert('Error', 'Failed to load profiles');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const currentProfile = profiles[currentIndex] || null;
  const isFavorite = currentProfile ? favoriteIds.has(currentProfile.uid) : false;

  if (isLoading || isLoadingLocation) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF1744" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
    backgroundColor: '#fff',
  },
});
