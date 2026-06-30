import { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth-context';
import { useRouter } from 'expo-router';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { signupService } from '../../services/signup.service';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { sendPasswordReset, resetPassword, verifyResetCode } = useAuth();
  const router = useRouter();

  const handleSendReset = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse email');
      return;
    }

    if (!signupService.isEmailValid(email)) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      Alert.alert(
        'Email envoyé',
        'Vérifiez votre email pour le lien de réinitialisation. Entrez le code reçu ci-dessous.'
      );
      setStep('reset');
    } catch (error: any) {
      const message = signupService.getErrorMessage(error.message);
      Alert.alert('Erreur', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!oobCode.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le code de réinitialisation');
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    const passwordValidation = signupService.isPasswordStrong(newPassword);
    if (!passwordValidation.valid) {
      Alert.alert('Mot de passe faible', passwordValidation.reason);
      return;
    }

    setIsLoading(true);
    try {
      await verifyResetCode(oobCode);
      await resetPassword(oobCode, newPassword);
      Alert.alert(
        'Succès',
        'Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.'
      );
      router.replace('/auth/login');
    } catch (error: any) {
      const message = signupService.getErrorMessage(error.message);
      Alert.alert('Erreur', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => (step === 'email' ? router.back() : setStep('email'))}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.primary} />
      </TouchableOpacity>

      {step === 'email' ? (
        <>
          <View style={styles.headerContainer}>
            <Ionicons name="lock-open" size={48} color={Colors.primary} style={styles.icon} />
            <Text style={styles.title}>Mot de passe oublié?</Text>
            <Text style={styles.subtitle}>
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre
              mot de passe.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Adresse email"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <LinearGradient
              colors={[Colors.primary, '#C82E42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.buttonGradient, Shadows.glow]}
            >
              <TouchableOpacity
                style={styles.button}
                onPress={handleSendReset}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.text} />
                ) : (
                  <Text style={styles.buttonText}>Envoyer le lien</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </>
      ) : (
        <>
          <View style={styles.headerContainer}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.primary} />
            <Text style={styles.title}>Réinitialiser le mot de passe</Text>
            <Text style={styles.subtitle}>
              Entrez le code reçu dans votre email et votre nouveau mot de passe.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>CODE DE RÉINITIALISATION</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Entrez le code"
                placeholderTextColor={Colors.textSecondary}
                value={oobCode}
                onChangeText={setOobCode}
                editable={!isLoading}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>NOUVEAU MOT DE PASSE</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed"
                size={20}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nouveau mot de passe"
                placeholderTextColor={Colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>CONFIRMER LE MOT DE PASSE</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed"
                size={20}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor={Colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
            </View>

            <Text style={styles.passwordHint}>
              Le mot de passe doit contenir 12+ caractères avec minuscules, majuscules, chiffres
              et symboles.
            </Text>

            <LinearGradient
              colors={[Colors.primary, '#C82E42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.buttonGradient, Shadows.glow]}
            >
              <TouchableOpacity
                style={styles.button}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.text} />
                ) : (
                  <Text style={styles.buttonText}>Réinitialiser le mot de passe</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    marginBottom: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginHorizontal: 8,
  },
  form: {
    gap: 16,
    marginBottom: 32,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  inputIcon: {
    marginVertical: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  passwordHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  buttonGradient: {
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
    marginTop: 16,
  },
  button: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
});
