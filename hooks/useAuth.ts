import { Session, User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Profile, supabase } from '../lib/supabase';

export type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
  });


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
      const profile = await loadUserProfile(session.user);
      
      setAuthState({
        session,
        user: session.user,
        profile,
        loading: false,
      });
    } else {
      setAuthState({
        session: null,
        user: null,
        profile: null,
        loading: false,
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


  return {
    ...authState,
    signOut,
    changePassword,
    refreshProfile: () => authState.user && loadUserProfile(authState.user),
  };
};
