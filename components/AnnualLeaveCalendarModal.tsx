import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TouchableWithoutFeedback, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentUser, getUserAnnualLeave, saveAnnualLeave, type AnnualLeave } from '../lib/supabase';

// Types for range
export type DateRange = {
  start: string | null;
  end: string | null;
};

type AnnualLeaveCalendarModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (range: DateRange) => void;
  initialRange?: DateRange;
};

// Type for the day object passed to onDayPress
interface CalendarDay {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
}

// Type for markedDates
interface MarkedDates {
  [date: string]: {
    startingDay?: boolean;
    endingDay?: boolean;
    color?: string;
    textColor?: string;
    marked?: boolean;
    dotColor?: string;
  };
}

const getMarkedDates = (range: DateRange, existingLeave: AnnualLeave[]): MarkedDates => {
  const marked: MarkedDates = {};
  
  // Mark existing annual leave dates
  existingLeave.forEach(leave => {
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    let current = new Date(start);
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      marked[dateStr] = {
        color: '#10B981', // Green for existing leave
        textColor: '#fff',
        startingDay: dateStr === leave.start_date,
        endingDay: dateStr === leave.end_date,
      };
      current.setDate(current.getDate() + 1);
    }
  });
  
  // Mark new selection (override existing if overlapping)
  if (range.start) {
    if (!range.end || range.start === range.end) {
      marked[range.start] = {
        startingDay: true,
        endingDay: true,
        color: '#FF6B57', // Orange for new selection
        textColor: '#fff',
      };
    } else {
      // Range selection
      const start = new Date(range.start);
      const end = new Date(range.end);
      let current = new Date(start);
      
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        marked[dateStr] = {
          color: '#FF6B57', // Orange for new selection
          textColor: '#fff',
          startingDay: dateStr === range.start,
          endingDay: dateStr === range.end,
        };
        current.setDate(current.getDate() + 1);
      }
    }
  }
  
  return marked;
};

