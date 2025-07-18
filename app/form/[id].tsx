import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { calculateTimeRemaining, fetchFormTeammates, getCurrentUser, supabase, type AssignedForm, type FormQuestion, type FormTeammate } from '../../lib/supabase';

// Module-level storage for form answers
const formAnswersStorage = new Map<string, string>();

// Extended question types to match the 5 types shown in the design
type ExtendedQuestionType = 'short_text' | 'long_text' | 'single_select' | 'multiple_select' | 'composite';

// Function to map database question types to our extended types
const mapQuestionType = (dbType: string, options: any): ExtendedQuestionType => {
  console.log(`🔧 mapQuestionType called with: dbType="${dbType}", options=`, options);
  
  switch (dbType) {
    case 'text':
    case 'short_text':
      return 'short_text';
    case 'long_text':
      return 'long_text';
    case 'boolean':
    case 'rating':
    case 'single_select':
      return 'single_select';
    case 'multiple_choice':
    case 'multi_select':
      // Check if it has multiple options for multi_select vs single_select
      return Array.isArray(options) && options.length > 1 ? 'multiple_select' : 'single_select';
    case 'date':
      return 'short_text';
    case 'composite':
      return 'composite';
    default:
      console.warn(`⚠️ Unknown question type: "${dbType}", defaulting to short_text`);
      return 'short_text';
  }
};

interface FormDetailsData {
  assignment: AssignedForm;
  questions: FormQuestion[];
}

// ADD BACK SIMPLE TEXT INPUT - This might be the culprit!
const SimpleTextInput = React.memo(({ questionId, placeholder, isReadOnly }: {
  questionId: string;
  placeholder: string;
  isReadOnly: boolean;
}) => {
  console.log(`📝 SimpleTextInput render for ${questionId}`);
  
  // Initialize from storage if available
  const [text, setText] = React.useState(() => {
    return formAnswersStorage.get(questionId) || '';
  });
  
  // Only update storage when text actually changes, and debounce it
  React.useEffect(() => {
    console.log(`💾 SimpleTextInput useEffect for ${questionId}, text: "${text}"`);
    const timeoutId = setTimeout(() => {
      formAnswersStorage.set(questionId, text);
    }, 100); // Small debounce to prevent excessive updates
    
    return () => clearTimeout(timeoutId);
  }, [text, questionId]);

  return (
    <TextInput
      className={`border rounded-lg px-4 py-3 font-inter text-base ${
        isReadOnly 
          ? 'border-gray-200 bg-gray-50 text-gray-700' 
          : 'border-gray-300 bg-white text-gray-900'
      }`}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      value={text}
      onChangeText={(newText) => {
        console.log(`⌨️ SimpleTextInput onChangeText for ${questionId}: "${newText}"`);
        setText(newText);
      }}
      editable={!isReadOnly}
      multiline={false}
      style={{ minHeight: 48 }}
    />
  );
});

