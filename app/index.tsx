import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ImageBackground, Pressable, Text, TextInput, View } from 'react-native';
import { supabase, testSupabaseConnection } from '../lib/supabase';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const handleTogglePassword = () => setShowPassword((prev) => !prev);
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in both email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Attempting login with:', email);
      
      // First test basic connectivity
      console.log('🔍 Testing connectivity before login...');
      const connectionTest = await testSupabaseConnection();
      
      if (!connectionTest.success) {
        console.error('❌ Connection test failed:', connectionTest.error);
        Alert.alert(
          'Connection Error',
          `Unable to connect to authentication service: ${connectionTest.error}`
        );
        return;
      }
      
      console.log('✅ Connection test passed, proceeding with login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      console.log('📊 Login result:', { data, error });

      if (error) {
        console.error('❌ Login error:', error);
        Alert.alert('Login Error', error.message);
      } else {
        console.log('✅ Login successful');
        // Login successful, navigate to dashboard
    router.replace('/dashboard');
      }
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in both email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Attempting signup with:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      console.log('📊 Signup result:', { data, error });

      if (error) {
        console.error('❌ Signup error:', error);
        Alert.alert('Signup Error', error.message);
      } else {
        console.log('✅ Signup successful');
        Alert.alert(
          'Success', 
          'Account created successfully! Please check your email for verification.',
          [
            { 
              text: 'OK', 
              onPress: () => setIsSignUp(false) // Switch back to login
            }
          ]
        );
      }
    } catch (error) {
      console.error('💥 Unexpected signup error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Success', 'Password reset instructions have been sent to your email');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/images/Background.png')}
      resizeMode="cover"
      className="flex-1 justify-center items-center px-4"
      accessibilityLabel="Background image"
    >
      <Image
        source={require('../assets/images/AAC-Logo.png')}
        className="mb-8"
        style={{ width: 96, height: 96, resizeMode: 'contain' }}
        accessibilityLabel="AAC Logo"
      />
      <View className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 opacity-95">
        <Text className="text-center text-2xl font-bold text-gray-900 mb-8">
          {isSignUp ? 'Create Account' : 'Log In'}
        </Text>
        <View className="mb-4">
          <Text className="text-xs text-gray-500 mb-1 ml-1">Email</Text>
          <TextInput
            className="border border-gray-200 rounded-lg px-4 py-4 bg-gray-50 text-base text-gray-900 min-h-[52px]"
            placeholder="John234@gmail.com"
            placeholderTextColor="#A3A3A3"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Email"
            returnKeyType="next"
            textAlignVertical="center"
          />
        </View>
        <View className="mb-2">
          <Text className="text-xs text-gray-500 mb-1 ml-1">Password</Text>
          <View className="flex-row items-center border border-gray-200 rounded-lg bg-gray-50 px-4 min-h-[52px]">
            <TextInput
              className="flex-1 py-4 text-base text-gray-900"
              placeholder="Password"
              placeholderTextColor="#A3A3A3"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              textAlignVertical="center"
            />
            <Pressable
              onPress={handleTogglePassword}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              className="ml-2 p-1"
            >
              <Text className="text-xs text-gray-400">{showPassword ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>
        </View>
        {!isSignUp && (
        <Pressable
          onPress={handleForgotPassword}
          className="mb-6 mt-1"
          accessibilityRole="button"
        >
          <Text className="text-[#FF6551] text-xs ml-1">Forgot password</Text>
        </Pressable>
        )}
        {isSignUp && <View className="mb-6 mt-1" />}
        <Pressable
          onPress={isSignUp ? handleSignUp : handleLogin}
          className={`rounded-full py-3 items-center ${loading ? 'bg-gray-400' : 'bg-[#FF6551]'}`}
          accessibilityRole="button"
          disabled={loading}
        >
          <Text className="text-white font-semibold text-base">
            {loading 
              ? (isSignUp ? 'Creating Account...' : 'Logging in...') 
              : (isSignUp ? 'Create Account' : 'Log In')
            }
          </Text>
        </Pressable>
        
        {/* Toggle between Login and Signup */}
        <View className="mt-4 flex-row justify-center">
          <Text className="text-gray-600 text-sm">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          </Text>
          <Pressable
            onPress={() => setIsSignUp(!isSignUp)}
            accessibilityRole="button"
          >
            <Text className="text-[#FF6551] text-sm font-semibold">
              {isSignUp ? 'Log In' : 'Sign Up'}
            </Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
};

export default LoginScreen; 