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

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (urlError) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`)
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)



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



    if (!assignments || assignments.length === 0) {

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
      


      return {
        ...assignment,
        profiles: creator // This will be the form creator profile
      };
    });


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

 

 

 