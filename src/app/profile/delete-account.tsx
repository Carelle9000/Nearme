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
import { useAuth } from '../../context/auth-context';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmationModal } from '../../components/ConfirmationModal';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (!password.trim()) {
      setError('Le mot de passe est requis');
      return;
    }

    setIsDeleting(true);
    try {
      // TODO: Implémenter deleteAccount dans AuthService
      // await authService.deleteAccount(password);

      // Temporary: just logout
      await logout();
      router.replace('/auth/login');
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la suppression du compte');
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
          <Text style={styles.headerTitle}>Supprimer mon compte</Text>
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
                <Text style={styles.warningTitle}>Attention</Text>
                <Text style={styles.warningText}>
                  La suppression de votre compte est permanente et irréversible.
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ce qui sera supprimé :</Text>
                <View style={styles.listItem}>
                  <Ionicons name="close-circle" size={20} color="#E74C3C" />
                  <Text style={styles.listText}>Toutes vos photos de profil</Text>
                </View>
                <View style={styles.listItem}>
                  <Ionicons name="close-circle" size={20} color="#E74C3C" />
                  <Text style={styles.listText}>Votre profil et vos informations</Text>
                </View>
                <View style={styles.listItem}>
                  <Ionicons name="close-circle" size={20} color="#E74C3C" />
                  <Text style={styles.listText}>Tous vos messages et conversations</Text>
                </View>
                <View style={styles.listItem}>
                  <Ionicons name="close-circle" size={20} color="#E74C3C" />
                  <Text style={styles.listText}>Votre compte et vos données</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => setStep(2)}
                disabled={isDeleting}
              >
                <Text style={styles.continueButtonText}>Continuer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.confirmationBox}>
                <Text style={styles.confirmationTitle}>Confirmez la suppression</Text>
                <Text style={styles.confirmationText}>
                  Cette action ne peut pas être annulée. Êtes-vous absolument certain de vouloir supprimer votre compte ?
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.continueButton, styles.dangerButton]}
                onPress={() => setStep(3)}
                disabled={isDeleting}
              >
                <Text style={styles.dangerButtonText}>Je suis sûr, continuer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setStep(1)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Revenir en arrière</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Entrez votre mot de passe</Text>
              <Text style={styles.stepDescription}>
                Pour des raisons de sécurité, veuillez confirmer votre mot de passe pour supprimer votre compte.
              </Text>

              <TextInput
                style={styles.passwordInput}
                placeholder="Votre mot de passe"
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
                  <Text style={styles.dangerButtonText}>Supprimer mon compte</Text>
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
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <ConfirmationModal
          visible={showPasswordModal}
          title="Dernière confirmation"
          message="Êtes-vous absolument certain de vouloir supprimer votre compte ? Cette action est irréversible."
          cancelText="Non, annuler"
          confirmText="Oui, supprimer"
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
