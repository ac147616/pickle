import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="choose-lane" />
      <Stack.Screen name="individual" />
      <Stack.Screen name="business" />
    </Stack>
  );
}
