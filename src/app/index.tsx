import { useAuth } from '../context/auth-context';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useEffect } from 'react';

export default function RootIndex() {
  const { isLoading, isLoggedIn, needsAgeVerification } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isLoggedIn) {
      if (needsAgeVerification) {
        router.replace('/auth/age-verification');
      } else {
        router.replace('/(tabs)/discover');
      }
    } else {
      router.replace('/landing');
    }
  }, [isLoading, isLoggedIn, needsAgeVerification]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack />;
}
