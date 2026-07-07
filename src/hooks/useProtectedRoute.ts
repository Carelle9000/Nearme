import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/auth-context';

export function useProtectedRoute() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/auth/login');
    }
  }, [isLoggedIn, isLoading, router]);

  return {
    isProtected: isLoggedIn,
    isLoading,
  };
}
