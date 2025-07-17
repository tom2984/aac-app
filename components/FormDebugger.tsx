import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
    debugFormIssues,
    debugRLSPermissions,
    diagnoseAssignmentMismatch,
    fixAssignmentMismatch,
    generateFixSQL,
    verifyAssignmentFix
} from '../lib/supabase';

const FormDebugger = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRLSDebug = async () => {
    setLoading(true);
    try {
      await debugRLSPermissions();
      Alert.alert('Debug Complete', 'Check console logs for RLS permissions analysis');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to run RLS debug');
    } finally {
      setLoading(false);
    }
  };

  const handleFormDebug = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Error', 'Please enter a form title to search for');
      return;
    }

    setLoading(true);
    try {
      await debugFormIssues(searchTerm.trim());
      Alert.alert('Debug Complete', 'Check console logs for detailed form analysis');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to run form debug');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentMismatchDiagnosis = async () => {
    if (!searchTerm.trim()) {
      Alert.alert('Error', 'Please enter "Vercel test" or another form title to diagnose');
      return;
    }

    setLoading(true);
    try {
      // For the specific form we know has issues
      const formId = '1bfceba0-0ae4-4409-8442-984e798dc691'; // Vercel test form
      const result = await diagnoseAssignmentMismatch(formId);
      
      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else {
        const { metadataUsers, assignmentUsers, missingAssignments } = result;
        Alert.alert(
          'Assignment Mismatch Diagnosis',
          `Metadata shows: ${metadataUsers?.length || 0} users\n` +
          `Actual assignments: ${assignmentUsers?.length || 0} users\n` +
          `Missing assignments: ${missingAssignments?.length || 0} users\n\n` +
          'Check console for detailed breakdown'
        );
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to diagnose');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFix = async () => {
    setLoading(true);
    try {
      const formId = '1bfceba0-0ae4-4409-8442-984e798dc691'; // Vercel test form
      const result = await verifyAssignmentFix(formId);
      
      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else {
        const { fixWorked, stillMissing, assignmentUsers, metadataUsers } = result;
        
        if (fixWorked) {
          Alert.alert(
            'Fix Verification ✅',
            `SUCCESS! All assignments synchronized.\n\n` +
            `Metadata users: ${metadataUsers?.length || 0}\n` +
            `Assignment records: ${assignmentUsers?.length || 0}\n\n` +
            'Check console for teammates test results.'
          );
        } else {
          Alert.alert(
            'Fix Verification ❌',
            `Fix incomplete. Still missing ${stillMissing?.length || 0} assignments.\n\n` +
            `Metadata: ${metadataUsers?.length || 0} users\n` +
            `Records: ${assignmentUsers?.length || 0} users\n\n` +
            'Check console for details.'
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to verify fix');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFixSQL = async () => {
    setLoading(true);
    try {
      const formId = '1bfceba0-0ae4-4409-8442-984e798dc691'; // Vercel test form
      const result = await generateFixSQL(formId);
      
      if (result.error) {
        Alert.alert('Error', result.error);
      } else if (!result.sql) {
        Alert.alert('No Fix Needed', result.message || 'No missing assignments found');
      } else {
        console.log('🔧 GENERATED FIX SQL:');
        console.log(result.sql);
        Alert.alert(
          'Fix SQL Generated',
          `Generated SQL to fix ${result.missingUsers?.length || 0} missing assignments.\n\n` +
          'Check console for the SQL statements to run in Supabase dashboard.'
        );
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate SQL');
    } finally {
      setLoading(false);
    }
  };

  const handleFixAssignmentMismatch = async () => {
    Alert.alert(
      'Generate Fix Instructions',
      'This will generate detailed instructions and SQL for manual fixing. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setLoading(true);
            try {
              const formId = '1bfceba0-0ae4-4409-8442-984e798dc691'; // Vercel test form
              const adminUserId = 'a77190ee-2ce8-4c46-9e5a-89849e19be29'; // Tom Admin ID
              
              const result = await fixAssignmentMismatch(formId, adminUserId);
              
              if (result.error) {
                Alert.alert('Error', result.error.message);
              } else if ('needsManualFix' in result && result.needsManualFix) {
                console.log('📋 MANUAL FIX INSTRUCTIONS:', (result as any).fixReport);
                Alert.alert(
                  'Manual Fix Required',
                  `Found ${result.missingAssignments?.length || 0} missing assignments.\n\n` +
                  'Check console for detailed fix instructions and SQL statements.'
                );
              } else {
                Alert.alert(
                  'No Action Needed',
                  'No missing assignments found to fix.'
                );
              }
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate fix');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="bg-white rounded-lg p-4 mb-4">
        <Text className="text-lg font-bold text-gray-900 mb-4">🔍 AAC App Debugger</Text>
        
        <TextInput
          className="border border-gray-300 rounded px-3 py-2 mb-4"
          placeholder="Enter form title (e.g., 'Vercel test')"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />

        <View className="space-y-3">
          <Pressable
            onPress={handleRLSDebug}
            disabled={loading}
            className="bg-blue-500 px-4 py-3 rounded"
          >
            <Text className="text-white text-center font-medium">
              {loading ? 'Running...' : '🔐 Test RLS Permissions'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleFormDebug}
            disabled={loading || !searchTerm.trim()}
            className={`px-4 py-3 rounded ${
              !searchTerm.trim() ? 'bg-gray-300' : 'bg-green-500'
            }`}
          >
            <Text className="text-white text-center font-medium">
              {loading ? 'Running...' : '📋 Debug Form Issues'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleAssignmentMismatchDiagnosis}
            disabled={loading}
            className="bg-orange-500 px-4 py-3 rounded"
          >
            <Text className="text-white text-center font-medium">
              {loading ? 'Running...' : '🩺 Diagnose Assignment Mismatch'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleVerifyFix}
            disabled={loading}
            className="bg-teal-500 px-4 py-3 rounded"
          >
            <Text className="text-white text-center font-medium">
              {loading ? 'Running...' : '✅ Verify Fix Applied'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleGenerateFixSQL}
            disabled={loading}
            className="bg-purple-500 px-4 py-3 rounded"
          >
            <Text className="text-white text-center font-medium">
              {loading ? 'Running...' : '🔧 Generate Fix SQL'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleFixAssignmentMismatch}
            disabled={loading}
            className="bg-red-500 px-4 py-3 rounded"
          >
            <Text className="text-white text-center font-medium">
              {loading ? 'Running...' : '📋 Generate Fix Instructions'}
            </Text>
          </Pressable>
        </View>

        <View className="mt-6 p-3 bg-yellow-50 rounded border border-yellow-200">
          <Text className="text-sm text-yellow-800 font-medium mb-2">📝 Debug Instructions:</Text>
          <Text className="text-sm text-yellow-700">
            1. Test RLS Permissions first{'\n'}
            2. Enter "Vercel test" and run Form Debug{'\n'}
            3. Run Assignment Mismatch Diagnosis{'\n'}
            4. If SQL was applied, run Verify Fix{'\n'}
            5. Check console logs for detailed output
          </Text>
        </View>

        <View className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <Text className="text-sm text-blue-800 font-medium mb-2">🔧 Manual Fix Process:</Text>
          <Text className="text-sm text-blue-700">
            The generated SQL can be run in:{'\n'}
            • Supabase Dashboard → SQL Editor{'\n'}
            • Direct database connection{'\n'}
            • Admin interface with elevated privileges
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default FormDebugger; 