import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

const WelcomeScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { user, markFirstTimeLoginComplete } = useAuth();
  const router = useRouter();

  const onboardingSteps = [
    {
      title: "Welcome to AAC!",
      description: "We're excited to have you on board. Let's quickly show you around the app and help you get started.",
      image: require('../../assets/images/AAC-Logo.png'),
      imageStyle: { width: 120, height: 120 }
    },
    {
      title: "Dashboard Overview",
      description: "Your dashboard shows all assigned forms, upcoming deadlines, and important notifications in one place.",
      image: require('../../assets/images/AAC-Logo.png'), // You can replace with dashboard screenshot
      imageStyle: { width: 160, height: 120 }
    },
    {
      title: "Fill Forms Easily",
      description: "Complete assigned forms at your own pace. Your progress is automatically saved, so you can continue anytime.",
      image: require('../../assets/images/AAC-Logo.png'), // You can replace with form screenshot
      imageStyle: { width: 160, height: 120 }
    },
    {
      title: "Stay Connected",
      description: "View your teammates' progress and collaborate effectively. Get notifications for important updates.",
      image: require('../../assets/images/AAC-Logo.png'), // You can replace with team screenshot
      imageStyle: { width: 160, height: 120 }
    }
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    await markFirstTimeLoginComplete();
    router.replace('/dashboard');
  };

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 px-6 pt-16">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-lg font-semibold text-gray-900">
              Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
            </Text>
            {!isLastStep && (
              <Pressable
                onPress={handleSkip}
                className="px-4 py-2"
                accessibilityRole="button"
              >
                <Text className="text-gray-500 font-medium">Skip</Text>
              </Pressable>
            )}
          </View>

          {/* Progress Indicators */}
          <View className="flex-row justify-center mb-12">
            {onboardingSteps.map((_, index) => (
              <View
                key={index}
                className={`h-2 w-8 mx-1 rounded-full ${
                  index <= currentStep ? 'bg-[#FF6551]' : 'bg-gray-200'
                }`}
              />
            ))}
          </View>

          {/* Main Content */}
          <View className="flex-1 items-center justify-center px-4">
            <Image
              source={currentStepData.image}
              style={currentStepData.imageStyle}
              className="mb-8"
              resizeMode="contain"
              accessibilityLabel={`${currentStepData.title} illustration`}
            />

            <Text className="text-2xl font-bold text-gray-900 text-center mb-4">
              {currentStepData.title}
            </Text>

            <Text className="text-gray-600 text-base text-center leading-6 mb-12">
              {currentStepData.description}
            </Text>
          </View>

          {/* Navigation Buttons */}
          <View className="pb-8 px-4">
            <Pressable
              onPress={handleNext}
              className="rounded-full py-4 items-center bg-[#FF6551] mb-4"
              accessibilityRole="button"
            >
              <Text className="text-white font-semibold text-base">
                {isLastStep ? 'Get Started' : 'Next'}
              </Text>
            </Pressable>

            {!isLastStep && (
              <View className="flex-row justify-center items-center space-x-4">
                {currentStep > 0 && (
                  <Pressable
                    onPress={() => setCurrentStep(currentStep - 1)}
                    className="px-6 py-2"
                    accessibilityRole="button"
                  >
                    <Text className="text-gray-500 font-medium">Back</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default WelcomeScreen;
