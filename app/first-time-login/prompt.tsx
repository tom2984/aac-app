import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

const FirstTimePromptScreen = () => {
  const { user } = useAuth();
  const router = useRouter();

  const handleChangePassword = () => {
    router.push('/first-time-login/change-password');
  };

  const handleSkipToWelcome = () => {
    router.push('/first-time-login/welcome');
  };

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <View className="flex-1 items-center justify-center">
        <Image
          source={require('../../assets/images/AAC-Logo.png')}
          className="mb-8"
          style={{ width: 120, height: 120, resizeMode: 'contain' }}
          accessibilityLabel="AAC Logo"
        />

        <Text className="text-2xl font-bold text-gray-900 text-center mb-4">
          Welcome to AAC!
        </Text>

        <Text className="text-gray-600 text-base text-center leading-6 mb-2">
          Hello{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
        </Text>

        <Text className="text-gray-600 text-base text-center leading-6 mb-12">
          We&apos;re excited to have you on board. For your security, would you like to update your password?
        </Text>

        <View className="w-full max-w-sm space-y-4">
          <Pressable
            onPress={handleChangePassword}
            className="rounded-full py-4 items-center bg-[#FF6551]"
            accessibilityRole="button"
          >
            <Text className="text-white font-semibold text-base">
              Yes, Update My Password
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSkipToWelcome}
            className="rounded-full py-4 items-center border border-gray-300"
            accessibilityRole="button"
          >
            <Text className="text-gray-700 font-semibold text-base">
              Skip for Now
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="pb-8">
        <Text className="text-xs text-gray-500 text-center leading-5">
          You can always update your password later in your profile settings.
        </Text>
      </View>
    </View>
  );
};

export default FirstTimePromptScreen;
