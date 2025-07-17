import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// Get Supabase URL and Key from environment variables
// Check for both Expo and Next.js environment variable formats
const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 
                       process.env.NEXT_PUBLIC_SUPABASE_URL || 
                       Constants.expoConfig?.extra?.SUPABASE_URL

const rawSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                           process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                           Constants.expoConfig?.extra?.SUPABASE_ANON_KEY

// Clean and validate URL
const supabaseUrl = rawSupabaseUrl?.trim()
const supabaseAnonKey = rawSupabaseAnonKey?.trim()

// Debug logging
console.log('🔍 Supabase Environment Check:')
console.log('📍 URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('🔑 Key:', supabaseAnonKey ? 'Found' : 'Missing')
console.log('🌐 Raw URL:', rawSupabaseUrl)
console.log('🌐 Clean URL:', supabaseUrl)
console.log('🗝️ Key Preview:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'N/A')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  throw new Error('Missing Supabase environment variables')
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (urlError) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl)
  console.error('❌ URL Error:', urlError)
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`)
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('✅ Supabase client created successfully')

// Test basic connectivity function
export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing basic Supabase connectivity...')
    
    // Test 1: Basic health check
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('🌐 Network Response Status:', response.status)
    console.log('🌐 Network Response OK:', response.ok)
    
    if (!response.ok) {
      console.error('❌ Network response not OK:', response.statusText)
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }
    
    // Test 2: Try a simple Supabase query
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    console.log('📊 Query Result:', { data, error })
    
    if (error) {
      console.error('❌ Query error:', error)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Connection test successful!')
    return { success: true, data }
    
  } catch (error) {
    console.error('💥 Connection test failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Database type definitions matching the actual schema
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          avatar_url: string | null
          role: 'admin' | 'employee' | null
          status: 'active' | 'inactive' | null
          invited_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'employee' | null
          status?: 'active' | 'inactive' | null
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'employee' | null
          status?: 'active' | 'inactive' | null
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      forms: {
        Row: {
          id: string
          title: string
          description: string | null
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
          settings: Json | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
          settings?: Json | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
          settings?: Json | null
          metadata?: Json | null
        }
      }
      form_assignments: {
        Row: {
          id: string
          form_id: string
          employee_id: string
          assigned_by: string
          status: 'pending' | 'in_progress' | 'completed' | 'overdue'
          due_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          form_id: string
          employee_id: string
          assigned_by: string
          status?: 'pending' | 'in_progress' | 'completed' | 'overdue'
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          employee_id?: string
          assigned_by?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'overdue'
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      form_questions: {
        Row: {
          id: string
          form_id: string
          question_text: string
          question_type: 'text' | 'multiple_choice' | 'rating' | 'date' | 'boolean' | 'composite'
          is_required: boolean
          options: Json | null
          validation_rules: Json | null
          sub_questions: Json | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          form_id: string
          question_text: string
          question_type: 'text' | 'multiple_choice' | 'rating' | 'date' | 'boolean' | 'composite'
          is_required?: boolean
          options?: Json | null
          validation_rules?: Json | null
          sub_questions?: Json | null
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          form_id?: string
          question_text?: string
          question_type?: 'text' | 'multiple_choice' | 'rating' | 'date' | 'boolean' | 'composite'
          is_required?: boolean
          options?: Json | null
          validation_rules?: Json | null
          sub_questions?: Json | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      form_responses: {
        Row: {
          id: string
          form_id: string
          respondent_id: string
          status: 'draft' | 'submitted'
          started_at: string | null
          submitted_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          form_id: string
          respondent_id: string
          status?: 'draft' | 'submitted'
          started_at?: string | null
          submitted_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          form_id?: string
          respondent_id?: string
          status?: 'draft' | 'submitted'
          started_at?: string | null
          submitted_at?: string | null
          metadata?: Json | null
        }
      }
      form_response_answers: {
        Row: {
          id: string
          response_id: string
          question_id: string
          answer: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          response_id: string
          question_id: string
          answer: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          response_id?: string
          question_id?: string
          answer?: Json
          created_at?: string
          updated_at?: string
        }
      }
      annual_leave: {
        Row: {
          id: string
          employee_id: string
          start_date: string
          end_date: string
          status: 'pending' | 'approved' | 'rejected'
          reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          start_date: string
          end_date: string
          status?: 'pending' | 'approved' | 'rejected'
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          start_date?: string
          end_date?: string
          status?: 'pending' | 'approved' | 'rejected'
          reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Type aliases for convenience
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Form = Database['public']['Tables']['forms']['Row']
export type FormAssignment = Database['public']['Tables']['form_assignments']['Row']
export type FormQuestion = Database['public']['Tables']['form_questions']['Row']
export type FormResponse = Database['public']['Tables']['form_responses']['Row']
export type FormResponseAnswer = Database['public']['Tables']['form_response_answers']['Row']
export type AnnualLeave = Database['public']['Tables']['annual_leave']['Row']

// Combined types for dashboard
export type AssignedForm = FormAssignment & {
  forms: Form & {
    form_questions: FormQuestion[]
  }
  profiles: Profile
}

export type QuestionType = 'text' | 'multiple_choice' | 'rating' | 'date' | 'boolean' | 'composite'

// Type aliases for convenience (app-specific)
export type FormInsert = Database['public']['Tables']['forms']['Insert']
export type FormUpdate = Database['public']['Tables']['forms']['Update']

// Dashboard data fetching functions
export const fetchAssignedForms = async (userId: string) => {
  try {
    console.log('🔍 Fetching assigned forms for user:', userId);
    
    // Step 1: Fetch form assignments with forms and questions (without problematic foreign key)
    const { data: assignments, error: assignmentError } = await supabase
      .from('form_assignments')
      .select(`
        *,
        forms (
          *,
          form_questions (*)
        )
      `)
      .eq('employee_id', userId)
      .order('created_at', { ascending: false });

    if (assignmentError) {
      console.error('❌ Error fetching assigned forms:', assignmentError);
      return { data: null, error: assignmentError };
    }

    console.log('✅ Successfully fetched form assignments:', assignments?.length || 0);
    console.log('📊 Sample assignment:', assignments?.[0]);

    if (!assignments || assignments.length === 0) {
      console.log('ℹ️ No form assignments found for user');
      return { data: [], error: null };
    }

    // Step 2: Get unique creator IDs for batch fetching
    const activeAssignments = assignments.filter(assignment => assignment.forms && assignment.forms.is_active);
    const creatorIds = [...new Set(activeAssignments.map(assignment => assignment.forms?.created_by).filter(Boolean))];

    // Step 3: Fetch creator profiles in batch
    let creatorProfiles: Record<string, any> = {};
    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', creatorIds);
      
      if (profiles) {
        creatorProfiles = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Step 4: Process and combine data, handling creator profiles
    const combinedData = activeAssignments.map(assignment => {
      // Get creator from the fetched profiles
      const creatorId = assignment.forms?.created_by;
      const creator = creatorId ? creatorProfiles[creatorId] : null;
      
      console.log('🔍 Processing assignment:', {
        formTitle: assignment.forms?.title,
        createdBy: creatorId,
        creatorProfile: creator,
        creatorName: creator ? `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || creator.email || 'Unknown' : 'No creator found'
      });

      return {
        ...assignment,
        profiles: creator // This will be the form creator profile
      };
    });

    console.log('📋 FINAL CREATOR DEBUG - Combined data summary:');
    combinedData.forEach((item, index) => {
      console.log(`📝 Form ${index + 1}: "${item.forms?.title}" created by ${item.profiles ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim() || item.profiles.email || 'Unknown' : 'Unknown'}`);
    });

    console.log('🎯 Final filtered data:', combinedData.length, 'active forms');
    return { data: combinedData as AssignedForm[], error: null };

  } catch (error) {
    console.error('💥 Unexpected error fetching assigned forms:', error);
    return { 
      data: null, 
      error: { message: error instanceof Error ? error.message : 'Unknown error' } 
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Error getting current user:', error);
      return { user: null, error };
    }

    if (!user) {
      console.log('ℹ️ No authenticated user found');
      return { user: null, error: null };
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError);
      return { user: null, error: profileError };
    }

    console.log('✅ Current user:', profile);
    return { user: profile, error: null };
  } catch (error) {
    console.error('💥 Unexpected error getting current user:', error);
    return { 
      user: null, 
      error: { message: error instanceof Error ? error.message : 'Unknown error' } 
    };
  }
};

