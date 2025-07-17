import { router } from 'expo-router';
import { ArrowLeftIcon, CalendarIcon, CheckIcon, EllipsisVerticalIcon, EyeIcon, MoreHorizontalIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import AnnualLeaveCalendarModal from '../components/AnnualLeaveCalendarModal';
import { calculateTimeRemaining, fetchAssignedForms, formatDate, getCurrentUser, type AssignedForm, type Profile } from '../lib/supabase';

// Type for dashboard form display
interface DashboardFormType {
  id: string;
  title: string;
  description: string;
  module: string;
  dueDate: string;
  fillFormDate: string;
  createdBy: string;
  lastUpdate: string;
  timer: string;
  status: string;
  assignmentId: string;
}

interface Question {
  id: string;
  type: 'short_text' | 'single_select';
  label: string;
  required?: boolean;
  options?: string[];
  value?: string;
}

interface FormQuestionsProps {
  questions: Question[];
}

const FormQuestions = ({ questions, onAnswersChange }: FormQuestionsProps & { onAnswersChange: (answers: { [id: string]: string }) => void }) => {
  const [answers, setAnswers] = React.useState<{ [id: string]: string }>({});

  const handleTextChange = React.useCallback((id: string, text: string) => {
    const newAnswers = { ...answers, [id]: text };
    setAnswers(newAnswers);
    onAnswersChange(newAnswers);
  }, [answers, onAnswersChange]);

  const handleSelect = React.useCallback((id: string, option: string) => {
    const newAnswers = { ...answers, [id]: option };
    setAnswers(newAnswers);
    onAnswersChange(newAnswers);
  }, [answers, onAnswersChange]);

  return (
    <View className="px-4 pt-4 pb-2">
      {questions.map((q, idx) => (
        <View key={q.id} className="mb-4">
          <Text className="font-inter text-xs text-[#A1A1AA] mb-1">Question {idx + 1}</Text>
          <View className="bg-white rounded-lg border border-[#E5E7EB] p-4">
            <Text className="font-inter font-semibold text-[16px] text-[#272937] mb-2">
              {q.label}
              {q.required && <Text className="text-[#FF6551]"> *</Text>}
            </Text>
            {q.type === 'short_text' && (
              <TextInput
                className="font-inter text-[14px] text-[#A1A1AA] bg-transparent border-0 p-0 min-h-[48px]"
                placeholder="Type your answer..."
                placeholderTextColor="#A1A1AA"
                multiline
                value={answers[q.id] || ''}
                onChangeText={text => handleTextChange(q.id, text)}
                style={{ lineHeight: 20, letterSpacing: -0.1 }}
              />
            )}
            {q.type === 'single_select' && q.options && (
              <View className="mt-2 gap-3">
                {q.options.map(option => (
                  <Pressable
                    key={option}
                    className="flex-row items-center mb-1"
                    onPress={() => handleSelect(q.id, option)}
                    accessibilityLabel={option}
                    tabIndex={0}
                  >
                    <View className={`w-5 h-5 rounded-full border-2 mr-3 ${answers[q.id] === option ? 'border-[#FF6551] bg-[#FF6551]' : 'border-[#D1D5DB] bg-white' } items-center justify-center`}>
                      {answers[q.id] === option && <View className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </View>
                    <Text className="font-inter text-[14px] text-[#272937]">{option}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

const textColor = "#272937";
const bgColor = "#F8F9FB";
const borderColor = "rgba(39,41,55,0.12)"; // #272937 at 12% opacity

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { 
          label: 'Completed', 
          bgColor: '#ECFDF3', 
          textColor: '#065F46', 
          icon: '✓' 
        };
      case 'pending':
        return { 
          label: 'Pending', 
          bgColor: '#FEF3C7', 
          textColor: '#92400E', 
          icon: '⏳' 
        };
      case 'in_progress':
        return { 
          label: 'In Progress', 
          bgColor: '#DBEAFE', 
          textColor: '#1E40AF', 
          icon: '🔄' 
        };
      case 'overdue':
        return { 
          label: 'Overdue', 
          bgColor: '#FEE2E2', 
          textColor: '#991B1B', 
          icon: '⏰' 
        };
      case 'on_leave':
        return { 
          label: 'On Leave', 
          bgColor: '#E0E7FF', 
          textColor: '#3730A3', 
          icon: '🏖️' 
        };
      default:
        return { 
          label: 'Unknown', 
          bgColor: '#F3F4F6', 
          textColor: '#6B7280', 
          icon: '?' 
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <View 
      className="flex-row items-center px-2 py-1 rounded-full"
      style={{ backgroundColor: config.bgColor }}
    >
      <Text className="text-xs font-inter font-medium mr-1" style={{ color: config.textColor }}>
        {config.icon}
      </Text>
      <Text className="text-xs font-inter font-medium" style={{ color: config.textColor }}>
        {config.label}
      </Text>
    </View>
  );
};

interface FormHeaderProps {
  form: DashboardFormType;
  onBack: () => void;
  onShowAddTeammate: () => void;
}
const FormHeader = ({ form, onBack, onShowAddTeammate }: FormHeaderProps) => (
  <>
    <View className="bg-[#FF6551] pt-14 pb-6 px-4 rounded-b-none">
      <View className="flex-row items-center justify-between mb-2">
        <Pressable onPress={onBack} accessibilityLabel="Back" tabIndex={0} className="p-1">
          <ArrowLeftIcon color="white" size={24} />
        </Pressable>
        <Text className="text-white font-inter text-xs font-normal">{form.timer}</Text>
        <Pressable accessibilityLabel="More options" tabIndex={0} className="p-1">
          <MoreHorizontalIcon color="white" size={24} />
        </Pressable>
      </View>
      <Text className="text-white font-inter text-2xl font-semibold mb-1">{form.title}</Text>
      <Text className="text-white font-inter text-base font-normal mb-2">{form.description}</Text>
    </View>
    <View className="bg-white px-4 pt-4 pb-2">
      <View className="flex-row items-end justify-between mb-2">
        <View>
          <Text className="text-[#A1A1AA] font-inter text-xs mb-1">Created by</Text>
          <Text className="text-[#272937] font-inter text-lg font-semibold">{form.createdBy}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[#A1A1AA] font-inter text-xs mb-1">Last Update</Text>
          <Text className="text-[#272937] font-inter text-lg font-semibold">{form.lastUpdate}</Text>
        </View>
      </View>
      <View className="flex-row items-center mt-2">
        <Text className="text-[#A1A1AA] font-inter text-xs mr-2">Filled out by teammates</Text>
        <Pressable className="bg-[#FF6551] px-3 py-1 rounded-full flex-row items-center" accessibilityLabel="Add Teammate" tabIndex={0} onPress={onShowAddTeammate}>
          <Text className="text-white font-inter font-semibold text-xs mr-1">Add Teammate</Text>
        </Pressable>
      </View>
    </View>
  </>
);

interface FormFooterProps {
  onDiscard: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
}
const FormFooter = ({ onDiscard, onSubmit, submitDisabled }: FormFooterProps) => (
  <View className="flex-row justify-between px-4 pb-8 pt-4 bg-transparent">
    <Pressable
      className="flex-1 mr-2 border border-[#272937] rounded-full py-3 items-center"
      accessibilityLabel="Discard Changes"
      tabIndex={0}
      onPress={onDiscard}
    >
      <Text className="font-inter font-semibold text-[16px] text-[#272937]">Discard Changes</Text>
    </Pressable>
    <Pressable
      className={`flex-1 ml-2 rounded-full py-3 items-center ${submitDisabled ? 'bg-[#E9E9EA]' : 'bg-[#FF6551]'}`}
      accessibilityLabel="Submit Form"
      tabIndex={0}
      onPress={submitDisabled ? undefined : onSubmit}
      disabled={submitDisabled}
    >
      <Text className={`font-inter font-semibold text-[16px] ${submitDisabled ? 'text-[#A1A1AA]' : 'text-white'}`}>Submit Form</Text>
    </Pressable>
  </View>
);

// Mock teammates data (TODO: make this dynamic too)
const mockTeammates = [
  { id: '1', name: 'Darlene Robertson', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
  { id: '2', name: 'Kathryn Murphy', avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
  { id: '3', name: 'Brooklyn Simmons', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: '4', name: 'Cody Fisher', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
];

// AddTeammateSheet component
interface AddTeammateSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (ids: string[]) => void;
  selected: string[];
}
const AddTeammateSheet = ({ visible, onClose, onAdd, selected }: AddTeammateSheetProps) => {
  const [checked, setChecked] = React.useState<string[]>(selected);

  React.useEffect(() => {
    setChecked(selected);
  }, [selected, visible]);

  const toggle = (id: string) => {
    setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/30">
          <TouchableWithoutFeedback onPress={() => {}}>
            <View className="bg-white rounded-t-3xl px-4 pt-6 pb-8" style={{ minHeight: 380 }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="font-inter font-semibold text-base text-[#272937]">Filled out by teammates</Text>
                <Pressable onPress={onClose} accessibilityLabel="Close" tabIndex={0}>
                  <Text className="text-2xl text-[#A1A1AA]">×</Text>
                </Pressable>
              </View>
              {mockTeammates.map(tm => (
                <Pressable
                  key={tm.id}
                  className={`flex-row items-center mb-3 bg-white rounded-xl px-3 py-2 border border-[#E5E7EB] ${checked.includes(tm.id) ? 'border-[#FF6551] bg-[#FFF5F2]' : ''}`}
                  onPress={() => toggle(tm.id)}
                  accessibilityLabel={tm.name}
                  tabIndex={0}
                >
                  <View className="w-5 h-5 mr-3 border-2 rounded-md items-center justify-center" style={{ borderColor: checked.includes(tm.id) ? '#FF6551' : '#D1D5DB', backgroundColor: checked.includes(tm.id) ? '#FF6551' : '#fff' }}>
                    {checked.includes(tm.id) && <View className="w-3 h-3 bg-white rounded" />}
                  </View>
                  <Image source={{ uri: tm.avatar }} className="w-8 h-8 rounded-full mr-3" />
                  <Text className="font-inter text-[15px] text-[#272937]">{tm.name}</Text>
                </Pressable>
              ))}
              <Pressable
                className="mt-8 bg-[#FF6551] rounded-full py-3 items-center"
                onPress={() => { onAdd(checked); onClose(); }}
                accessibilityLabel="Add Teammates"
                tabIndex={0}
              >
                <Text className="text-white font-inter font-semibold text-lg">Add Teammates</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const FormsListScreen = () => {
  // State management
  const [assignedForms, setAssignedForms] = useState<AssignedForm[]>([]);
  const [dashboardForms, setDashboardForms] = useState<DashboardFormType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [selectedForm, setSelectedForm] = useState<DashboardFormType | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [answers, setAnswers] = useState<{ [id: string]: string }>({});
  const [showAddTeammate, setShowAddTeammate] = useState(false);
  const [selectedTeammates, setSelectedTeammates] = useState<string[]>([]);
  const [showAnnualLeave, setShowAnnualLeave] = useState(false);

  // Memoized callback to prevent unnecessary re-renders
  const handleAnswersChange = React.useCallback((newAnswers: { [id: string]: string }) => {
    setAnswers(newAnswers);
  }, []);

  // Convert assigned forms to dashboard format
  const convertToDashboardFormat = async (assignedForms: AssignedForm[]): Promise<DashboardFormType[]> => {
    const results = await Promise.all(
      assignedForms.map(async (assignment) => {
        const timer = await calculateTimeRemaining(assignment.due_date, assignment.employee_id);
        
        return {
          id: assignment.forms.id,
          title: assignment.forms.title,
          description: assignment.forms.description || 'No description',
          module: 'Monitoring', // TODO: Add module field to forms table
          dueDate: formatDate(assignment.due_date),
          fillFormDate: formatDate(assignment.created_at),
          createdBy: assignment.profiles 
            ? `${assignment.profiles.first_name || ''} ${assignment.profiles.last_name || ''}`.trim() || assignment.profiles.email || 'Unknown'
            : 'Unknown',
          lastUpdate: formatDate(assignment.updated_at),
          timer,
          status: timer === 'On Leave' ? 'on_leave' : assignment.status,
          assignmentId: assignment.id
        };
      })
    );
    
    return results;
  };

  // Convert form questions to UI format
  const convertQuestionsToUIFormat = (questions: any[]): Question[] => {
    return questions.map((q: any) => ({
      id: q.id,
      type: q.question_type === 'text' ? 'short_text' : 'single_select',
      label: q.question_text,
      required: q.is_required,
      options: q.options ? (Array.isArray(q.options) ? q.options : []) : undefined,
      value: ''
    }));
  };

  // Mock questions data (TODO: make this dynamic based on selected form)
  const mockQuestions: Question[] = [
    {
      id: 'q1',
      type: 'short_text',
      label: 'What main problem of this month?',
      required: false,
      value: '',
    },
    {
      id: 'q2',
      type: 'single_select',
      label: 'How much hours you spent today?',
      required: true,
      options: ['2-4 hours', '4-6 hours', '6-8 hours'],
      value: '',
    },
  ];

  // Validation: all required questions must be answered
  const allQuestions = mockQuestions;
  const isFormValid = allQuestions.every((q: Question) => {
    if (q.type === 'short_text') {
      return (answers[q.id] || '').trim().length > 0;
    }
    if (q.type === 'single_select') {
      return !!answers[q.id];
    }
    return true;
  });

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { user, error: userError } = await getCurrentUser();
        if (userError) {
          throw new Error(userError.message);
        }

        if (!user) {
          // No user found, redirect to login
          router.replace('/');
          return;
        }

        setCurrentUser(user);

        // Fetch assigned forms
        const { data: forms, error: formsError } = await fetchAssignedForms(user.id);
        if (formsError) {
          throw new Error(formsError.message);
        }

        setAssignedForms(forms || []);
        setDashboardForms(await convertToDashboardFormat(forms || []));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: bgColor }}>
        <ActivityIndicator size="large" color="#FF6551" />
        <Text className="mt-4 text-gray-600 font-inter">Loading your forms...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-4" style={{ backgroundColor: bgColor }}>
        <Text className="text-red-500 font-inter text-lg mb-4 text-center">
          Error loading forms
        </Text>
        <Text className="text-gray-600 font-inter text-center mb-4">
          {error}
        </Text>
        <Pressable
          className="bg-[#FF6551] px-6 py-3 rounded-full"
          onPress={() => {
            setError(null);
            setLoading(true);
            // Reload data
            const loadData = async () => {
              try {
                const { user, error: userError } = await getCurrentUser();
                if (userError) throw new Error(userError.message);
                if (!user) { router.replace('/'); return; }
                setCurrentUser(user);
                const { data: forms, error: formsError } = await fetchAssignedForms(user.id);
                if (formsError) throw new Error(formsError.message);
                setAssignedForms(forms || []);
                setDashboardForms(await convertToDashboardFormat(forms || []));
              } catch (error) {
                setError(error instanceof Error ? error.message : 'Failed to load data');
              } finally {
                setLoading(false);
              }
            };
            loadData();
          }}
          accessibilityLabel="Retry"
        >
          <Text className="text-white font-inter font-semibold">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (formSubmitted) {
    return (
      <View className="flex-1 items-center justify-center bg-[#FF6551] px-4" style={{ borderRadius: 32 }}>
        <View className="w-32 h-32 rounded-full bg-white/10 items-center justify-center mb-8">
          <CheckIcon color="white" size={64} />
        </View>
        <Text className="text-white text-2xl font-bold font-inter text-center mb-2">Thanks{"\n"}your form is submitted</Text>
        <Pressable
          className="mt-8 bg-white rounded-full px-8 py-3"
          onPress={() => {
            setFormSubmitted(false);
            setSelectedForm(null);
            setAnswers({});
          }}
          accessibilityLabel="Done"
          tabIndex={0}
        >
          <Text className="text-[#272937] font-inter font-semibold text-lg">Done</Text>
        </Pressable>
      </View>
    );
  }

  if (selectedForm) {
    return (
      <View className="flex-1" style={{ backgroundColor: bgColor }}>
        <FormHeader form={selectedForm} onBack={() => setSelectedForm(null)} onShowAddTeammate={() => setShowAddTeammate(true)} />
        <FormQuestions questions={mockQuestions} onAnswersChange={handleAnswersChange} />
        <FormFooter
          onDiscard={() => setSelectedForm(null)}
          onSubmit={() => setFormSubmitted(true)}
          submitDisabled={!isFormValid}
        />
        <AddTeammateSheet
          visible={showAddTeammate}
          onClose={() => setShowAddTeammate(false)}
          onAdd={setSelectedTeammates}
          selected={selectedTeammates}
        />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      <View className="bg-[#FF6551] pt-20 pb-8 px-6 flex-row items-center justify-between">
        <Text className="text-white text-2xl font-bold font-inter">
          All Forms {dashboardForms.length}
        </Text>
        <View className="flex-row items-center gap-3">
          <Pressable
            className="flex-row items-center gap-2"
            accessibilityLabel="Set Annual Leave"
            tabIndex={0}
            onPress={() => setShowAnnualLeave(true)}
          >
            <CalendarIcon color="white" size={20} />
            <Text className="text-white font-inter font-medium">Annual Leave</Text>
          </Pressable>
          
          {/* Debug Button */}
          <Pressable
            className="bg-white/20 px-3 py-1 rounded-full"
            onPress={() => router.push('/debug-tools' as any)}
            accessibilityLabel="Debug Tools"
          >
            <Text className="text-white font-inter text-sm font-medium">🔍 Debug</Text>
          </Pressable>
        </View>
      </View>

      {/* Forms List */}
      {dashboardForms.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-gray-500 font-inter text-lg text-center mb-2">
            No forms assigned yet
          </Text>
          <Text className="text-gray-400 font-inter text-center">
            Your admin will assign forms to you when available
          </Text>
        </View>
      ) : (
        <FlatList
          data={dashboardForms}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}
          renderItem={({ item }) => {
            const isCompleted = item.status === 'completed';
            const cardOpacity = isCompleted ? 0.7 : 1;
            const titleColor = isCompleted ? '#6B7280' : textColor;
            const descriptionColor = isCompleted ? '#9CA3AF' : textColor;
            
            return (
              <Pressable
                onPress={() => router.push(`/form/${item.assignmentId}` as any)}
                className="bg-white mb-4"
                style={{
                  padding: 24,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: isCompleted ? '#E5E7EB' : borderColor,
                  shadowOpacity: 0,
                  shadowRadius: 0,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 0,
                  opacity: cardOpacity,
                }}
                accessibilityLabel={`Open form: ${item.title}`}
                tabIndex={0}
              >
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1 mr-4">
                    <Text
                      className="font-inter font-semibold mb-2"
                      style={{ fontSize: 16, color: titleColor, letterSpacing: -0.1, lineHeight: 22 }}
                    >
                      {item.title}
                    </Text>
                    <StatusBadge status={item.status} />
                  </View>
                  <Pressable
                    accessibilityLabel="More options"
                    tabIndex={0}
                    onPress={() => {}}>
                    <EllipsisVerticalIcon color="#B0B0B0" size={20} />
                  </Pressable>
                </View>
                <View className="gap-4">
                  <Text
                    className="font-inter font-normal"
                    style={{ fontSize: 14, color: descriptionColor, letterSpacing: -0.1, lineHeight: 20 }}
                  >
                    {item.description}
                  </Text>
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="font-inter font-normal"
                      style={{ fontSize: 14, color: descriptionColor, letterSpacing: -0.1, lineHeight: 20 }}
                    >
                      Module
                    </Text>
                    <View className="flex-row items-center">
                      <EyeIcon color="#FF6551" size={16} />
                      <Text
                        className="font-inter font-normal ml-1"
                        style={{ fontSize: 14, color: descriptionColor, letterSpacing: -0.1, lineHeight: 20 }}
                      >
                        {item.module}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="font-inter font-normal"
                      style={{ fontSize: 14, color: descriptionColor, letterSpacing: -0.1, lineHeight: 20 }}
                    >
                      Due date
                    </Text>
                    <Text
                      className="font-inter font-normal"
                      style={{ fontSize: 14, color: descriptionColor, letterSpacing: -0.1, lineHeight: 20 }}
                    >
                      {item.dueDate}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="font-inter font-normal"
                      style={{ fontSize: 14, color: descriptionColor, letterSpacing: -0.1, lineHeight: 20 }}
                    >
                      Fill form date
                    </Text>
                    <Text
                      className="font-inter font-normal"
                      style={{ fontSize: 14, color: descriptionColor, letterSpacing: -0.1, lineHeight: 20 }}
                    >
                      {item.fillFormDate}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text
                      className="font-inter font-normal"
                      style={{ fontSize: 14, color: descriptionColor, letterSpacing: -0.1, lineHeight: 20 }}
                    >
                      Created by
                    </Text>
                    <Text
                      className="font-inter font-normal"
                      style={{ fontSize: 14, color: descriptionColor, letterSpacing: -0.1, lineHeight: 20 }}
                    >
                      {item.createdBy}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      )}
      
      <AnnualLeaveCalendarModal
        visible={showAnnualLeave}
        onClose={() => setShowAnnualLeave(false)}
        onSave={() => setShowAnnualLeave(false)}
      />
    </View>
  );
};

export default FormsListScreen;
