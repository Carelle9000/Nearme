import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="edit" />
      <Stack.Screen name="photos" />
      <Stack.Screen name="delete-account" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
