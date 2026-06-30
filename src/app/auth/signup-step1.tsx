import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useSignup } from '../../context/signup-context';
import { signupService } from '../../services/signup.service';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Link } from 'expo-router';

export default function SignupStep1() {
  const { data, updateData, nextStep } = useSignup();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate email
    if (!data.email.trim()) {
      setEmailError('L\'email est requis');
      isValid = false;
    } else if (!signupService.isEmailValid(data.email)) {
      setEmailError('Veuillez entrer une adresse email valide');
      isValid = false;
    }

    // Validate password
    if (!data.password) {
      setPasswordError('Le mot de passe est requis');
      isValid = false;
    } else {
      const passwordValidation = signupService.isPasswordStrong(data.password);
      if (!passwordValidation.valid) {
        setPasswordError(passwordValidation.reason || 'Le mot de passe n\'est pas assez fort');
        isValid = false;
      }
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Veuillez confirmer le mot de passe');
      isValid = false;
    } else if (confirmPassword !== data.password) {
      setConfirmPasswordError('Les mots de passe ne correspondent pas');
      isValid = false;
    }

    return isValid;
  };

  const handleCreateAccount = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Create Firebase account
      await signupService.createAccount(data.email, data.password);
      // Move to next step
      nextStep();
    } catch (error: any) {
      const message = signupService.getErrorMessage(error.code || error.message);
      Alert.alert('Erreur lors de l\'inscription', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../../assets/images/logon.jpeg')}
          style={styles.logo}
        />
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Commencez à rencontrer des personnes près de chez vous</Text>
      </View>

      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.step, styles.activeStep]}>
          <View style={[styles.stepCircle, styles.stepCircleActive]}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <Text style={styles.stepLabel}>Compte</Text>
        </View>
        <View style={styles.stepConnector} />
        <View style={styles.step}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNumberInactive}>2</Text>
          </View>
          <Text style={styles.stepLabelInactive}>Règles</Text>
        </View>
        <View style={styles.stepConnector} />
        <View style={styles.step}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNumberInactive}>3</Text>
          </View>
          <Text style={styles.stepLabelInactive}>Profil</Text>
        </View>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Email Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Adresse email</Text>
          <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
            <Ionicons name="mail" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="exemple@email.com"
              placeholderTextColor={Colors.textSecondary}
              value={data.email}
              onChangeText={(email) => {
                updateData({ email });
                setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        {/* Password Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Mot de passe</Text>
          <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
            <Ionicons name="lock-closed" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Au moins 8 caractères"
              placeholderTextColor={Colors.textSecondary}
              value={data.password}
              onChangeText={(password) => {
                updateData({ password });
                setPasswordError('');
              }}
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
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        {/* Confirm Password Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <View style={[styles.inputContainer, confirmPasswordError ? styles.inputError : null]}>
            <Ionicons name="lock-closed" size={20} color={Colors.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmez votre mot de passe"
              placeholderTextColor={Colors.textSecondary}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setConfirmPasswordError('');
              }}
              secureTextEntry={!showConfirmPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye' : 'eye-off'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
        </View>

        {/* Create Account Button */}
        <LinearGradient
          colors={[Colors.primary, '#C82E42']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.buttonGradient, Shadows.glow]}
        >
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleCreateAccount}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.text} size="small" />
            ) : (
              <>
                <Ionicons name="person-add" size={18} color={Colors.text} style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Continuer</Text>
              </>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Already have account */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Vous avez déjà un compte? </Text>
        <Link href="/auth/login" asChild>
          <TouchableOpacity disabled={isLoading}>
            <Text style={styles.loginLink}>Se connecter</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.base,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
  },
  step: {
    alignItems: 'center',
    flex: 1,
  },
  activeStep: {
    opacity: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  stepNumberInactive: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  stepLabelInactive: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  stepConnector: {
    height: 2,
    flex: 0.6,
    backgroundColor: Colors.border,
    marginBottom: 28,
  },
  form: {
    gap: 20,
    marginBottom: 32,
  },
  fieldContainer: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
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
  inputError: {
    borderColor: '#FF6B6B',
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
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginLeft: 4,
    fontWeight: '500',
  },
  buttonGradient: {
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
