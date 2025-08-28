import { Stack } from 'expo-router';

export default function FirstTimeLoginLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swiping back during onboarding
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="prompt" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