// ADD BACK QUESTION COMPONENT - This might be the culprit!
const QuestionComponent = React.memo(({ 
  question, 
  index, 
  questionId,
  isReadOnly = false
}: { 
  question: FormQuestion; 
  index: number; 
  questionId: string;
  isReadOnly?: boolean;
}) => {
  const renderCountRef = React.useRef(0);
  renderCountRef.current++;
  
  // Local state to trigger re-renders when answers change
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  // Parse JSON strings from database
  const parsedOptions = React.useMemo(() => {
    if (!question.options) return [];
    if (Array.isArray(question.options)) return question.options;
    if (typeof question.options === 'string') {
      try {
        const parsed = JSON.parse(question.options);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Failed to parse options:', question.options);
        return [];
      }
    }
    return [];
  }, [question.options]);

  const parsedSubQuestions = React.useMemo(() => {
    if (!question.sub_questions) return [];
    if (Array.isArray(question.sub_questions)) return question.sub_questions;
    if (typeof question.sub_questions === 'string') {
      try {
        const parsed = JSON.parse(question.sub_questions);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Failed to parse sub_questions:', question.sub_questions);
        return [];
      }
    }
    return [];
  }, [question.sub_questions]);
  
  console.log(`🔄 QuestionComponent render #${renderCountRef.current} for question ${questionId}`);
  console.log(`📝 Question details:`, {
    questionText: question.question_text,
    questionType: question.question_type,
    mappedType: mapQuestionType(question.question_type, parsedOptions),
    rawOptions: question.options,
    parsedOptions: parsedOptions,
    parsedOptionsLength: parsedOptions.length,
    isRequired: question.is_required,
    rawSubQuestions: question.sub_questions,
    parsedSubQuestions: parsedSubQuestions,
    parsedSubQuestionsLength: parsedSubQuestions.length
  });
  
  console.log(`🎯 MAPPING DEBUG: Raw type "${question.question_type}" maps to "${mapQuestionType(question.question_type, parsedOptions)}"`);

  const questionType = mapQuestionType(question.question_type, parsedOptions);
  console.log(`🎯 Final questionType: ${questionType}, will show input: ${questionType === 'short_text'}`);

  return (
    <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
      <Text className="text-gray-500 font-inter text-sm mb-2">Question {index}</Text>
      <Text className="text-gray-900 font-inter text-base font-medium mb-4">
        {question.question_text}
        {question.is_required && !isReadOnly && <Text className="text-red-500"> *</Text>}
      </Text>

      {/* Short Text Input */}
      {questionType === 'short_text' && (
        <SimpleTextInput
          questionId={questionId}
          placeholder={isReadOnly ? 'No answer provided' : 'Type your answer...'}
          isReadOnly={isReadOnly}
        />
      )}

      {/* Single Select Questions - Radio Button Style */}
      {questionType === 'single_select' && (
        <View className="space-y-3">
          {parsedOptions.length > 0 ? (
            parsedOptions.map((option, optionIndex: number) => {
              const optionText = typeof option === 'string' ? option : String(option);
              const isSelected = formAnswersStorage.get(questionId) === optionText;
              return (
                <Pressable
                  key={`${questionId}_option_${optionIndex}`}
                  className="flex-row items-center"
                  onPress={() => {
                    if (!isReadOnly) {
                      formAnswersStorage.set(questionId, optionText);
                      forceUpdate(); // Trigger re-render to show selection
                    }
                  }}
                  disabled={isReadOnly}
                >
                  <View 
                    className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      isSelected ? 'border-[#FF6551]' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <View className="w-3 h-3 rounded-full bg-[#FF6551]" />
                    )}
                  </View>
                  <Text className="text-gray-700 font-inter flex-1">{optionText}</Text>
                </Pressable>
              );
            })
          ) : (
            <Text className="text-gray-500 font-inter text-sm italic">
              No options available
            </Text>
          )}
        </View>
      )}

      {/* Composite Question - Render Sub-Questions with Their Own Types */}
      {questionType === 'composite' && (
        <View>
          {(() => {
            console.log('🔍 COMPOSITE DEBUG:', {
              rawSubQuestions: question.sub_questions,
              parsedSubQuestions: parsedSubQuestions,
              isArray: Array.isArray(parsedSubQuestions),
              length: parsedSubQuestions.length,
              firstItem: parsedSubQuestions.length > 0 ? parsedSubQuestions[0] : 'N/A'
            });
            
            if (parsedSubQuestions.length > 0) {
              console.log('✅ COMPOSITE: Rendering sub-questions');
              return (
                <View className="space-y-4">
                  {parsedSubQuestions.map((subQuestion: any, subIndex: number) => {
                    console.log(`📝 Sub-question ${subIndex}:`, subQuestion);
                    
                    const subQuestionType = subQuestion.type || subQuestion.question_type || 'text';
                    const subQuestionText = subQuestion.question || subQuestion.text || subQuestion.question_text;
                    const subQuestionOptions = subQuestion.options || [];
                    
                    return (
                      <View key={`${questionId}_sub_${subIndex}`} className="ml-4 border-l-2 border-gray-200 pl-3">
                        <Text className="text-gray-700 font-inter text-sm mb-3">
                          {subIndex + 1}. {subQuestionText}
                        </Text>
                        
                        {/* Sub-question based on its type */}
                        {(subQuestionType === 'text' || subQuestionType === 'short_text') && (
                          <SimpleTextInput
                            questionId={`${questionId}_sub_${subIndex}`}
                            placeholder={isReadOnly ? 'No answer provided' : 'Type your answer...'}
                            isReadOnly={isReadOnly}
                          />
                        )}
                        
                        {(subQuestionType === 'single_select' || subQuestionType === 'multiple_choice') && Array.isArray(subQuestionOptions) && (
                          <View className="space-y-2">
                            {subQuestionOptions.map((option: any, optIndex: number) => {
                              const optionText = typeof option === 'string' ? option : String(option);
                              const isSelected = formAnswersStorage.get(`${questionId}_sub_${subIndex}`) === optionText;
                              return (
                                <Pressable
                                  key={`${questionId}_sub_${subIndex}_opt_${optIndex}`}
                                  className="flex-row items-center"
                                                                     onPress={() => {
                                     if (!isReadOnly) {
                                       formAnswersStorage.set(`${questionId}_sub_${subIndex}`, optionText);
                                       forceUpdate(); // Trigger re-render to show selection
                                     }
                                   }}
                                  disabled={isReadOnly}
                                >
                                  <View 
                                    className={`w-4 h-4 rounded-full border-2 mr-2 items-center justify-center ${
                                      isSelected ? 'border-[#FF6551]' : 'border-gray-300'
                                    }`}
                                  >
                                    {isSelected && (
                                      <View className="w-2 h-2 rounded-full bg-[#FF6551]" />
                                    )}
                                  </View>
                                  <Text className="text-gray-600 font-inter text-sm">{optionText}</Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            } else {
              console.log('❌ COMPOSITE: No sub-questions, showing fallback input');
              return (
                <SimpleTextInput
                  questionId={questionId}
                  placeholder={isReadOnly ? 'No answer provided' : 'Type your answer...'}
                  isReadOnly={isReadOnly}
                />
              );
            }
          })()}
        </View>
      )}

      {/* Multiple Select Questions */}
      {questionType === 'multiple_select' && (
        <View className="space-y-3">
          {parsedOptions.length > 0 ? (
            parsedOptions.map((option, optionIndex: number) => {
              const optionText = typeof option === 'string' ? option : String(option);
              const currentAnswers = formAnswersStorage.get(questionId)?.split(',') || [];
              const isSelected = currentAnswers.includes(optionText);
              return (
                <Pressable
                  key={`${questionId}_option_${optionIndex}`}
                  className="flex-row items-center"
                  onPress={() => {
                    if (!isReadOnly) {
                      const newAnswers = isSelected
                        ? currentAnswers.filter(a => a !== optionText)
                        : [...currentAnswers, optionText];
                      formAnswersStorage.set(questionId, newAnswers.join(','));
                      forceUpdate(); // Trigger re-render to show selection
                    }
                  }}
                  disabled={isReadOnly}
                >
                  <View 
                    className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                      isSelected ? 'border-[#FF6551] bg-[#FF6551]' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <Text className="text-white font-bold text-xs">✓</Text>
                    )}
                  </View>
                  <Text className="text-gray-700 font-inter flex-1">{optionText}</Text>
                </Pressable>
              );
            })
          ) : (
            <Text className="text-gray-500 font-inter text-sm italic">
              No options available
            </Text>
          )}
        </View>
      )}

      {/* Long Text Input */}
      {questionType === 'long_text' && (
        <SimpleTextInput
          questionId={questionId}
          placeholder={isReadOnly ? 'No answer provided' : 'Type your detailed answer...'}
          isReadOnly={isReadOnly}
        />
      )}

      {/* Debug for unsupported types */}
      {!['short_text', 'long_text', 'single_select', 'multiple_select', 'composite'].includes(questionType) && (
        <View className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <Text className="text-yellow-800 text-xs">
            Debug: questionType = "{questionType}" | raw = "{question.question_type}"
          </Text>
        </View>
      )}
    </View>
  );
});

// Test version to gradually restore functionality
const FormDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [stableId] = useState(() => params.id);

  // Add back core state
  const [formData, setFormData] = useState<FormDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Add back teammates state
  const [teammates, setTeammates] = useState<FormTeammate[]>([]);
  const [teammatesLoading, setTeammatesLoading] = useState(true);
  const [teammatesError, setTeammatesError] = useState<string | null>(null);
  const [selectedTeammates, setSelectedTeammates] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<string>('0d 0h 0m');
  const [submitting, setSubmitting] = useState(false);
  const [showTeammatesModal, setShowTeammatesModal] = useState(false);

  // Simple render counter
  const renderCountRef = React.useRef(0);
  renderCountRef.current++;
  
  console.log(`🔄 FINAL FormDetailsScreen render #${renderCountRef.current}, stableId: ${stableId}`);
  console.log('📊 State:', { 
    hasFormData: !!formData, 
    loading, 
    hasError: !!error, 
    isReadOnly,
    teammatesCount: teammates.length,
    teammatesLoading,
    teammatesError: !!teammatesError,
    selectedTeammatesCount: selectedTeammates.length
  });

  // Memoization logic
  const questions = React.useMemo(() => {
    console.log('📋 Recalculating questions memo');
    return formData?.questions || [];
  }, [formData?.questions]);

  const assignment = React.useMemo(() => {
    console.log('👤 Recalculating assignment memo');
    return formData?.assignment || null;
  }, [formData?.assignment]);

  const form = React.useMemo(() => {
    console.log('📝 Recalculating form memo');
    return assignment?.forms || null;
  }, [assignment?.forms]);

  const creator = React.useMemo(() => {
    console.log('👨‍💼 Recalculating creator memo');
    return assignment?.profiles || null;
  }, [assignment?.profiles]);

  // Memoized handlers
  const handleTeammateToggle = React.useCallback((userId: string) => {
    console.log('🔄 handleTeammateToggle called for:', userId);
    setSelectedTeammates(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const handleSubmit = React.useCallback(async () => {
    console.log('🔄 handleSubmit called');
    if (!formData || isReadOnly || !assignment || submitting) return;
    
    setSubmitting(true);
    
    try {
      // 1. VALIDATION: Check that all required questions have answers
      const missingRequired: string[] = [];
      
      questions.forEach(question => {
        if (question.is_required) {
          // For composite questions, only validate sub-questions, not the main question
          if (question.question_type === 'composite') {
            let subQuestions = question.sub_questions;
            if (typeof subQuestions === 'string') {
              try {
                subQuestions = JSON.parse(subQuestions);
              } catch (e) {
                subQuestions = [];
              }
            }
            
            if (Array.isArray(subQuestions)) {
              subQuestions.forEach((subQ, subIndex) => {
                const subAnswer = formAnswersStorage.get(`${question.id}_sub_${subIndex}`);
                if (!subAnswer || subAnswer.trim() === '') {
                  // Safely handle subQ which might be various types
                  const subQuestionText = (subQ && typeof subQ === 'object' && 'question' in subQ) 
                    ? String(subQ.question) 
                    : `Sub-question ${subIndex + 1}`;
                  missingRequired.push(`${question.question_text} - ${subQuestionText}`);
                }
              });
            }
          } else {
            // For non-composite questions, validate the main answer
            const answer = formAnswersStorage.get(question.id);
            if (!answer || answer.trim() === '') {
              missingRequired.push(question.question_text);
            }
          }
        }
      });
      
      // If validation fails, show error and stop
      if (missingRequired.length > 0) {
        console.error('❌ Validation failed - missing required answers:', missingRequired);
        alert(`Please answer all required questions:\n\n${missingRequired.map(q => `• ${q}`).join('\n')}`);
        return;
      }
      
      // Show confirmation if submitting for teammates
      if (selectedTeammates.length > 0) {
        const confirmed = confirm(
          `You are about to submit this form for yourself and ${selectedTeammates.length} teammate${selectedTeammates.length > 1 ? 's' : ''}.\n\nDo you want to continue?`
        );
        if (!confirmed) {
          return;
        }
      }
      
      console.log('✅ Validation passed - all required questions answered');
      
      // 2. COLLECT ANSWERS: Collect all answers from storage
      const answers: Record<string, any> = {};
      questions.forEach(question => {
        if (question.question_type === 'composite') {
          // For composite questions, collect all sub-answers into a JSON object
          let subQuestions = question.sub_questions;
          if (typeof subQuestions === 'string') {
            try {
              subQuestions = JSON.parse(subQuestions);
            } catch (e) {
              subQuestions = [];
            }
          }
          
          if (Array.isArray(subQuestions)) {
            const subAnswers: Record<string, string> = {};
            subQuestions.forEach((subQ, subIndex) => {
              const subAnswer = formAnswersStorage.get(`${question.id}_sub_${subIndex}`);
              if (subAnswer) {
                // Use sub-question text as key, or fallback to index
                const subQuestionText = (subQ && typeof subQ === 'object' && 'question' in subQ) 
                  ? String(subQ.question) 
                  : `sub_${subIndex}`;
                subAnswers[subQuestionText] = subAnswer;
              }
            });
            
            // Store all sub-answers as a JSON object under the main question ID
            if (Object.keys(subAnswers).length > 0) {
              answers[question.id] = subAnswers;
            }
          }
        } else {
          // For regular questions, store the answer directly
          const answer = formAnswersStorage.get(question.id);
          if (answer) {
            answers[question.id] = answer;
          }
        }
      });
      
      console.log('📋 Form answers collected:', answers);
      
      // 3. DATABASE SUBMISSION: Create form response and save answers
      const { user: currentUser } = await getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Step 3a: Create form response record
      const { data: formResponse, error: responseError } = await supabase
        .from('form_responses')
        .insert({
          form_id: assignment.form_id,
          respondent_id: currentUser.id,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          started_at: new Date().toISOString(), // Assume started when submitted for now
          metadata: { 
            total_questions: questions.length,
            answered_questions: Object.keys(answers).length 
          }
        })
        .select()
        .single();
      
      if (responseError) {
        console.error('❌ Error creating form response:', responseError);
        throw new Error(`Failed to save form response: ${responseError.message}`);
      }
      
      console.log('✅ Form response created:', formResponse.id);
      
      // Step 3b: Create answer records for each question
      const answerInserts = Object.entries(answers).map(([questionId, answer]) => ({
        response_id: formResponse.id,
        question_id: questionId,
        answer: answer // Store as JSON
      }));
      
      if (answerInserts.length > 0) {
        const { error: answersError } = await supabase
          .from('form_response_answers')
          .insert(answerInserts);
        
        if (answersError) {
          console.error('❌ Error saving form answers:', answersError);
          throw new Error(`Failed to save form answers: ${answersError.message}`);
        }
        
        console.log('✅ Form answers saved:', answerInserts.length);
      }
      
      // Step 3c: Update form assignment status to completed
      const { error: assignmentError } = await supabase
        .from('form_assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', stableId);
      
      if (assignmentError) {
        console.error('❌ Error updating assignment status:', assignmentError);
        throw new Error(`Failed to update assignment status: ${assignmentError.message}`);
      }
      
      console.log('✅ Assignment status updated to completed');
      
      // Step 3d: Submit for selected teammates
      if (selectedTeammates.length > 0 && assignment.forms) {
        console.log('👥 Submitting for selected teammates:', selectedTeammates.length);
        
        for (const teammateId of selectedTeammates) {
          try {
            console.log(`📝 Submitting for teammate: ${teammateId}`);
            
            // Create form response for teammate
            const { data: teammateResponse, error: teammateResponseError } = await supabase
              .from('form_responses')
              .insert({
                form_id: assignment.forms.id,
                respondent_id: teammateId,
                status: 'submitted',
                submitted_at: new Date().toISOString(),
                started_at: new Date().toISOString(),
                metadata: { 
                  total_questions: questions.length,
                  answered_questions: Object.keys(answers).length,
                  submitted_by: currentUser.id // Track who actually filled it out
                }
              })
              .select()
              .single();
            
            if (teammateResponseError) {
              console.error(`❌ Error creating teammate response for ${teammateId}:`, teammateResponseError);
              continue; // Continue with other teammates
            }
            
            // Create answer records for teammate (same answers)
            const teammateAnswerInserts = Object.entries(answers).map(([questionId, answer]) => ({
              response_id: teammateResponse.id,
              question_id: questionId,
              answer: answer
            }));
            
            if (teammateAnswerInserts.length > 0) {
              const { error: teammateAnswersError } = await supabase
                .from('form_response_answers')
                .insert(teammateAnswerInserts);
              
              if (teammateAnswersError) {
                console.error(`❌ Error saving teammate answers for ${teammateId}:`, teammateAnswersError);
                continue;
              }
            }
            
            // Update teammate's form assignment status
            const { error: teammateAssignmentError } = await supabase
              .from('form_assignments')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('form_id', assignment.forms.id)
              .eq('employee_id', teammateId);
            
            if (teammateAssignmentError) {
              console.error(`❌ Error updating teammate assignment for ${teammateId}:`, teammateAssignmentError);
            } else {
              console.log(`✅ Teammate submission completed for ${teammateId}`);
            }
            
          } catch (teammateError) {
            console.error(`💥 Error submitting for teammate ${teammateId}:`, teammateError);
            // Continue with other teammates
          }
        }
        
        console.log('✅ All teammate submissions processed');
      }
      
      // 4. SUCCESS: Navigate to success page (keep answers in storage for viewing)
      console.log('🎉 Form submitted successfully!');
      
      // Navigate to success page
      router.push('/form/success');
      
    } catch (error) {
      console.error('❌ Error submitting form:', error);
      alert(`Failed to submit form: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  }, [formData, isReadOnly, questions, router, assignment, stableId, submitting, selectedTeammates]);

  const handleDiscard = React.useCallback(() => {
    console.log('🔄 handleDiscard called');
    router.back();
  }, [router]);

  // Add back the core data fetching useEffect
  useEffect(() => {
    console.log('🔥 useEffect triggered for fetchFormDetails');
    const fetchFormDetails = async () => {
      if (!stableId) return;
      
      try {
        console.log('📡 Starting fetch...');
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
          .eq('id', stableId)
          .single();

        if (assignmentError) {
          throw new Error(assignmentError.message);
        }

        if (!assignment) {
          throw new Error('Form not found');
        }

        console.log('✅ Assignment fetched:', assignment);

        // Fetch creator profile separately
        if (assignment.forms?.created_by) {
          console.log('👤 Fetching creator profile for:', assignment.forms.created_by);
          const { data: creatorProfile, error: profileError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .eq('id', assignment.forms.created_by)
            .single();

          if (!profileError && creatorProfile) {
            console.log('✅ Creator profile fetched:', creatorProfile);
            // Add the profile to the assignment object
            (assignment as any).profiles = creatorProfile;
          } else {
            console.error('❌ Error fetching creator profile:', profileError);
          }
        }

        // Check if form is completed
        const isCompleted = assignment.status === 'completed';
        console.log('📋 Setting isReadOnly to:', isCompleted);
        setIsReadOnly(isCompleted);

        const formDetails: FormDetailsData = {
          assignment: assignment as AssignedForm,
          questions: assignment.forms?.form_questions || []
        };

        console.log('💾 Setting form data...');
        setFormData(formDetails);
        console.log('✅ Form data set successfully');
        
        // Calculate timer
        if (assignment.due_date && assignment.employee_id) {
          const timer = await calculateTimeRemaining(assignment.due_date, assignment.employee_id);
          setTimeRemaining(timer);
        }

        // Teammates functionality
        console.log('👥 Starting teammates fetch...');
        const { user: currentUserData } = await getCurrentUser();

        // Load previously submitted answers if form is completed
        if (isCompleted && assignment.forms && currentUserData) {
          console.log('📋 Loading submitted answers for completed form...');
          try {
            const { data: formResponseData, error: responseError } = await supabase
              .from('form_responses')
              .select(`
                id,
                form_response_answers (
                  question_id,
                  answer
                )
              `)
              .eq('form_id', assignment.forms.id)
              .eq('respondent_id', assignment.employee_id)
              .eq('status', 'submitted')
              .order('submitted_at', { ascending: false })
              .limit(1)
              .single();

            if (responseError) {
              console.error('❌ Error loading submitted answers:', responseError);
            } else if (formResponseData && formResponseData.form_response_answers) {
              console.log('✅ Found submitted answers:', formResponseData.form_response_answers.length);
              
              // Populate formAnswersStorage with submitted answers
              formResponseData.form_response_answers.forEach((answerRecord: any) => {
                const questionId = answerRecord.question_id;
                const answer = answerRecord.answer;
                
                if (typeof answer === 'object' && answer !== null) {
                  // Handle composite question answers (stored as JSON object)
                  Object.entries(answer).forEach(([subQuestionText, subAnswer], index) => {
                    formAnswersStorage.set(`${questionId}_sub_${index}`, String(subAnswer));
                  });
                } else {
                  // Handle regular question answers
                  formAnswersStorage.set(questionId, String(answer));
                }
              });
              
              console.log('✅ Submitted answers loaded into storage');
            } else {
              console.log('ℹ️ No submitted answers found for this form');
            }
          } catch (error) {
            console.error('💥 Error loading submitted answers:', error);
          }
        }

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
              setTeammatesError(teammatesError.message || 'Failed to load teammates');
            } else if (teammatesData) {
              console.log('✅ Setting teammates:', teammatesData.length);
              setTeammates(teammatesData);
              console.log('✅ Teammates loaded successfully:', teammatesData.length);
            } else {
              console.log('ℹ️ No teammates found for this form');
              setTeammates([]);
            }
          } catch (err) {
            console.error('💥 Unexpected error during teammate fetch:', err);
            setTeammatesError('Unexpected error loading teammates');
          } finally {
            console.log('🏁 Setting teammatesLoading to false...');
            setTeammatesLoading(false);
          }
        } else {
          console.log('ℹ️ Not fetching teammates:', { isCompleted, hasForm: !!assignment.forms, hasUser: !!currentUserData });
          setTeammatesLoading(false);
        }

      } catch (error) {
        console.error('❌ Error fetching form details:', error);
        setError(error instanceof Error ? error.message : 'Failed to load form');
      } finally {
        console.log('🏁 Setting loading to false...');
        setLoading(false);
      }
    };

    fetchFormDetails();
  }, [stableId]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#FF6551" />
        <Text className="mt-4 text-gray-600 font-inter">Loading form...</Text>
      </View>
    );
  }

  if (error || !formData || !assignment || !form) {
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

  return (
    <View className="flex-1 bg-white">
      {/* Mobile Header - Reduced size and improved scrolling */}
      <View className="bg-[#FF6551] pt-10 pb-4 px-4 rounded-b-[24px]">
        <View className="flex-row items-center justify-between mb-3">
          <Pressable onPress={() => router.back()} className="p-2">
            <Text className="text-white font-inter text-xl">←</Text>
          </Pressable>
          <Text className="text-white font-inter text-sm">
            {timeRemaining}
          </Text>
          <Pressable className="p-2">
            <Text className="text-white font-inter text-xl">⋯</Text>
          </Pressable>
        </View>
        
        <View className="pb-2">
          <Text className="text-white font-inter text-xl font-bold mb-2">
            {form.title}
          </Text>
          <Text className="text-white/80 font-inter text-sm mb-3">
            {form.description || 'Weather is affects on the work'}
          </Text>
          
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-white/60 font-inter text-xs">Created by</Text>
              <Text className="text-white font-inter text-sm">
                {creator?.first_name} {creator?.last_name}
              </Text>
            </View>
            <View>
              <Text className="text-white/60 font-inter text-xs">Last Update</Text>
              <Text className="text-white font-inter text-sm">
                {new Date().toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric' 
                })} 11:30AM
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <Text className="text-white/60 font-inter text-xs mr-2">Filled out by teammates</Text>
            {teammatesLoading ? (
              <Text className="text-white/60 font-inter text-xs">Loading...</Text>
            ) : teammates.length > 0 ? (
              <Pressable 
                className="bg-[#FF6551] border border-white/20 rounded-full px-3 py-1 flex-row items-center"
                onPress={() => setShowTeammatesModal(true)}
                disabled={isReadOnly}
              >
                <View className="flex-row -mr-1">
                  {teammates.slice(0, 3).map((teammate, index) => (
                    <View 
                      key={teammate.userId} 
                      className="w-6 h-6 bg-white/20 rounded-full border border-white/40"
                      style={{ marginLeft: index > 0 ? -8 : 0 }}
                    />
                  ))}
                </View>
                <Text className="text-white font-inter text-xs ml-2">
                  {selectedTeammates.length > 0 
                    ? `Selected: ${selectedTeammates.length}` 
                    : teammates.length > 3 ? `+${teammates.length - 3} more` : 'Add More'}
                </Text>
              </Pressable>
            ) : (
              <Text className="text-white/60 font-inter text-xs">No teammates</Text>
            )}
          </View>
        </View>
      </View>

      {/* Form Questions - Fixed clipping with proper spacing */}
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {questions.map((question, index) => (
          <QuestionComponent
            key={question.id}
            question={question}
            index={index + 1}
            questionId={question.id}
            isReadOnly={isReadOnly}
          />
        ))}
      </ScrollView>
      
      {/* Bottom Actions - Fixed positioning */}
      <View className="px-4 pb-8 pt-4 bg-white border-t border-gray-100">
        <View className="flex-row gap-3">
          <Pressable
            className="flex-1 bg-white border border-gray-300 rounded-full py-4 items-center"
            onPress={() => router.back()}
            disabled={submitting}
          >
            <Text className="text-gray-700 font-inter font-medium">Discard Changes</Text>
          </Pressable>
          
          <Pressable
            className={`flex-1 rounded-full py-4 items-center ${
              submitting || isReadOnly 
                ? 'bg-gray-400' 
                : 'bg-[#FF6551]'
            }`}
            onPress={handleSubmit}
            disabled={isReadOnly || submitting}
          >
            <Text className="text-white font-inter font-medium">
              {submitting 
                ? 'Submitting...' 
                : selectedTeammates.length > 0 
                  ? `Submit for ${selectedTeammates.length + 1} people`
                  : 'Submit Form'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Teammates Selection Modal */}
      <Modal
        visible={showTeammatesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTeammatesModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-900 font-inter text-lg font-semibold">
                Filled out by teammates
              </Text>
              <Pressable 
                onPress={() => setShowTeammatesModal(false)}
                className="w-8 h-8 items-center justify-center"
              >
                <Text className="text-gray-400 font-inter text-2xl">×</Text>
              </Pressable>
            </View>

            {/* Teammates List */}
            <ScrollView className="max-h-80 mb-6">
              {teammates.map((teammate) => (
                <Pressable
                  key={teammate.userId}
                  className="flex-row items-center py-3 px-2"
                  onPress={() => {
                    setSelectedTeammates(prev => 
                      prev.includes(teammate.userId)
                        ? prev.filter(id => id !== teammate.userId)
                        : [...prev, teammate.userId]
                    );
                  }}
                >
                  {/* Checkbox */}
                  <View className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${
                    selectedTeammates.includes(teammate.userId) 
                      ? 'bg-[#FF6551] border-[#FF6551]' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {selectedTeammates.includes(teammate.userId) && (
                      <Text className="text-white font-inter text-xs">✓</Text>
                    )}
                  </View>

                  {/* Profile Picture */}
                  <View className="w-12 h-12 bg-gray-200 rounded-full mr-4 items-center justify-center">
                    <Text className="text-gray-600 font-inter text-lg font-semibold">
                      {teammate.profile?.first_name?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>

                  {/* Name */}
                  <Text className="text-gray-900 font-inter text-base flex-1">
                    {teammate.profile?.first_name} {teammate.profile?.last_name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Add Teammates Button */}
            <Pressable
              className="bg-[#FF6551] rounded-full py-4 items-center"
              onPress={() => setShowTeammatesModal(false)}
            >
              <Text className="text-white font-inter font-medium text-base">
                Add Teammates ({selectedTeammates.length})
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FormDetailsScreen; 