import { Session, User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Profile, supabase } from '../lib/supabase';

export type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isFirstTimeLogin: boolean;
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    isFirstTimeLogin: false,
  });

  const checkIfFirstTimeLogin = async (user: User): Promise<boolean> => {
    try {
      // Check if user has ever logged in before by looking at their profile's updated_at
      // and comparing it to their auth created_at
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('created_at, updated_at, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking first-time login:', error);
        return false;
      }

      if (!profile) {
        return true; // No profile exists, definitely first time
      }

      // Check if profile has minimal information (indicating first time)
      const hasMinimalInfo = !profile.first_name && !profile.last_name;
      
      // Check if created_at and updated_at are very close (indicating no updates since creation)
      const createdAt = new Date(profile.created_at);
      const updatedAt = new Date(profile.updated_at);
      const timeDiffMinutes = Math.abs(updatedAt.getTime() - createdAt.getTime()) / (1000 * 60);
      
      // Consider it first time if profile has minimal info OR was created very recently (within 5 minutes)
      return hasMinimalInfo || timeDiffMinutes < 5;
    } catch (error) {
      console.error('Error in checkIfFirstTimeLogin:', error);
      return false;
    }
  };

  const loadUserProfile = async (user: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      return null;
    }
  };

  const updateAuthState = async (session: Session | null) => {
    if (session?.user) {
      const isFirstTime = await checkIfFirstTimeLogin(session.user);
      const profile = await loadUserProfile(session.user);
      
      setAuthState({
        session,
        user: session.user,
        profile,
        loading: false,
        isFirstTimeLogin: isFirstTime,
      });
    } else {
      setAuthState({
        session: null,
        user: null,
        profile: null,
        loading: false,
        isFirstTimeLogin: false,
      });
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateAuthState(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      return { error };
    }
    return { error: null };
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      // First verify current password by attempting to sign in
      if (!authState.user?.email) {
        return { error: { message: 'No user email found' } };
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: authState.user.email,
        password: currentPassword,
      });

      if (verifyError) {
        return { error: { message: 'Current password is incorrect' } };
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return { error: updateError };
      }

      return { error: null };
    } catch (error) {
      console.error('Error changing password:', error);
      return { 
        error: { message: error instanceof Error ? error.message : 'Unknown error' } 
      };
    }
  };

  const markFirstTimeLoginComplete = async () => {
    if (!authState.user) return;

    try {
      // Update profile to mark that user has completed first-time setup
      const { error } = await supabase
        .from('profiles')
        .update({ 
          updated_at: new Date().toISOString(),
          // You could add a specific field like first_login_completed: true if you prefer
        })
        .eq('id', authState.user.id);

      if (error) {
        console.error('Error marking first-time login complete:', error);
      }

      // Update local state
      setAuthState(prev => ({
        ...prev,
        isFirstTimeLogin: false,
      }));
    } catch (error) {
      console.error('Error in markFirstTimeLoginComplete:', error);
    }
  };

  return {
    ...authState,
    signOut,
    changePassword,
    markFirstTimeLoginComplete,
    refreshProfile: () => authState.user && loadUserProfile(authState.user),
  };
};