// Utility function to format dates
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'No date';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Utility function to calculate time remaining (considering annual leave)
export const calculateTimeRemaining = async (dueDate: string | null, userId?: string): Promise<string> => {
  if (!dueDate) return 'No due date';
  
  try {
    const due = new Date(dueDate);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    
    // Check if user is on annual leave during due date
    if (userId && diffMs < 0) {
      const isOnLeave = await checkUserOnLeave(userId, due.toISOString().split('T')[0]);
      if (isOnLeave) {
        return 'On Leave';
      }
    }
    
    if (diffMs < 0) return 'Overdue';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h ${diffMinutes}m`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  } catch (error) {
    console.error('Error calculating time remaining:', error);
    return 'Invalid date';
  }
};

// Function to check if user is on annual leave for a specific date
export const checkUserOnLeave = async (userId: string, checkDate: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('annual_leave')
      .select('id')
      .eq('employee_id', userId)
      .eq('status', 'approved')
      .lte('start_date', checkDate)
      .gte('end_date', checkDate)
      .limit(1);

    if (error) {
      console.error('Error checking annual leave:', error);
      return false;
    }

    return (data && data.length > 0);
  } catch (error) {
    console.error('Error in checkUserOnLeave:', error);
    return false;
  }
};

// Function to save annual leave
export const saveAnnualLeave = async (userId: string, startDate: string, endDate: string, reason?: string) => {
  try {
    const { data, error } = await supabase
      .from('annual_leave')
      .insert({
        employee_id: userId,
        start_date: startDate,
        end_date: endDate,
        status: 'approved', // Auto-approve for now, can be changed to 'pending'
        reason: reason || null
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error saving annual leave:', error);
      return { data: null, error };
    }

    console.log('✅ Annual leave saved successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('💥 Unexpected error saving annual leave:', error);
    return { 
      data: null, 
      error: { message: error instanceof Error ? error.message : 'Unknown error' } 
    };
  }
};

// Function to get user's annual leave records
export const getUserAnnualLeave = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('annual_leave')
      .select('*')
      .eq('employee_id', userId)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching annual leave:', error);
      return { data: null, error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('💥 Unexpected error fetching annual leave:', error);
    return { 
      data: null, 
      error: { message: error instanceof Error ? error.message : 'Unknown error' } 
    };
  }
};

// Function to fetch form responses for completed forms
export const fetchFormResponse = async (formId: string, respondentId: string) => {
  try {
    console.log('🔍 Fetching form response for form:', formId, 'respondent:', respondentId);
    
    // Fetch the form response
    const { data: response, error: responseError } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', formId)
      .eq('respondent_id', respondentId)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    if (responseError) {
      console.error('❌ Error fetching form response:', responseError);
      return { data: null, error: responseError };
    }

    if (!response) {
      console.log('ℹ️ No form response found');
      return { data: null, error: null };
    }

    console.log('✅ Form response found:', response.id);

    // Fetch the answers for this response
    const { data: answers, error: answersError } = await supabase
      .from('form_response_answers')
      .select('*')
      .eq('response_id', response.id);

    if (answersError) {
      console.error('❌ Error fetching form answers:', answersError);
      return { data: null, error: answersError };
    }

    console.log('✅ Form answers found:', answers?.length || 0);

    return { 
      data: {
        response,
        answers: answers || []
      }, 
      error: null 
    };
  } catch (error) {
    console.error('💥 Unexpected error fetching form response:', error);
    return { 
      data: null, 
      error: { message: error instanceof Error ? error.message : 'Unknown error' } 
    };
  }
};

// Function to fetch teammates assigned to the same form
export const fetchFormTeammates = async (formId: string, currentUserId: string) => {
  try {
    console.log('👥 Fetching teammates for form:', formId, 'excluding user:', currentUserId);
    
    // First check if the current user exists
    const { data: currentUserCheck, error: userCheckError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', currentUserId)
      .single();

    if (userCheckError) {
      console.error('❌ Error checking current user:', userCheckError);
      return { data: null, error: { message: `Failed to verify current user: ${userCheckError.message}` } };
    }

    if (!currentUserCheck) {
      console.error('❌ Current user not found in profiles');
      return { data: null, error: { message: 'Current user profile not found' } };
    }

    console.log('✅ Current user verified:', currentUserCheck.email);

    // ENHANCED DEBUGGING: First, let's see ALL assignments for this form (regardless of user or status)
    console.log('🔍 STEP 1: Fetching ALL assignments for form:', formId);
    const { data: allAssignments, error: allAssignmentsError } = await supabase
      .from('form_assignments')
      .select('*')
      .eq('form_id', formId);

    if (allAssignmentsError) {
      console.error('❌ Error fetching all assignments for debugging:', allAssignmentsError);
      return { data: null, error: allAssignmentsError };
    } else {
      console.log('🔍 DEBUG - ALL assignments for form:', formId);
      console.log('📊 Total assignments found:', allAssignments?.length || 0);
      allAssignments?.forEach((assignment, index) => {
        console.log(`📝 Assignment ${index + 1}:`, {
          id: assignment.id,
          employee_id: assignment.employee_id,
          status: assignment.status,
          assigned_by: assignment.assigned_by,
          is_current_user: assignment.employee_id === currentUserId
        });
      });
    }

    // STEP 2: Fetch assignments excluding current user
    console.log('🔍 STEP 2: Fetching assignments excluding current user:', currentUserId);
    const { data: assignments, error: assignmentError } = await supabase
      .from('form_assignments')
      .select('*')
      .eq('form_id', formId)
      .neq('employee_id', currentUserId);

    if (assignmentError) {
      console.error('❌ Error fetching form assignments:', assignmentError);
      return { data: null, error: assignmentError };
    }

    console.log('✅ Successfully fetched teammate assignments (all statuses):', assignments?.length || 0);
    console.log('📋 Raw teammate assignments:', assignments);

    if (!assignments || assignments.length === 0) {
      console.log('ℹ️ No other teammate assignments found');
      console.log('💡 This could mean:');
      console.log('   - Only 1 person assigned to this form');
      console.log('   - Form assignments not set up correctly');
      console.log('   - RLS policies blocking access to other assignments');
      return { data: [], error: null };
    }

    // Show status breakdown for debugging
    const statusBreakdown = assignments.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    console.log('📊 Status breakdown of teammate assignments:', statusBreakdown);

    // STEP 3: Filter for available statuses
    console.log('🔍 STEP 3: Filtering for available statuses...');
    const availableAssignments = assignments.filter(a => 
      a.status === 'pending' || a.status === 'in_progress' || a.status === 'assigned'
    );

    console.log('🎯 Available teammate assignments after status filter:', availableAssignments.length);
    console.log('🔍 Available assignment details:', availableAssignments.map(a => ({
      employee_id: a.employee_id,
      status: a.status,
      id: a.id
    })));

    if (availableAssignments.length === 0) {
      console.log('ℹ️ No available teammates after status filtering');
      console.log('💡 Reason: All teammates have status that excludes them from selection');
      console.log('📝 Current status filter: pending, in_progress, assigned');
      console.log('📝 Actual statuses found:', Object.keys(statusBreakdown));
      
      // FALLBACK: Return ALL teammates regardless of status for debugging
      console.log('🚨 FALLBACK: Returning ALL teammates regardless of status for debugging');
      const allTeammates = assignments.map(assignment => ({
        userId: assignment.employee_id,
        assignmentId: assignment.id,
        profile: null, // We'll fetch these below
        status: assignment.status,
        dueDate: assignment.due_date
      }));
      
      // Fetch profiles for all teammates
      const allEmployeeIds = assignments.map(a => a.employee_id);
      console.log('👥 Fetching profiles for ALL employees:', allEmployeeIds);
      
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', allEmployeeIds);
      
      if (profilesError) {
        console.error('❌ Error fetching ALL profiles:', profilesError);
      } else {
        console.log('✅ Fetched profiles for ALL teammates:', allProfiles?.length || 0);
        console.log('👥 Profile details:', allProfiles?.map(p => ({
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          email: p.email
        })));
      }
      
      const allProfilesMap = allProfiles?.reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as { [key: string]: any }) || {};
      
      const finalAllTeammates = allTeammates.map(t => ({
        ...t,
        profile: allProfilesMap[t.userId] || null
      }));
      
      console.log('📊 ALL teammates (debug) final result:', finalAllTeammates.map(t => ({ 
        userId: t.userId, 
        profile_email: t.profile?.email,
        profile_name: t.profile ? `${t.profile.first_name || ''} ${t.profile.last_name || ''}`.trim() : 'Unknown',
        status: t.status 
      })));
      
      return { data: finalAllTeammates, error: null };
    }

    // Extract unique employee IDs
    const employeeIds = availableAssignments.map(a => a.employee_id);
    console.log('👥 Fetching profiles for employee IDs:', employeeIds);

    // Fetch profiles separately
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .in('id', employeeIds);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return { data: null, error: profilesError };
    }

    console.log('✅ Successfully fetched profiles:', profiles?.length || 0);

    // Create a map of profile data by ID for efficient lookup
    const profilesMap = profiles?.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as { [key: string]: any }) || {};

    // Combine assignment and profile data
    const teammates = availableAssignments.map(assignment => ({
      userId: assignment.employee_id,
      assignmentId: assignment.id,
      profile: profilesMap[assignment.employee_id] || null,
      status: assignment.status,
      dueDate: assignment.due_date
    }));

    console.log('📊 Final teammates data:', teammates.map(t => ({ 
      userId: t.userId, 
      profile_email: t.profile?.email,
      profile_name: t.profile ? `${t.profile.first_name || ''} ${t.profile.last_name || ''}`.trim() : 'Unknown',
      status: t.status 
    })));

    return { data: teammates, error: null };
  } catch (error) {
    console.error('💥 Unexpected error fetching teammates:', error);
    return { 
      data: null, 
      error: { message: error instanceof Error ? error.message : 'Unknown error' } 
    };
  }
};

// Type for teammate data
export type FormTeammate = {
  userId: string;
  assignmentId: string;
  profile: Profile | null;
  status: string;
  dueDate: string | null;
};

// Debug function for form creator and teammate issues
export const debugFormIssues = async (formTitle: string = 'Vercel test') => {
  try {
    console.log('🔍 DEBUG: Starting form issues diagnosis for:', formTitle);
    
    // 1. Find the form by title
    const { data: forms, error: formsError } = await supabase
      .from('forms')
      .select('*')
      .ilike('title', `%${formTitle}%`);
    
    if (formsError) {
      console.error('❌ Error finding forms:', formsError);
      return;
    }
    
    console.log('📋 Found forms:', forms?.map(f => ({ id: f.id, title: f.title, created_by: f.created_by })));
    
    if (!forms || forms.length === 0) {
      console.log('❌ No forms found with title containing:', formTitle);
      return;
    }
    
    const targetForm = forms[0];
    console.log('🎯 Using form:', targetForm);
    
    // 2. Check creator profile
    if (targetForm.created_by) {
      const { data: creator, error: creatorError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetForm.created_by)
        .single();
      
      if (creatorError) {
        console.error('❌ Creator profile error:', creatorError);
      } else {
        console.log('✅ Creator found:', {
          id: creator.id,
          name: `${creator.first_name || ''} ${creator.last_name || ''}`.trim(),
          email: creator.email
        });
      }
    } else {
      console.log('⚠️ Form has no created_by field');
    }
    
    // 3. Check all assignments for this form
    const { data: assignments, error: assignmentsError } = await supabase
      .from('form_assignments')
      .select('*')
      .eq('form_id', targetForm.id);
    
    if (assignmentsError) {
      console.error('❌ Assignments error:', assignmentsError);
      return;
    }
    
    console.log('📊 Form assignments:', assignments?.map(a => ({
      id: a.id,
      employee_id: a.employee_id,
      status: a.status,
      assigned_by: a.assigned_by
    })));
    
    // 4. Get profiles for all assigned users
    if (assignments && assignments.length > 0) {
      const userIds = assignments.map(a => a.employee_id);
      const { data: userProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      if (profilesError) {
        console.error('❌ User profiles error:', profilesError);
      } else {
        console.log('👥 Assigned user profiles:', userProfiles?.map(p => ({
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          email: p.email
        })));
      }
    }
    
    console.log('✅ DEBUG: Form issues diagnosis complete');
    
  } catch (error) {
    console.error('💥 Debug function error:', error);
  }
}; 

// Debug function to test RLS permissions
export const debugRLSPermissions = async () => {
  try {
    console.log('🔐 DEBUG: Testing RLS permissions...');
    
    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Current user:', user?.id, user?.email);
    
    // 2. Try to fetch current user's profile
    console.log('🔍 Testing: Current user profile access...');
    const { data: ownProfile, error: ownError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    
    if (ownError) {
      console.error('❌ Cannot access own profile:', ownError);
    } else {
      console.log('✅ Own profile accessible:', {
        id: ownProfile.id,
        name: `${ownProfile.first_name} ${ownProfile.last_name}`,
        email: ownProfile.email
      });
    }
    
    // 3. Try to fetch ALL profiles
    console.log('🔍 Testing: All profiles access...');
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email');
    
    if (allError) {
      console.error('❌ Cannot access all profiles:', allError);
    } else {
      console.log('✅ All profiles accessible count:', allProfiles?.length);
      console.log('📊 All profiles:', allProfiles?.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        email: p.email
      })));
    }
    
    // 4. Try to fetch specific profile by ID
    const testUserId = '4ebc5e80-2b78-46bd-8a95-3d1e3c6a2f4e'; // Replace with a known user ID
    console.log('🔍 Testing: Specific profile access for ID:', testUserId);
    const { data: specificProfile, error: specificError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .single();
    
    if (specificError) {
      console.error('❌ Cannot access specific profile:', specificError);
    } else {
      console.log('✅ Specific profile accessible:', specificProfile);
    }
    
    // 5. Check form assignments RLS
    console.log('🔍 Testing: Form assignments access...');
    const { data: assignments, error: assignError } = await supabase
      .from('form_assignments')
      .select('*');
    
    if (assignError) {
      console.error('❌ Cannot access form assignments:', assignError);
    } else {
      console.log('✅ Form assignments accessible count:', assignments?.length);
      console.log('📊 Unique employee IDs in assignments:', [...new Set(assignments?.map(a => a.employee_id))]);
    }
    
    console.log('✅ RLS permissions debug complete');
    
  } catch (error) {
    console.error('💥 RLS debug error:', error);
  }
}; 

// Function to diagnose metadata vs assignments mismatch
export const diagnoseAssignmentMismatch = async (formId: string) => {
  try {
    console.log('🔍 ASSIGNMENT MISMATCH DIAGNOSIS for form:', formId);
    
    // 1. Get form metadata
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();

    if (formError) {
      console.error('❌ Error fetching form:', formError);
      return { error: formError };
    }

    console.log('📊 Form metadata:', form?.metadata);
    const metadataUsers = form?.metadata?.assigned_employees || [];
    console.log('👥 Users in metadata:', metadataUsers);

    // 2. Get actual assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('form_assignments')
      .select('*')
      .eq('form_id', formId);

    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError);
      return { error: assignmentsError };
    }

    const assignmentUsers = assignments?.map(a => a.employee_id) || [];
    console.log('📝 Users with actual assignments:', assignmentUsers);

    // 3. Find mismatches
    const missingAssignments = metadataUsers.filter((userId: string) => !assignmentUsers.includes(userId));
    const extraAssignments = assignmentUsers.filter(userId => !metadataUsers.includes(userId));

    console.log('❌ Missing assignments for users:', missingAssignments);
    console.log('❓ Extra assignments for users:', extraAssignments);

    return {
      form,
      metadataUsers,
      assignmentUsers,
      missingAssignments,
      extraAssignments,
      error: null
    };

  } catch (error) {
    console.error('💥 Error diagnosing assignment mismatch:', error);
    return { error: { message: error instanceof Error ? error.message : 'Unknown error' } };
  }
};

// Function to fix assignment mismatch using service role (bypass RLS)
export const fixAssignmentMismatch = async (formId: string, adminUserId: string) => {
  try {
    console.log('🔧 FIXING ASSIGNMENT MISMATCH for form:', formId);
    
    const diagnosis = await diagnoseAssignmentMismatch(formId);
    if (diagnosis.error || !diagnosis.missingAssignments?.length) {
      console.log('ℹ️ No missing assignments to fix');
      return diagnosis;
    }

    console.log('⚠️ WARNING: This fix requires admin privileges to create assignment records.');
    console.log('📋 Missing assignments for users:', diagnosis.missingAssignments);

    // For now, let's create a detailed report for the admin to manually fix
    const fixReport = {
      formId,
      formTitle: diagnosis.form?.title,
      missingAssignments: diagnosis.missingAssignments,
      metadataUsers: diagnosis.metadataUsers,
      assignmentUsers: diagnosis.assignmentUsers,
      instructions: `To fix this manually:
1. Log into Supabase dashboard
2. Go to Table Editor > form_assignments
3. Create new records for missing users: ${diagnosis.missingAssignments?.join(', ')}
4. Use these values:
   - form_id: ${formId}
   - employee_id: [missing user ID]
   - assigned_by: ${diagnosis.form?.created_by}
   - status: 'pending'
   - due_date: ${diagnosis.form?.settings?.due_date || 'NULL'}
   - created_at: NOW()
   - updated_at: NOW()`
    };

    console.log('📋 FIX REPORT:', fixReport);

    return {
      ...diagnosis,
      fixReport,
      needsManualFix: true,
      error: null
    };

  } catch (error) {
    console.error('💥 Error preparing assignment fix:', error);
    return { error: { message: error instanceof Error ? error.message : 'Unknown error' } };
  }
};

// Function to create a simpler admin fix SQL
export const generateFixSQL = async (formId: string) => {
  try {
    const diagnosis = await diagnoseAssignmentMismatch(formId);
    if (diagnosis.error || !diagnosis.missingAssignments?.length) {
      return { sql: null, message: 'No missing assignments found' };
    }

    const missingUsers = diagnosis.missingAssignments;
    const form = diagnosis.form;

    const sqlStatements = missingUsers?.map((userId: string) => `
INSERT INTO form_assignments (
  form_id,
  employee_id,
  assigned_by,
  status,
  due_date,
  created_at,
  updated_at
) VALUES (
  '${formId}',
  '${userId}',
  '${form?.created_by}',
  'pending',
  ${form?.settings?.due_date ? `'${form.settings.due_date}'` : 'NULL'},
  NOW(),
  NOW()
);`).join('\n');

    return {
      sql: sqlStatements,
      message: `SQL to fix ${missingUsers?.length} missing assignments`,
      missingUsers
    };

  } catch (error) {
    return { 
      sql: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}; 

// Function to verify current assignment state after fix
export const verifyAssignmentFix = async (formId: string) => {
  try {
    console.log('🔍 VERIFYING ASSIGNMENT FIX for form:', formId);

    // 1. Get form metadata
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();

    if (formError) {
      console.error('❌ Error fetching form:', formError);
      return { error: formError };
    }

    const metadataUsers = form?.metadata?.assigned_employees || [];
    console.log('👥 Form metadata users:', metadataUsers);

    // 2. Get actual assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('form_assignments')
      .select('*')
      .eq('form_id', formId);

    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError);
      return { error: assignmentsError };
    }

    console.log('📝 Current assignments count:', assignments?.length);
    console.log('📋 Assignment details:', assignments?.map(a => ({
      employee_id: a.employee_id,
      status: a.status,
      assigned_by: a.assigned_by,
      created_at: a.created_at
    })));

    const assignmentUsers = assignments?.map(a => a.employee_id) || [];
    console.log('👤 Users with assignments:', assignmentUsers);

    // 3. Check if fix worked
    const stillMissing = metadataUsers.filter((userId: string) => !assignmentUsers.includes(userId));
    const extraAssignments = assignmentUsers.filter(userId => !metadataUsers.includes(userId));

    console.log('❌ Still missing assignments:', stillMissing);
    console.log('❓ Extra assignments:', extraAssignments);

    // 4. Test teammates fetch
    const { user } = await getCurrentUser();
    if (user) {
      console.log('👥 Testing teammates fetch for current user:', user.id);
      const { data: teammates, error: teammatesError } = await fetchFormTeammates(formId, user.id);
      
      if (teammatesError) {
        console.error('❌ Teammates fetch error:', teammatesError);
      } else {
        console.log('✅ Teammates found:', teammates?.length || 0);
        console.log('📊 Teammates details:', teammates?.map(t => ({
          userId: t.userId,
          email: t.profile?.email,
          status: t.status
        })));
      }
    }

    return {
      form,
      metadataUsers,
      assignmentUsers,
      stillMissing,
      extraAssignments,
      assignments,
      fixWorked: stillMissing.length === 0,
      error: null
    };

  } catch (error) {
    console.error('💥 Error verifying fix:', error);
    return { error: { message: error instanceof Error ? error.message : 'Unknown error' } };
  }
}; 