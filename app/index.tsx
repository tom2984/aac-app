import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ImageBackground, Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Onboarding state
  const [onboardingData, setOnboardingData] = useState<{
    isNewUser: boolean;
    userEmail: string | null;
    userName: string | null;
    userRole: string | null;
  }>({
    isNewUser: false,
    userEmail: null,
    userName: null,
    userRole: null,
  });
  const [onboardingFlow, setOnboardingFlow] = useState<'standard' | 'authenticated_welcome' | 'streamlined_login'>('standard');
  const [hasProcessedOnboarding, setHasProcessedOnboarding] = useState(false);
  
  const { loading: authLoading, session } = useAuth();
  const router = useRouter();

  const handleTogglePassword = () => setShowPassword((prev) => !prev);

  // URL parameter detection and onboarding logic
  useEffect(() => {
    const handleOnboarding = async () => {
      if (hasProcessedOnboarding) return;

      try {
        // Check URL parameters for new user onboarding
        const urlParams = new URLSearchParams(window.location.search);
        const isNewUser = urlParams.get('new_user') === 'true';
        const userEmail = urlParams.get('email');
        const userName = urlParams.get('name');
        const userRole = urlParams.get('role');

        console.log('🔍 Onboarding check:', { isNewUser, userEmail, userName, userRole });

        if (isNewUser) {
          // Update onboarding data
          setOnboardingData({
            isNewUser,
            userEmail,
            userName,
            userRole,
          });

          // Pre-fill email if provided
          if (userEmail) {
            setEmail(userEmail);
          }

          // Check for existing authentication session
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          const isAuthenticated = !!currentSession;

          console.log('🔐 Session check:', { isAuthenticated, userEmail: currentSession?.user?.email });

          // Route users based on their state
          if (isNewUser && isAuthenticated) {
            // BEST CASE: User is already logged in from website
            console.log('✅ New user already authenticated - showing welcome onboarding');
            setOnboardingFlow('authenticated_welcome');
          } else if (isNewUser && !isAuthenticated) {
            // User came from website but session didn't transfer
            console.log('🔑 New user needs to login - showing streamlined login');
            setOnboardingFlow('streamlined_login');
          } else {
            // Regular user (not from onboarding)
            console.log('👤 Regular user - showing standard login');
            setOnboardingFlow('standard');
          }

          // Clean up URL parameters after handling
          const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          console.log('🧹 Cleaned onboarding parameters from URL');
        }

        setHasProcessedOnboarding(true);
      } catch (error) {
        console.error('❌ Error processing onboarding:', error);
        setOnboardingFlow('standard');
        setHasProcessedOnboarding(true);
      }
    };

    handleOnboarding();
  }, [hasProcessedOnboarding]);

  // Handle authenticated welcome flow
  useEffect(() => {
    if (onboardingFlow === 'authenticated_welcome' && session && onboardingData.isNewUser) {
      // User is already authenticated and this is new user onboarding
      // Show a brief welcome and then redirect to dashboard
      Alert.alert(
        `Welcome ${onboardingData.userName || 'to AAC'}!`,
        'Your AAC account is ready. You can now complete forms on your mobile device.',
        [
          {
            text: 'Get Started',
            onPress: () => {
              console.log('✅ New user welcomed, redirecting to dashboard');
              router.replace('/dashboard');
            }
          }
        ]
      );
    }
  }, [onboardingFlow, session, onboardingData, router]);
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in both email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        Alert.alert('Login Error', error.message);
      } else {
        // Navigation will be handled automatically by the auth state change in _layout.tsx
        // Either to dashboard (regular user) or first-time-login flow (new user)
      }
    } catch (error) {
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

  // Render different content based on onboarding flow
  const renderOnboardingContent = () => {
    if (onboardingFlow === 'streamlined_login') {
      return (
        <View className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 opacity-95">
          <Text className="text-center text-2xl font-bold text-gray-900 mb-4">
            Welcome {onboardingData.userName || 'Back'}!
          </Text>
          <Text className="text-center text-gray-600 mb-8">
            Please enter your password to continue to your AAC mobile app.
          </Text>
          <View className="mb-4">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Email</Text>
            <TextInput
              className="border border-gray-200 rounded-lg px-4 py-4 bg-gray-100 text-base text-gray-900 min-h-[52px]"
              value={email}
              editable={false}
              accessibilityLabel="Email (read-only)"
              textAlignVertical="center"
            />
          </View>
          <View className="mb-6">
            <Text className="text-xs text-gray-500 mb-1 ml-1">Password</Text>
            <View className="flex-row items-center border border-gray-200 rounded-lg bg-gray-50 px-4 min-h-[52px]">
              <TextInput
                className="flex-1 py-4 text-base text-gray-900"
                placeholder="Enter your password"
                placeholderTextColor="#A3A3A3"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                textAlignVertical="center"
                autoFocus={true}
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
          <Pressable
            onPress={handleLogin}
            className={`rounded-full py-3 items-center ${(loading || authLoading) ? 'bg-gray-400' : 'bg-[#FF6551]'}`}
            accessibilityRole="button"
            disabled={loading || authLoading}
          >
            <Text className="text-white font-semibold text-base">
              {(loading || authLoading) ? 'Logging in...' : 'Continue to App'}
            </Text>
          </Pressable>
        </View>
      );
    }

    // Standard login form (default)
    return (
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
          className={`rounded-full py-3 items-center ${(loading || authLoading) ? 'bg-gray-400' : 'bg-[#FF6551]'}`}
          accessibilityRole="button"
          disabled={loading || authLoading}
        >
          <Text className="text-white font-semibold text-base">
            {(loading || authLoading)
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
    );
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
      {renderOnboardingContent()}
    </ImageBackground>
  );
};

export default LoginScreen; 