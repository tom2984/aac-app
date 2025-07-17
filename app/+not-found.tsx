import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import FormDebugger from '../components/FormDebugger';
import { supabase, testSupabaseConnection } from '../lib/supabase';

export default function HomeScreen() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [userStatus, setUserStatus] = useState('Checking...');
  const [activeTab, setActiveTab] = useState<'connection' | 'forms'>('connection');

  useEffect(() => {
    testConnection();
    checkUser();
  }, []);

  const testConnection = async () => {
    setConnectionStatus('🔄 Testing...');
    
    const result = await testSupabaseConnection();
    
    if (result.success) {
      setConnectionStatus('✅ Connected successfully!');
    } else {
      setConnectionStatus(`❌ Failed: ${result.error}`);
    }
  };

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user);
      
      if (user) {
        setUserStatus(`✅ Logged in as: ${user.email}`);
      } else {
        setUserStatus('❌ No user logged in');
      }
    } catch (error) {
      console.error('👤 User check failed:', error);
      setUserStatus(`💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTestAuth = async () => {
    try {
      console.log('🔐 Testing authentication...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123',
      });
      
      console.log('🔐 Auth test result:', { data, error });
      
      if (error) {
        console.log('Expected error for test credentials:', error.message);
      }
    } catch (error) {
      console.error('🔐 Auth test failed:', error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="flex-1 p-8">
        <Text className="text-2xl font-bold text-gray-900 mb-8 text-center">
          🔍 Debug Dashboard
        </Text>
        
        {/* Tab Selector */}
        <View className="flex-row bg-white rounded-lg p-1 mb-6 shadow-sm">
          <Pressable
            onPress={() => setActiveTab('connection')}
            className={`flex-1 py-3 px-4 rounded-lg items-center ${
              activeTab === 'connection' ? 'bg-blue-500' : 'bg-transparent'
            }`}
          >
            <Text className={`font-semibold ${
              activeTab === 'connection' ? 'text-white' : 'text-gray-600'
            }`}>
              Connection Test
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => setActiveTab('forms')}
            className={`flex-1 py-3 px-4 rounded-lg items-center ${
              activeTab === 'forms' ? 'bg-blue-500' : 'bg-transparent'
            }`}
          >
            <Text className={`font-semibold ${
              activeTab === 'forms' ? 'text-white' : 'text-gray-600'
            }`}>
              Form Debugging
            </Text>
          </Pressable>
        </View>

        {activeTab === 'connection' ? (
          <View className="bg-white rounded-lg p-6 shadow-lg">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Connection Status:
            </Text>
            <Text className="text-base text-gray-600 mb-4">
              {connectionStatus}
            </Text>
            
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              User Status:
            </Text>
            <Text className="text-base text-gray-600 mb-4">
              {userStatus}
            </Text>
            
            <Pressable
              onPress={handleTestAuth}
              className="bg-[#FF6551] rounded-lg py-3 items-center mb-2"
              accessibilityRole="button"
            >
              <Text className="text-white font-semibold">Test Auth Flow</Text>
            </Pressable>
            
            <Pressable
              onPress={() => {
                testConnection();
                checkUser();
              }}
              className="bg-gray-500 rounded-lg py-3 items-center"
              accessibilityRole="button"
            >
              <Text className="text-white font-semibold">Refresh Tests</Text>
            </Pressable>
            
            <Text className="text-sm text-gray-500 text-center mt-4">
              Check the console for detailed logs
            </Text>
          </View>
        ) : (
          <FormDebugger />
        )}
      </View>
    </ScrollView>
  );
}
