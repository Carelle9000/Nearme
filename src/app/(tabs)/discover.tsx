import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text, Image } from 'react-native';
import { useDiscover } from '../../context/discover-context';
import { ProfileCard } from '../../components/profile-card';
import { FilterPanel } from '../../components/filter-panel';
import { locationService } from '../../services/location.service';
import { useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useLocalization } from '../../context/localization-context';

export default function DiscoverScreen() {
  const { profiles, currentIndex, isLoading, loadNearbyProfiles, like, nope, favorite, favoriteIds } =
    useDiscover();
  const { t } = useLocalization();

  const loadProfiles = useCallback(async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        await loadNearbyProfiles(location.latitude, location.longitude);
      } else {
        Alert.alert(t('error'), 'Veuillez activer les services de localisation');
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      Alert.alert(t('error'), t('noProfiles'));
    }
  }, [loadNearbyProfiles]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const currentProfile = profiles[currentIndex] || null;
  const isFavorite = currentProfile ? favoriteIds.has(currentProfile.uid) : false;

  if (isLoading) {
    return (
      <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </LinearGradient>
    );
  }

  if (profiles.length === 0 && !isLoading) {
    return (
      <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/images/logon.jpeg')}
                style={styles.logo}
              />
              <Text style={styles.logoText}>nearme</Text>
            </View>
            <View style={styles.headerActions}>
              <FilterPanel />
              <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="menu" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Empty State */}
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={Colors.primary} />
            <Text style={styles.emptyTitle}>{t('noProfiles')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('noResults')}
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => loadProfiles()}
            >
              <Text style={styles.emptyButtonText}>{t('tryAgain')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/logon.jpeg')}
              style={styles.logo}
            />
            <Text style={styles.logoText}>nearme</Text>
          </View>
          <View style={styles.headerActions}>
            <FilterPanel />
            <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="menu" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
