import { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/auth-context';
import { useRouter, Link } from 'expo-router';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { signupService } from '../../services/signup.service';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const loginAttemptsRef = useRef(0);
  const lastLoginAttemptRef = useRef(0);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const now = Date.now();
    const delayMs = 1000 * Math.pow(2, loginAttemptsRef.current);

    if (now - lastLoginAttemptRef.current < delayMs && loginAttemptsRef.current > 0) {
      Alert.alert('Trop de tentatives', 'Veuillez réessayer dans quelques secondes.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
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
      <Text style={styles.title}>NearMe</Text>
      <Text style={styles.subtitle}>Find people near you</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Link href="/auth/register" asChild>
          <TouchableOpacity disabled={isLoading}>
            <Text style={styles.link}>Sign up</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: Colors.textSecondary,
  },
  form: {
    gap: 16,
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.secondary,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    ...Shadows.glow,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: Colors.textSecondary,
  },
  link: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
