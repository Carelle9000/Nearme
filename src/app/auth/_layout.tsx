import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" options={{ animationTypeForReplace: 'pop' }} />
      <Stack.Screen name="signup" options={{ animationTypeForReplace: 'pop' }} />
      <Stack.Screen name="signup-step1" options={{ animationTypeForReplace: 'pop' }} />
      <Stack.Screen name="signup-step2" />
      <Stack.Screen name="signup-step3" />
      <Stack.Screen name="register" />
      <Stack.Screen name="age-verification" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
