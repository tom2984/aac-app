import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

const ChangePasswordScreen = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { changePassword } = useAuth();
  const router = useRouter();

  const handleSkip = () => {
    // Skip password change and go to welcome
    router.push('/first-time-login/welcome');
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      const { error } = await changePassword(currentPassword, newPassword);
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Success', 
          'Password updated successfully!',
          [
            { 
              text: 'Continue', 
              onPress: () => router.push('/first-time-login/welcome')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const PasswordField = ({ 
    label, 
    placeholder, 
    value, 
    onChangeText, 
    showPassword, 
    onToggleShow 
  }: {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    showPassword: boolean;
    onToggleShow: () => void;
  }) => (
    <View className="mb-4">
      <Text className="text-xs text-gray-500 mb-1 ml-1">{label}</Text>
      <View className="flex-row items-center border border-gray-200 rounded-lg bg-gray-50 px-4 min-h-[52px]">
        <TextInput
          className="flex-1 py-4 text-base text-gray-900"
          placeholder={placeholder}
          placeholderTextColor="#A3A3A3"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          textAlignVertical="center"
        />
        <Pressable
          onPress={onToggleShow}
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          className="ml-2 p-1"
        >
          <Text className="text-xs text-gray-400">{showPassword ? 'Hide' : 'Show'}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <View className="mb-8">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Update Your Password
        </Text>
        <Text className="text-gray-600 text-base leading-6">
          For your security, we recommend updating your password. This step is optional and you can skip it if you prefer.
        </Text>
      </View>

      <View className="flex-1">
        <PasswordField
          label="Current Password"
          placeholder="Enter current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          showPassword={showCurrentPassword}
          onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
        />

        <PasswordField
          label="New Password"
          placeholder="Enter new password (min 6 characters)"
          value={newPassword}
          onChangeText={setNewPassword}
          showPassword={showNewPassword}
          onToggleShow={() => setShowNewPassword(!showNewPassword)}
        />

        <PasswordField
          label="Confirm New Password"
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          showPassword={showConfirmPassword}
          onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
        />

        <View className="mt-6 space-y-3">
          <Pressable
            onPress={handleChangePassword}
            className={`rounded-full py-4 items-center ${
              loading || !currentPassword || !newPassword || !confirmPassword
                ? 'bg-gray-300' 
                : 'bg-[#FF6551]'
            }`}
            accessibilityRole="button"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Update Password
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleSkip}
            className="rounded-full py-4 items-center border border-gray-300"
            accessibilityRole="button"
            disabled={loading}
          >
            <Text className="text-gray-700 font-semibold text-base">
              Skip for Now
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="pb-8">
        <Text className="text-xs text-gray-500 text-center leading-5">
          Your password should be at least 6 characters long and include a mix of letters, numbers, and symbols for better security.
        </Text>
      </View>
    </View>
  );
};

export default ChangePasswordScreen;
