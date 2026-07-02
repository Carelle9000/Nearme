import { Stack } from 'expo-router';

export default function PremiumLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="liked" />
    </Stack>
  );
}
