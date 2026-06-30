import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * This component redirects to the new multi-step signup flow
 */
export default function RegisterScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/signup');
  }, []);

  return null;
}
