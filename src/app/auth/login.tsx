import { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth-context';
import { useRouter, Link } from 'expo-router';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { signupService } from '../../services/signup.service';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login, getRememberedEmail } = useAuth();
  const router = useRouter();

  const loginAttemptsRef = useRef(0);
  const lastLoginAttemptRef = useRef(0);

  useEffect(() => {
    const loadRememberedEmail = async () => {
      try {
        const remembered = await getRememberedEmail();
        if (remembered) {
          setEmail(remembered);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l&apos;email sauvegardé:', error);
      }
    };
    loadRememberedEmail();
  }, [getRememberedEmail]);

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('L\'email est requis');
      isValid = false;
    } else if (!signupService.isEmailValid(email)) {
      setEmailError('Veuillez entrer une adresse email valide');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Le mot de passe est requis');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    const now = Date.now();
    const delayMs = 1000 * Math.pow(2, loginAttemptsRef.current);

    if (now - lastLoginAttemptRef.current < delayMs && loginAttemptsRef.current > 0) {
      Alert.alert(
        'Trop de tentatives',
        'Veuillez réessayer dans quelques secondes.'
      );
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password, rememberMe);
      loginAttemptsRef.current = 0;
      lastLoginAttemptRef.current = 0;
      router.replace('/(tabs)/discover');
    } catch (error: any) {
      loginAttemptsRef.current++;
      lastLoginAttemptRef.current = now;
      const message = signupService.getErrorMessage(error.code || error.message);
      Alert.alert('Erreur de connexion', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/images/logon.jpeg')}
            style={styles.logo}
          />
          <Text style={styles.title}>NearMe</Text>
          <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
              <Ionicons name="mail" size={20} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Adresse email"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                }}
                editable={!isLoading}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* Password Field */}
          <View style={styles.fieldContainer}>
            <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
              <Ionicons name="lock-closed" size={20} color={Colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError('');
                }}
                editable={!isLoading}
                secureTextEntry={!showPassword}
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

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              disabled={isLoading}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxChecked,
                ]}
              >
                {rememberMe && (
                  <Ionicons name="checkmark" size={14} color={Colors.text} />
                )}
              </View>
              <Text style={styles.rememberMeText}>Se souvenir de moi</Text>
            </TouchableOpacity>

            <Link href="/auth/forgot-password" asChild>
              <TouchableOpacity disabled={isLoading}>
                <Text style={styles.forgotPasswordLink}>Mot de passe oublié?</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Login Button */}
          <LinearGradient
            colors={[Colors.primary, '#C82E42']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.buttonGradient, Shadows.glow]}
          >
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.text} size="small" />
              ) : (
                <>
                  <Ionicons name="log-in" size={18} color={Colors.text} style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Se connecter</Text>
                </>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Signup Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Vous n&apos;avez pas de compte? </Text>
          <Link href="/auth/signup" asChild>
            <TouchableOpacity disabled={isLoading}>
              <Text style={styles.signupLink}>S&apos;inscrire</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    marginBottom: 8,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    gap: 20,
    marginBottom: 32,
  },
  fieldContainer: {
    gap: 6,
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rememberMeText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  forgotPasswordLink: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
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
  signupLink: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
