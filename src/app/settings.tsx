import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/auth-context';
import { Colors, BorderRadius, Shadows } from '@/constants/theme';
import { ref, remove } from 'firebase/database';
import { rtdb, auth } from '@/config/firebase';
import { deleteUser } from 'firebase/auth';
import { useLocalization } from '@/context/localization-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useLocalization();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    Alert.alert(
      t('deleteAccountTitle'),
      t('deleteAccountMessage'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('finalConfirmation'),
              t('finalConfirmationMessage'),
              [
                {
                  text: t('cancel'),
                  style: 'cancel',
                },
                {
                  text: t('iUnderstandDelete'),
                  style: 'destructive',
                  onPress: async () => {
                    await performDeleteAccount();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const performDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      // Delete Firebase Auth user first (requires recent login)
      const currentUser = auth.currentUser;
      if (currentUser) {
        await deleteUser(currentUser);
      }

      // Delete profile from Realtime Database
      if (user.id) {
        try {
          await remove(ref(rtdb, `profiles/${user.id}`));
        } catch (error) {
          console.error('Error deleting profile from database:', error);
        }
      }

      Alert.alert(
        'Account deleted',
        'Your account has been permanently deleted.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
              setTimeout(() => {
                router.replace('/auth/login');
              }, 100);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error deleting account:', error);
      let errorMessage = 'An error occurred while deleting the account';

      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please log out and log back in before deleting your account.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert(t('error'), errorMessage);
      setIsDeleting(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <Text style={styles.settingName}>Push notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive alerts for messages and matches
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={notificationsEnabled ? Colors.accent : Colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <Text style={styles.settingName}>Share my location</Text>
                <Text style={styles.settingDescription}>
                  Show your location to your matches
                </Text>
              </View>
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={locationEnabled ? Colors.accent : Colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <TouchableOpacity style={styles.settingRow} disabled>
              <Text style={styles.settingName}>Version</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push('/legal/privacy-policy')}
            >
              <Text style={styles.settingName}>Privacy policy</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => router.push('/legal/terms-of-service')}
            >
              <Text style={styles.settingName}>Terms of service</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  section: {
    marginVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLabel: {
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.base,
    gap: 12,
    marginBottom: 12,
    ...Shadows.soft,
  },
  dangerButtonDisabled: {
    opacity: 0.6,
  },
  dangerButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  dangerWarning: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
});

