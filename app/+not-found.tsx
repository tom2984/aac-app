import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export default function NotFoundScreen() {
  const router = useRouter();

  const handleGoHome = () => {
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-gray-100 items-center justify-center px-8">
      <Text className="text-6xl mb-4">😕</Text>
      <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
        Page Not Found
      </Text>
      <Text className="text-base text-gray-600 mb-8 text-center">
        The page you're looking for doesn't exist.
      </Text>
      
      <Pressable
        onPress={handleGoHome}
        className="bg-[#FF6551] rounded-lg py-3 px-6 items-center"
        accessibilityRole="button"
      >
        <Text className="text-white font-semibold">Go to Login</Text>
      </Pressable>
    </View>
  );
}
