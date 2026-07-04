import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { get, ref, query, orderByChild, equalTo } from 'firebase/database';
import { rtdb } from '@/config/firebase';
import { useAuth } from '@/context/auth-context';
import { useLocalization } from '@/context/localization-context';
import { Colors, BorderRadius, Shadows } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { userService } from '@/services/user.service';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { t } = useLocalization();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanupBlocksForUser = async (userId: string): Promise<void> => {
    try {
      console.log('[DeleteAccount] Cleaning up blocks for user:', userId);
      const snapshot = await get(
        query(
          ref(rtdb, 'blocks'),
          orderByChild('blockerId'),
          equalTo(userId)
        )
      );

      if (!snapshot.val()) {
        console.log('[DeleteAccount] No blocks found to clean up');
        return;
      }

      const blocks = snapshot.val() as Record<string, any>;
      const blockIds = Object.keys(blocks);

      console.log(`[DeleteAccount] Found ${blockIds.length} blocks to clean up`);

      // Delete each block (one at a time to avoid timeout)
      for (const blockId of blockIds) {
        try {
          await userService.unblock(userId, blocks[blockId].blockedId);
        } catch (err) {
          console.warn(`[DeleteAccount] Failed to clean up block ${blockId}:`, err);
          // Continue with next block even if this one fails
        }
      }

      console.log('[DeleteAccount] Blocks cleanup completed');
    } catch (error) {
      console.error('[DeleteAccount] Error cleaning up blocks:', error);
      // Non-blocking: continue with account deletion even if cleanup fails
    }
  };

  const handleDeleteAccount = async () => {
    if (!password.trim()) {
      setError(t('passwordRequired'));
      return;
    }

    setIsDeleting(true);
    try {
      // Clean up blocks before deleting account
      if (user?.id) {
        await cleanupBlocksForUser(user.id);
      }

      // TODO: Implement deleteAccount in AuthService
      // await authService.deleteAccount(password);

      // Temporary: just logout
      await logout();
      router.replace('/auth/login');
    } catch (error: any) {
      setError(error.message || t('errorUnknown'));
      setIsDeleting(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/profile');
              }
            }}
            disabled={isDeleting}
          >
            <Ionicons name="chevron-back" size={28} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('deleteMyAccount')}</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {error && (
            <View style={styles.errorContainer}>
              <View style={styles.errorContent}>
                <Ionicons name="alert-circle" size={20} color="#fff" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setError(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={48} color="#E74C3C" />
                <Text style={styles.warningTitle}>{t('deleteAccountTitle')}</Text>
                <Text style={styles.warningText}>
                  {t('deleteAccountMessage')}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('deleteAccountTitle')}:</Text>
                <View style={styles.listItem}>
                  <Ionicons name="close-circle" size={20} color="#E74C3C" />
                  <Text style={styles.listText}>{t('profilePhotoUpdated')}</Text>
                </View>
                <View style={styles.listItem}>
                  <Ionicons name="close-circle" size={20} color="#E74C3C" />
                  <Text style={styles.listText}>Your profile and your information</Text>
                </View>
                <View style={styles.listItem}>
                  <Ionicons name="close-circle" size={20} color="#E74C3C" />
                  <Text style={styles.listText}>All your messages and conversations</Text>
                </View>
                <View style={styles.listItem}>
                  <Ionicons name="close-circle" size={20} color="#E74C3C" />
                  <Text style={styles.listText}>Your account and your data</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => setStep(2)}
                disabled={isDeleting}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.confirmationBox}>
                <Text style={styles.confirmationTitle}>Confirm deletion</Text>
                <Text style={styles.confirmationText}>
                  This action cannot be undone. Are you absolutely sure you want to delete your account?
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.continueButton, styles.dangerButton]}
                onPress={() => setStep(3)}
                disabled={isDeleting}
              >
                <Text style={styles.dangerButtonText}>I am sure, continue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setStep(1)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Go back</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Enter your password</Text>
              <Text style={styles.stepDescription}>
                For security reasons, please confirm your password to delete your account.
              </Text>

              <TextInput
                style={styles.passwordInput}
                placeholder={t('password')}
                placeholderTextColor={Colors.textSecondary}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!isDeleting}
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.continueButton, styles.dangerButton, isDeleting && styles.disabledButton]}
                onPress={() => setShowPasswordModal(true)}
                disabled={isDeleting || !password.trim()}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.dangerButtonText}>Delete my account</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setStep(2);
                  setPassword('');
                }}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <ConfirmationModal
          visible={showPasswordModal}
          title="Final confirmation"
          message="Are you absolutely sure you want to delete your account? This action is irreversible."
          cancelText="No, cancel"
          confirmText="Yes, delete"
          isDangerous={true}
          isLoading={isDeleting}
          onCancel={() => setShowPasswordModal(false)}
          onConfirm={handleDeleteAccount}
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
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  stepContainer: {
    marginBottom: 32,
  },
  warningBox: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderRadius: BorderRadius.base,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.2)',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E74C3C',
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  confirmationBox: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.base,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  confirmationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
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
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  listText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  passwordInput: {
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 20,
    ...Shadows.soft,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.base,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    ...Shadows.soft,
  },
  continueButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  dangerButton: {
    backgroundColor: '#E74C3C',
  },
  dangerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.base,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: BorderRadius.base,
    marginBottom: 16,
    gap: 8,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