const AnnualLeaveCalendarModal: React.FC<AnnualLeaveCalendarModalProps> = ({
  visible,
  onClose,
  onSave,
  initialRange = { start: null, end: null },
}) => {
  const [range, setRange] = useState<DateRange>(initialRange);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [saving, setSaving] = useState(false);
  const [existingLeave, setExistingLeave] = useState<AnnualLeave[]>([]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  // Fetch existing annual leave when modal opens
  useEffect(() => {
    const fetchExistingLeave = async () => {
      if (!visible) return;
      
      setLoading(true);
      try {
        const { user, error: userError } = await getCurrentUser();
        if (userError || !user) {
          console.error('Error getting current user:', userError);
          return;
        }

        const { data: leave, error: leaveError } = await getUserAnnualLeave(user.id);
        if (leaveError) {
          console.error('Error fetching annual leave:', leaveError);
          return;
        }

        setExistingLeave(leave || []);
      } catch (error) {
        console.error('Error fetching existing leave:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingLeave();
  }, [visible]);

  const handleDayPress = (day: CalendarDay) => {
    if (!range.start || (range.start && range.end)) {
      setRange({ start: day.dateString, end: null });
      setSelecting('end');
      return;
    }
    if (selecting === 'end') {
      if (day.dateString < range.start) {
        setRange({ start: day.dateString, end: range.start });
      } else {
        setRange({ start: range.start, end: day.dateString });
      }
      setSelecting('start');
    }
  };

  const handleSave = async () => {
    if (!range.start) {
      Alert.alert('Error', 'Please select at least a start date for your annual leave');
      return;
    }

    setSaving(true);
    try {
      // Get current user
      const { user, error: userError } = await getCurrentUser();
      if (userError || !user) {
        Alert.alert('Error', 'Unable to get current user information');
        return;
      }

      // Save annual leave to database
      const { error: saveError } = await saveAnnualLeave(
        user.id,
        range.start,
        range.end || range.start, // If no end date, use start date
        'Annual leave'
      );

      if (saveError) {
        Alert.alert('Error', 'Failed to save annual leave: ' + saveError.message);
        return;
      }

      // Show success message
      Alert.alert(
        'Success',
        `Annual leave saved successfully from ${range.start} to ${range.end || range.start}`,
        [
          {
            text: 'OK',
            onPress: async () => {
              // Refresh existing leave data
              const { data: updatedLeave } = await getUserAnnualLeave(user.id);
              setExistingLeave(updatedLeave || []);
              
              onSave(range);
              handleClose();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error saving annual leave:', error);
      Alert.alert('Error', 'An unexpected error occurred while saving annual leave');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setRange(initialRange);
    setSelecting('start');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      onDismiss={handleClose}
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={handleClose} accessible={false}>
          <View className="flex-1 bg-black/40 justify-end">
            <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
              <View
                className="bg-white rounded-t-3xl shadow-lg px-6 w-full"
                style={{ 
                  paddingBottom: Math.max(insets.bottom + 16, 24),
                  paddingTop: 24,
                  maxHeight: '80%', // Prevent taking up entire screen
                  minHeight: 400    // Ensure minimum space for calendar
                }}
              >
                {/* Header */}
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-semibold text-gray-900" accessibilityRole="header">
                    Set Annual Leave
                  </Text>
                  <Pressable
                    onPress={handleClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close calendar modal"
                    className="p-2 rounded-full"
                    hitSlop={12}
                  >
                    <Feather name="x" size={24} color="#6B7280" accessibilityIgnoresInvertColors />
                  </Pressable>
                </View>

                {/* Legend */}
                <View className="flex-row justify-center items-center gap-4 mb-3">
                  <View className="flex-row items-center">
                    <View className="w-4 h-4 rounded bg-[#10B981] mr-2" />
                    <Text className="text-xs text-gray-600">Existing Leave</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-4 h-4 rounded bg-[#FF6B57] mr-2" />
                    <Text className="text-xs text-gray-600">New Selection</Text>
                  </View>
                </View>

                {/* Instructions */}
                <Text className="text-sm text-gray-600 mb-4 text-center">
                  {!range.start 
                    ? 'Select start date for your annual leave'
                    : !range.end 
                    ? 'Select end date for your annual leave (or save with just start date)'
                    : `Selected: ${range.start} to ${range.end}`
                  }
                </Text>

                {loading ? (
                  <View className="flex-1 justify-center items-center py-20">
                    <ActivityIndicator size="large" color="#FF6551" />
                    <Text className="mt-2 text-gray-600">Loading existing leave...</Text>
                  </View>
                ) : (
                  /* Calendar */
                  <Calendar
                    current={range.start || undefined}
                    markingType="period"
                    markedDates={getMarkedDates(range, existingLeave)}
                    onDayPress={handleDayPress}
                    enableSwipeMonths
                    theme={{
                      todayTextColor: '#FF6551',
                      arrowColor: '#FF6551',
                      textDayFontWeight: '500',
                      textMonthFontWeight: '700',
                      textDayHeaderFontWeight: '600',
                      backgroundColor: 'transparent',
                      calendarBackground: 'transparent',
                    }}
                    style={{ borderRadius: 16 }}
                    renderArrow={dir => (
                      <Feather 
                        name={dir === 'left' ? 'chevron-left' : 'chevron-right'} 
                        size={20} 
                        color="#FF6551" 
                      />
                    )}
                  />
                )}

                {/* Save button */}
                <Pressable
                  onPress={handleSave}
                  className={`mt-6 rounded-full py-4 items-center ${
                    range.start && !saving ? 'bg-[#FF6551]' : 'bg-gray-300'
                  }`}
                  disabled={!range.start || saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className={`text-base font-semibold ${
                      range.start ? 'text-white' : 'text-gray-500'
                    }`}>
                      {range.start && range.end ? 'Save Leave Dates' : 'Save Annual Leave'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AnnualLeaveCalendarModal; 