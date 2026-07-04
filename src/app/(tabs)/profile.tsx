import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/auth-context';
import { usePremium } from '@/context/premium-context';
import { useToast } from '@/context/toast-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows } from '@/constants/theme';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { AnalyticsCard } from '@/components/AnalyticsCard';
import { useState } from 'react';
import { useLocalization } from '@/context/localization-context';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isPremium, stats, isLoadingAnalytics } = usePremium();
  const router = useRouter();
  const { t } = useLocalization();
  const { error: showError } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      console.log('Starting logout...');
      await logout();
      console.log('Logout successful, redirecting to login...');
      setShowLogoutConfirm(false);
      router.replace('/auth/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      const errorMessage = error?.message || t('errorUnableToSignOut') || 'An error occurred while signing out';
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
      showError(errorMessage);
    }
  };

  if (!user) {
    return <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container} />;
  }

  const age = user.birthDate
    ? new Date().getFullYear() - new Date(user.birthDate).getFullYear()
    : '?';

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ConfirmationModal
          visible={showLogoutConfirm}
          title={t('logout')}
          message={t('areYouSureLogout')}
          cancelText={t('cancel')}
          confirmText={t('logout')}
          isDangerous={false}
          isLoading={isLoggingOut}
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={confirmLogout}
        />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#fff" />
              </View>
            )}
          </View>

          <Text style={styles.name}>
            {user.displayName || user.name}, {age}
          </Text>
          <Text style={styles.email}>{user.email}</Text>

          {user.location?.city && (
            <View style={styles.locationBadge}>
              <Ionicons name="location-sharp" size={14} color={Colors.primary} />
              <Text style={styles.locationText}>{user.location.city}</Text>
            </View>
          )}
        </View>

        {/* Bio Section */}
        {user.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('bio')}</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        )}

        {/* Interests Section */}
        {user.interests && user.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('interests')}</Text>
            <View style={styles.interestsList}>
              {user.interests.map((interest, index) => (
                <View key={index} style={styles.interestBadge}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Analytics Card (Premium Feature) */}
        <View style={styles.section}>
          <AnalyticsCard
            isPremium={isPremium}
            profileViews={stats?.profileViews || 0}
            likesReceived={stats?.likesReceived || 0}
            isLoading={isLoadingAnalytics}
            onViewAnalytics={() => router.push('/premium/liked')}
            onUpgrade={() => router.push('/premium')}
          />
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/profile/edit')}>
            <Ionicons name="create-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>{t('editMyProfile')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/profile/photos')}>
            <Ionicons name="image-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>{t('manageMyPhotos')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>{t('settings')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.text} />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>{t('logout')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => router.push('/profile/delete-account')}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>{t('deleteMyAccount')}</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondary,
    ...Shadows.card,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(232, 61, 81, 0.1)',
    borderRadius: BorderRadius.base,
    marginTop: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(232, 61, 81, 0.2)',
  },
  locationText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.base,
  },
  interestText: {
    fontSize: 14,
    color: Colors.accent,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.soft,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  logoutButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    marginTop: 12,
  },
  logoutButtonText: {
    color: Colors.text,
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
    borderColor: '#E74C3C',
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#fff',
  },
});


