import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/auth-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/theme';

interface AuthGuardProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

export function AuthGuard({ children, requireVerification = false }: AuthGuardProps) {
  const { isLoggedIn, isLoading, needsAgeVerification } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/auth/login');
    }

    if (!isLoading && requireVerification && needsAgeVerification) {
      router.replace('/auth/age-verification');
    }
  }, [isLoggedIn, isLoading, requireVerification, needsAgeVerification, router]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Accès non autorisé</Text>
      </View>
    );
  }

  if (requireVerification && needsAgeVerification) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Vérification d\'âge requise</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text,
  },
  errorText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
});
