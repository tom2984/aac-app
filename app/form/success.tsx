import { useRouter } from 'expo-router';
import { CheckIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

const FormSuccessScreen = () => {
  const router = useRouter();

  const handleDone = () => {
    // Navigate to dashboard - use replace to clear the navigation stack
    router.replace('/dashboard');
  };

  return (
    <View className="flex-1 items-center justify-center bg-[#FF6551] px-4">
      {/* Success Icon */}
      <View className="w-32 h-32 rounded-full bg-white/10 items-center justify-center mb-8">
        <CheckIcon color="white" size={64} />
      </View>
      
      {/* Success Message */}
      <Text className="text-white text-3xl font-bold font-inter text-center mb-2">
        Thanks
      </Text>
      <Text className="text-white text-lg font-inter text-center mb-12">
        your form is submitted
      </Text>
      
      {/* Done Button */}
      <Pressable
        className="bg-white rounded-full px-8 py-4 min-w-[120px] items-center"
        onPress={handleDone}
        accessibilityLabel="Done"
        tabIndex={0}
      >
        <Text className="text-[#272937] font-inter font-semibold text-lg">Done</Text>
      </Pressable>
    </View>
  );
};

export default FormSuccessScreen; 