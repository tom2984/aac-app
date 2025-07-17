import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeftIcon, PlusIcon, UserIcon, XIcon } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Modal, Pressable, ScrollView, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { calculateTimeRemaining, fetchFormResponse, fetchFormTeammates, formatDate, getCurrentUser, supabase, type AssignedForm, type FormQuestion, type FormTeammate } from '../../lib/supabase';

// Module-level storage for form answers
const formAnswersStorage = new Map<string, string>();

// Extended question types to match the 5 types shown in the design
type ExtendedQuestionType = 'short_text' | 'long_text' | 'single_select' | 'multiple_select' | 'composite';

// Function to map database question types to our extended types
const mapQuestionType = (dbType: string, options: any): ExtendedQuestionType => {
  switch (dbType) {
    case 'text':
      return 'short_text';
    case 'boolean':
      return 'single_select';
    case 'rating':
      return 'single_select';
    case 'multiple_choice':
      return Array.isArray(options) && options.length > 1 ? 'multiple_select' : 'single_select';
    case 'date':
      return 'short_text';
    case 'composite':
      return 'composite';
    default:
      return 'short_text';
  }
};

// Check if a question type should be treated as having text in options
const hasTextOptions = (question: FormQuestion): boolean => {
  return !!(question.options && Array.isArray(question.options) && question.options.length > 0);
};

interface FormDetailsData {
  assignment: AssignedForm;
  questions: FormQuestion[];
}

interface FormAnswer {
  questionId: string;
  answer: any;
}

interface FormResponseData {
  response: any;
  answers: any[];
}

const FormDetailsScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [formData, setFormData] = useState<FormDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [formResponseData, setFormResponseData] = useState<FormResponseData | null>(null);
  
  // Teammate selection state
  const [showTeammateModal, setShowTeammateModal] = useState(false);
  const [teammates, setTeammates] = useState<FormTeammate[]>([]);
  const [selectedTeammates, setSelectedTeammates] = useState<string[]>([]);
  const [teammatesLoading, setTeammatesLoading] = useState(true);
  const [teammatesError, setTeammatesError] = useState<string | null>(null);

  // Fetch form details
  useEffect(() => {
    const fetchFormDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);

        // Fetch form assignment with form details
        const { data: assignment, error: assignmentError } = await supabase
          .from('form_assignments')
          .select(`
            *,
            forms (
              *,
              form_questions (*)
            )
          `)
          .eq('id', id)
          .single();

        if (assignmentError) {
          throw new Error(assignmentError.message);
        }

        if (!assignment) {
          throw new Error('Form not found');
        }

        // Check if form is completed
        const isCompleted = assignment.status === 'completed';
        setIsReadOnly(isCompleted);

        // Fetch creator profile (who created the form)
        console.log('👤 Fetching creator profile for ID:', assignment.forms.created_by);
        console.log('🔍 Full form data:', assignment.forms);
        
        let creator = null;
        if (assignment.forms.created_by) {
          const { data: creatorData, error: creatorError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .eq('id', assignment.forms.created_by)
            .single();

          if (creatorError) {
            console.warn('❌ Could not fetch creator profile:', creatorError);
            console.log('🔍 Trying to find creator in all profiles...');
            // Fallback: try to find any profile with this ID
            const { data: allProfiles } = await supabase
              .from('profiles')
              .select('*');
            console.log('🔍 All profiles:', allProfiles);
          } else {
            console.log('✅ Creator profile found:', creatorData);
            creator = creatorData;
          }
        } else {
          console.warn('⚠️ No created_by field in form data');
        }

        const formDetails: FormDetailsData = {
          assignment: {
            ...assignment,
            profiles: creator || null
          } as AssignedForm,
          questions: assignment.forms?.form_questions || []
        };

        setFormData(formDetails);

        // Debug form questions
        console.log('📋 Form questions debug:', formDetails.questions.map(q => ({
          id: q.id,
          type: q.question_type,
          text: q.question_text.substring(0, 50) + '...',
          hasSubQuestions: !!q.sub_questions,
          mappedType: mapQuestionType(q.question_type, q.options)
        })));

        // If form is completed, fetch the submitted response
        if (isCompleted && assignment.forms) {
          const { data: responseData, error: responseError } = await fetchFormResponse(
            assignment.forms.id,
            assignment.employee_id
          );

          if (responseError) {
            console.warn('Could not fetch form response:', responseError);
          } else if (responseData) {
            setFormResponseData(responseData);
            
            // Pre-fill answers from the response
            const existingAnswers = responseData.answers.map((answer: any) => ({
              questionId: answer.question_id,
              answer: answer.answer
            }));
            // setAnswers(existingAnswers); // This line is removed
          }
        }

        // Fetch current user for teammate functionality
        const { user: currentUserData } = await getCurrentUser();

        // Fetch teammates if form is not completed (only for active forms)
        if (!isCompleted && assignment.forms && currentUserData) {
          try {
            setTeammatesLoading(true);
            setTeammatesError(null);
            console.log('🔍 Attempting to fetch teammates for form:', assignment.forms.id, 'user:', currentUserData.id);
            const { data: teammatesData, error: teammatesError } = await fetchFormTeammates(
              assignment.forms.id,
              currentUserData.id
            );

            if (teammatesError) {
              console.error('❌ Error fetching teammates:', teammatesError);
              console.error('❌ Teammates error details:', {
                message: teammatesError.message,
                details: 'details' in teammatesError ? teammatesError.details : undefined,
                hint: 'hint' in teammatesError ? teammatesError.hint : undefined,
                code: 'code' in teammatesError ? teammatesError.code : undefined
              });
              setTeammatesError(teammatesError.message || 'Failed to load teammates');
              // Don't throw here, just log and continue without teammates
            } else if (teammatesData) {
              setTeammates(teammatesData);
              console.log('✅ Teammates loaded successfully:', teammatesData.length);
            } else {
              console.log('ℹ️ No teammates found for this form');
              setTeammates([]);
            }
          } catch (err) {
            console.error('💥 Unexpected error during teammate fetch:', err);
            setTeammatesError('Unexpected error loading teammates');
            // Continue without teammates functionality
          } finally {
            setTeammatesLoading(false);
          }
        } else {
          // Not fetching teammates (completed form or missing data)
          setTeammatesLoading(false);
          console.log('ℹ️ Not fetching teammates:', { isCompleted, hasForm: !!assignment.forms, hasUser: !!currentUserData });
        }

        console.log('✅ Form details loaded:', formDetails);
      } catch (error) {
        console.error('❌ Error fetching form details:', error);
        setError(error instanceof Error ? error.message : 'Failed to load form');
      } finally {
        setLoading(false);
      }
    };

    fetchFormDetails();
  }, [id]);

  // Simple no-op handler for non-text inputs (they manage their own state)
  const handleAnswerChange = useCallback(() => {
    // No-op - text inputs manage their own state via formAnswersStorage
  }, []);

  const handleSubmit = async () => {
    if (!formData || isReadOnly) return;

    try {
      setSubmitting(true);
      console.log('🚀 Starting form submission...');
      
      // Collect answers from storage
      const collectedAnswers: FormAnswer[] = [];
      formData.questions.forEach(question => {
        const answer = formAnswersStorage.get(question.id);
        if (answer) {
          collectedAnswers.push({ questionId: question.id, answer });
        }
      });
      
      console.log('📝 Collected answers from storage:', collectedAnswers);
      console.log('👥 Selected teammates:', selectedTeammates);
      
      // Validate required questions
      const requiredQuestions = formData.questions.filter(q => q.is_required);
      console.log('🔍 Required questions:', requiredQuestions.map(q => ({ id: q.id, text: q.question_text })));
      
      const unansweredRequired = requiredQuestions.filter(q => {
        const answer = collectedAnswers.find(a => a.questionId === q.id);
        const hasAnswer = answer && answer.answer !== null && answer.answer !== undefined && answer.answer !== '';
        console.log(`❓ Question "${q.question_text}" (${q.id}): ${hasAnswer ? 'answered' : 'missing'}`);
        return !hasAnswer;
      });

      if (unansweredRequired.length > 0) {
        console.log('❌ Missing required answers:', unansweredRequired.map(q => q.question_text));
        Alert.alert('Missing Required Answers', 'Please answer all required questions before submitting.');
        return;
      }

      console.log('✅ All required questions answered');

      // Get all respondents (current user + selected teammates)
      const allRespondents = [
        formData.assignment.employee_id, // Current user
        ...selectedTeammates // Selected teammates
      ];

      console.log('🎯 Submitting for respondents:', allRespondents);

      // Create form responses for all respondents
      const responseInserts = allRespondents.map(respondentId => ({
        form_id: formData.assignment.form_id,
        respondent_id: respondentId,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      }));

      console.log('📊 Creating form responses...');
      
      // Try to create form responses with better error handling
      const { data: responses, error: responseError } = await supabase
        .from('form_responses')
        .insert(responseInserts)
        .select('*');

      if (responseError) {
        console.error('❌ Error creating form responses:', responseError);
        console.error('❌ Full error details:', {
          code: responseError.code,
          message: responseError.message,
          details: responseError.details,
          hint: responseError.hint
        });
        
        // Provide more specific error message
        if (responseError.message.includes('notifications')) {
          throw new Error('Database configuration issue with notifications. Please contact administrator.');
        } else if (responseError.code === '42501') {
          throw new Error('Permission denied. Please check your access rights.');
        } else {
          throw new Error(responseError.message);
        }
      }

      console.log('✅ Form responses created:', responses?.length);

      // Create answer entries for each response
      const allAnswerInserts = responses?.flatMap((response: any) => 
        collectedAnswers.map(answer => ({
          response_id: response.id,
          question_id: answer.questionId,
          answer: answer.answer
        }))
      ) || [];

      console.log('💾 Saving answers for all respondents...');
      console.log('📤 Total answer inserts:', allAnswerInserts.length);

      const { error: answersError } = await supabase
        .from('form_response_answers')
        .insert(allAnswerInserts);

      if (answersError) {
        console.error('❌ Error saving answers:', answersError);
        throw new Error(answersError.message);
      }

      console.log('✅ Answers saved successfully for all respondents');

      // Update assignment status for all respondents
      console.log('🔄 Updating assignment status for all respondents...');
      
      // Get all assignment IDs for the selected respondents
      const assignmentIds = [formData.assignment.id]; // Current user's assignment

      // Find assignment IDs for selected teammates
      const teammateAssignmentIds = selectedTeammates.map(teammateId => {
        const teammate = teammates.find(t => t.userId === teammateId);
        if (!teammate) {
          console.warn(`⚠️ Could not find teammate data for user: ${teammateId}`);
          return null;
        }
        if (!teammate.assignmentId) {
          console.warn(`⚠️ Teammate ${teammateId} has no assignment ID`);
          return null;
        }
        console.log(`✅ Found assignment ID for teammate ${teammateId}: ${teammate.assignmentId}`);
        return teammate.assignmentId;
      }).filter(Boolean);

      const allAssignmentIds = [...assignmentIds, ...teammateAssignmentIds];

      console.log('📝 Current user assignment ID:', formData.assignment.id);
      console.log('📝 Teammate assignment IDs:', teammateAssignmentIds);
      console.log('📝 All assignment IDs to update:', allAssignmentIds);

      if (teammateAssignmentIds.length !== selectedTeammates.length) {
        console.warn(`⚠️ Warning: Expected ${selectedTeammates.length} teammate assignments, but found ${teammateAssignmentIds.length}`);
      }

      const { error: updateError } = await supabase
        .from('form_assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .in('id', allAssignmentIds);

      if (updateError) {
        console.error('❌ Error updating assignments:', updateError);
        throw new Error(updateError.message);
      }

      console.log('✅ All assignments updated to completed');
      console.log('🎉 Form submission successful for all respondents!');

      // Navigate to success screen
      router.push('/form/success');

    } catch (error) {
      console.error('💥 Error submitting form:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscard = () => {
    if (isReadOnly) {
      router.back();
      return;
    }

    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  // Teammate selection handlers
  const handleTeammateToggle = (userId: string) => {
    setSelectedTeammates(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleOpenTeammateModal = () => {
    setShowTeammateModal(true);
  };

  const handleCloseTeammateModal = () => {
    setShowTeammateModal(false);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#FF6551" />
        <Text className="mt-4 text-gray-600 font-inter">Loading form...</Text>
      </View>
    );
  }

  if (error || !formData) {
    return (
      <View className="flex-1 justify-center items-center px-4 bg-gray-50">
        <Text className="text-red-500 font-inter text-lg mb-4 text-center">
          {error || 'Form not found'}
        </Text>
        <Pressable
          className="bg-[#FF6551] px-6 py-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white font-inter font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const { assignment, questions } = formData;
  const form = assignment.forms;
  const creator = assignment.profiles;

  return (
    <View className="flex-1 bg-gray-50">
        {/* Header */}
      <View className="bg-[#FF6551] px-4 pt-16 pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-8 h-8 items-center justify-center"
          >
            <ArrowLeftIcon size={24} color="white" />
          </Pressable>
          <Text className="text-white font-inter text-base font-medium">
            {isReadOnly ? 'Completed' : calculateTimeRemaining(assignment.due_date)}
          </Text>
          <View className="w-8 h-8" />
        </View>
        
        <View>
          <Text className="text-white font-inter text-2xl font-bold mb-2">
            {form.title}
          </Text>
          {form.description && (
            <Text className="text-white/90 font-inter text-base">
              {form.description}
            </Text>
          )}
          {isReadOnly && (
            <Text className="text-white/80 font-inter text-sm mt-2">
              ✓ This form has been submitted
            </Text>
          )}
        </View>
      </View>

      {/* Form Info */}
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text className="text-gray-500 font-inter text-sm mb-1">Created by</Text>
            <Text className="text-gray-900 font-inter text-lg font-semibold">
              {creator 
                ? `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || creator.email
                : 'Unknown'
              }
            </Text>
          </View>
          
          <View className="items-end">
            <Text className="text-gray-500 font-inter text-sm mb-1">
              {isReadOnly ? 'Submitted' : 'Last Update'}
            </Text>
            <Text className="text-gray-900 font-inter text-lg font-semibold">
              {isReadOnly && formResponseData?.response?.submitted_at
                ? formatDate(formResponseData.response.submitted_at)
                : formatDate(assignment.updated_at)
              }
            </Text>
          </View>
        </View>
      </View>

      {/* Teammate Selection */}
      {!isReadOnly && (
        <View className="bg-white px-4 py-4 border-b border-gray-100">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-500 font-inter text-sm">Filled out by teammates</Text>
            
            {teammatesLoading ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#FF6551" />
                <Text className="text-gray-500 font-inter text-xs ml-2">Loading teammates...</Text>
              </View>
            ) : teammatesError ? (
              <Text className="text-red-500 font-inter text-xs">Failed to load teammates</Text>
            ) : teammates.length === 0 ? (
              <Text className="text-gray-400 font-inter text-xs">No other teammates assigned</Text>
            ) : (
              <Pressable
                onPress={handleOpenTeammateModal}
                className="bg-[#FF6551] px-4 py-2 rounded-full flex-row items-center"
              >
                <PlusIcon size={16} color="white" />
                <Text className="text-white font-inter text-sm ml-2">Add Teammate</Text>
              </Pressable>
            )}
          </View>
          
          {/* Show error details if there's an error */}
          {teammatesError && (
            <View className="bg-red-50 p-3 rounded-lg mb-3">
              <Text className="text-red-700 font-inter text-sm">{teammatesError}</Text>
              <Text className="text-red-600 font-inter text-xs mt-1">
                Check console for detailed error information
              </Text>
            </View>
          )}
          
          {selectedTeammates.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {selectedTeammates.map(userId => {
                const teammate = teammates.find(t => t.userId === userId);
                const profile = teammate?.profile;
                const name = profile 
                  ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
                  : 'Unknown';
                
                return (
                  <View key={userId} className="bg-gray-100 px-3 py-1 rounded-full flex-row items-center">
                    <UserIcon size={12} color="#6B7280" />
                    <Text className="text-gray-700 font-inter text-sm ml-1">{name}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Teammate Selection Modal */}
      <Modal
        visible={showTeammateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseTeammateModal}
      >
        <TouchableWithoutFeedback onPress={handleCloseTeammateModal}>
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View className="bg-white rounded-t-2xl p-6 max-h-80">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-gray-900 font-inter text-lg font-semibold">
                    Filled out by teammates
                  </Text>
                  <Pressable onPress={handleCloseTeammateModal}>
                    <XIcon size={24} color="#6B7280" />
                  </Pressable>
                </View>
                
                <Text className="text-gray-600 font-inter text-sm mb-4">
                  {teammates.length} teammate{teammates.length === 1 ? '' : 's'} {teammates.length === 1 ? 'has' : 'have'} been assigned to this form
                </Text>

                <ScrollView className="max-h-64">
                  {teammates.map(teammate => {
                    const profile = teammate.profile;
                    const name = profile 
                      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
                      : 'Unknown';
                    const isSelected = selectedTeammates.includes(teammate.userId);
                    
                    return (
                      <Pressable
                        key={teammate.userId}
                        onPress={() => handleTeammateToggle(teammate.userId)}
                        className="flex-row items-center py-3 border-b border-gray-100"
                      >
                        <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                          <UserIcon size={20} color="#6B7280" />
                        </View>
                        
                        <View className="flex-1">
                          <Text className="text-gray-900 font-inter text-base font-medium">
                            {name}
                          </Text>
                          {profile?.email && (
                            <Text className="text-gray-500 font-inter text-sm">
                              {profile.email}
                            </Text>
                          )}
                        </View>
                        
                        <View className={`w-5 h-5 rounded border-2 items-center justify-center ${
                          isSelected ? 'bg-[#FF6551] border-[#FF6551]' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <View className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                
                <View className="flex-row justify-end gap-3 mt-4">
                  <Pressable
                    onPress={handleCloseTeammateModal}
                    className="bg-gray-200 px-6 py-3 rounded-full"
                  >
                    <Text className="text-gray-700 font-inter font-medium">Cancel</Text>
                  </Pressable>
                  
                  <Pressable
                    onPress={handleCloseTeammateModal}
                    className="bg-[#FF6551] px-6 py-3 rounded-full"
                  >
                    <Text className="text-white font-inter font-medium">Done</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Questions */}
      <ScrollView 
        className="flex-1 px-4 pt-4" 
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={false}
        nestedScrollEnabled={false}
        bounces={false}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View>
            {questions.map((question, index) => (
              <QuestionComponent
                key={`question-${question.id}-${isReadOnly}`}
                question={question}
                index={index + 1}
                questionId={question.id}
                onAnswerChange={handleAnswerChange}
                initialValue={''}
                isReadOnly={isReadOnly}
              />
            ))}
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <View className="bg-white px-4 py-4 pb-8 border-t border-gray-100 shadow-lg">
        <View className="flex-row justify-between">
          {isReadOnly ? (
            <View className="flex-1">
              <Pressable
                onPress={handleDiscard}
                className="bg-[#FF6551] px-8 py-4 rounded-full flex-1 items-center"
              >
                <Text className="text-white font-inter font-medium">Back to Forms</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Pressable
                onPress={handleDiscard}
                className="bg-white border border-gray-300 px-8 py-4 rounded-full"
              >
                <Text className="text-gray-700 font-inter font-medium">Discard Changes</Text>
              </Pressable>
              
              <Pressable
                onPress={handleSubmit}
                disabled={submitting}
                className={`px-8 py-4 rounded-full ${
                  submitting ? 'bg-gray-400' : 'bg-[#FF6551]'
                }`}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-inter font-medium">
                    {selectedTeammates.length > 0 
                      ? `Submit for ${selectedTeammates.length + 1} people`
                      : 'Submit Form'
                    }
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

// Simple Text Input - Zero parent interaction during typing
const SimpleTextInput = ({ questionId, placeholder, isReadOnly }: {
  questionId: string;
  placeholder: string;
  isReadOnly: boolean;
}) => {
  const [text, setText] = React.useState('');
  
  // Store the value in module-level storage so parent can access it on submit
  React.useEffect(() => {
    formAnswersStorage.set(questionId, text);
  }, [text, questionId]);

  return (
    <TextInput
      className={`border border-gray-300 rounded-lg px-4 py-3 font-inter text-base ${
        isReadOnly ? 'bg-gray-100 text-gray-700' : 'bg-white'
      }`}
      placeholder={placeholder}
      value={text}
      onChangeText={setText}
      editable={!isReadOnly}
      multiline={false}
    />
  );
};

// Question Component
const QuestionComponent = React.memo(({ 
  question, 
  index, 
  questionId,
  onAnswerChange,
  initialValue,
  isReadOnly = false
}: { 
  question: FormQuestion; 
  index: number; 
  questionId: string;
  onAnswerChange: (questionId: string, answer: any) => void;
  initialValue?: any;
  isReadOnly?: boolean;
}) => {
  const renderCountRef = React.useRef(0);
  renderCountRef.current++;
  
  // Local state for non-text inputs
  const [localAnswer, setLocalAnswer] = React.useState<any>(null);
  const [localMultipleAnswer, setLocalMultipleAnswer] = React.useState<string[]>([]);
  
  console.log(`🔄 QuestionComponent render #${renderCountRef.current} for question ${questionId}:`, {
    questionText: question.question_text.substring(0, 30),
    initialValue,
    isReadOnly
  });

  const questionType = mapQuestionType(question.question_type, question.options);

  const handleAnswer = React.useCallback((newAnswer: any) => {
    if (isReadOnly) return;
    console.log(`📝 QuestionComponent handleAnswer for ${questionId}:`, newAnswer);
    setLocalAnswer(newAnswer);
    onAnswerChange(questionId, newAnswer);
  }, [questionId, onAnswerChange, isReadOnly]);

  // For non-text inputs, use parent state
  const answer = initialValue || null;
  const multipleAnswer = Array.isArray(initialValue) ? initialValue : [];

  const handleMultipleAnswer = (option: string) => {
    if (isReadOnly) return;
    const newAnswer = localMultipleAnswer.includes(option)
      ? localMultipleAnswer.filter(item => item !== option)
      : [...localMultipleAnswer, option];
    setLocalMultipleAnswer(newAnswer);
    onAnswerChange(questionId, newAnswer);
  };

  return (
    <View className={`rounded-lg p-4 mb-4 shadow-sm ${isReadOnly ? 'bg-gray-50' : 'bg-white'}`}>
      <View className="mb-4">
        <Text className="text-gray-500 font-inter text-sm mb-2">Question {index}</Text>
        <Text className="text-gray-900 font-inter text-base font-medium">
          {question.question_text}
          {question.is_required && !isReadOnly && <Text className="text-red-500"> *</Text>}
        </Text>
      </View>

      {/* Short Text Input */}
      {questionType === 'short_text' && (
        <SimpleTextInput
          questionId={questionId}
          placeholder={isReadOnly ? 'No answer provided' : 'Type your answer...'}
          isReadOnly={isReadOnly}
        />
      )}

      {/* Long Text Input */}
      {questionType === 'long_text' && (
        <SimpleTextInput
          questionId={questionId}
          placeholder={isReadOnly ? 'No answer provided' : 'Type your answer...'}
          isReadOnly={isReadOnly}
        />
      )}

      {/* Single Select (Radio Buttons) */}
      {questionType === 'single_select' && (
        <View className="space-y-3">
          {/* Boolean questions */}
          {question.question_type === 'boolean' && (
            <>
              <Pressable
                onPress={() => handleAnswer(true)}
                className="flex-row items-center py-2"
                disabled={isReadOnly}
              >
                <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                  localAnswer === true ? 'bg-[#FF6551] border-[#FF6551]' : 'border-gray-300'
                }`}>
                  {localAnswer === true && (
                    <View className="w-2 h-2 bg-white rounded-full" />
                  )}
                </View>
                <Text className={`font-inter text-base ${isReadOnly ? 'text-gray-600' : 'text-gray-900'}`}>
                  Yes
                </Text>
              </Pressable>
              
              <Pressable
                onPress={() => handleAnswer(false)}
                className="flex-row items-center py-2"
                disabled={isReadOnly}
              >
                <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                  localAnswer === false ? 'bg-[#FF6551] border-[#FF6551]' : 'border-gray-300'
                }`}>
                  {localAnswer === false && (
                    <View className="w-2 h-2 bg-white rounded-full" />
                  )}
                </View>
                <Text className={`font-inter text-base ${isReadOnly ? 'text-gray-600' : 'text-gray-900'}`}>
                  No
                </Text>
              </Pressable>
            </>
          )}

          {/* Rating questions */}
          {question.question_type === 'rating' && (
            <View className="flex-row justify-between items-center py-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Pressable
                  key={rating}
                  onPress={() => handleAnswer(rating)}
                  className={`w-10 h-10 rounded-full border-2 items-center justify-center ${
                    localAnswer === rating ? 'bg-[#FF6551] border-[#FF6551]' : 'border-gray-300'
                  }`}
                  disabled={isReadOnly}
                >
                  <Text className={`font-inter text-base font-medium ${
                    localAnswer === rating ? 'text-white' : 'text-gray-600'
                  }`}>
                    {rating}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Multiple choice questions with text options */}
          {question.question_type === 'multiple_choice' && hasTextOptions(question) && (
            <View className="space-y-3">
              {question.options && Array.isArray(question.options) && (question.options as string[]).map((option: string, idx: number) => (
                <Pressable
                  key={idx}
                  onPress={() => handleAnswer(option)}
                  className="flex-row items-center py-2"
                  disabled={isReadOnly}
                >
                  <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                    localAnswer === option ? 'bg-[#FF6551] border-[#FF6551]' : 'border-gray-300'
                  }`}>
                    {localAnswer === option && (
                      <View className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </View>
                  <Text className={`font-inter text-base ${isReadOnly ? 'text-gray-600' : 'text-gray-900'}`}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Multiple Select (Checkboxes) */}
      {questionType === 'multiple_select' && hasTextOptions(question) && (
        <View className="space-y-3">
          {question.options && Array.isArray(question.options) && (question.options as string[]).map((option: string, idx: number) => (
            <Pressable
              key={idx}
              onPress={() => handleMultipleAnswer(option)}
              className="flex-row items-center py-2"
              disabled={isReadOnly}
            >
              <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                multipleAnswer.includes(option) ? 'bg-[#FF6551] border-[#FF6551]' : 'border-gray-300'
              }`}>
                {multipleAnswer.includes(option) && (
                  <Text className="text-white font-inter text-xs">✓</Text>
                )}
              </View>
              <Text className={`font-inter text-base ${isReadOnly ? 'text-gray-600' : 'text-gray-900'}`}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Composite Questions */}
      {questionType === 'composite' && (
        <View className="space-y-3">
          {(() => {
            try {
              const subQuestionsJson = question.sub_questions;
              const subQuestionsString = typeof subQuestionsJson === 'string' ? subQuestionsJson : '[]';
              const subQuestions = JSON.parse(subQuestionsString);
              return subQuestions.map((subQ: any, idx: number) => (
                <View key={idx} className="bg-gray-50 rounded-lg p-4">
                  <Text className="text-gray-700 font-inter text-sm mb-2">
                    {subQ.question}
                  </Text>
                  <SimpleTextInput
                    questionId={`sub_${idx}`}
                    placeholder={isReadOnly ? 'No answer provided' : 'Type your answer...'}
                    isReadOnly={isReadOnly}
                  />
                </View>
              ));
            } catch (error) {
              console.error('Error parsing sub questions:', error);
              return (
                <View className="bg-gray-50 rounded-lg p-4">
                  <Text className="text-gray-600 font-inter text-sm mb-3">
                    Composite question (unable to load sub-questions)
                  </Text>
                  <SimpleTextInput
                    questionId={`composite_${question.id}`}
                    placeholder={isReadOnly ? 'No answer provided' : 'Type your answer...'}
                    isReadOnly={isReadOnly}
                  />
                </View>
              );
            }
          })()}
        </View>
      )}
    </View>
  );
});

export default FormDetailsScreen; 