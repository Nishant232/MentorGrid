import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType, AuthState, User, UserRole } from '@/lib/types/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@supabase/supabase-js';

const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session storage keys
const SESSION_STORAGE_KEYS = {
  ACCESS_TOKEN: 'supabase_access_token',
  USER_ID: 'supabase_user_id',
  USER_ROLE: 'supabase_user_role',
  ONBOARDING_COMPLETED: 'supabase_onboarding_completed',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Helper function to store session data
  const storeSessionData = (session: Session, user: User) => {
    if (session?.access_token) {
      localStorage.setItem(SESSION_STORAGE_KEYS.ACCESS_TOKEN, session.access_token);
      localStorage.setItem(SESSION_STORAGE_KEYS.USER_ID, user.id);
      localStorage.setItem(SESSION_STORAGE_KEYS.USER_ROLE, user.role);
      localStorage.setItem(SESSION_STORAGE_KEYS.ONBOARDING_COMPLETED, user.onboarding_completed.toString());
    }
  };

  // Helper function to clear session data
  const clearSessionData = () => {
    localStorage.removeItem(SESSION_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(SESSION_STORAGE_KEYS.USER_ID);
    localStorage.removeItem(SESSION_STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem(SESSION_STORAGE_KEYS.ONBOARDING_COMPLETED);
  };

  // Helper function to get stored session data
  const getStoredSessionData = () => {
    const accessToken = localStorage.getItem(SESSION_STORAGE_KEYS.ACCESS_TOKEN);
    const userId = localStorage.getItem(SESSION_STORAGE_KEYS.USER_ID);
    const userRole = localStorage.getItem(SESSION_STORAGE_KEYS.USER_ROLE);
    const onboardingCompleted = localStorage.getItem(SESSION_STORAGE_KEYS.ONBOARDING_COMPLETED);

    return {
      accessToken,
      userId,
      userRole,
      onboardingCompleted: onboardingCompleted === 'true',
    };
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        // Use setTimeout to defer Supabase calls and prevent deadlocks
        setTimeout(() => {
          if (session?.user) {
            fetchUserProfile(session.user.id);
          } else {
            setState({
              user: null,
              isLoading: false,
              error: null,
            });
            clearSessionData();
            if (event === 'SIGNED_OUT') {
              navigate('/auth');
            }
          }
        }, 0);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const user = { ...profile, id: profile.user_id } as User;
      
      setState({
        user,
        isLoading: false,
        error: null,
      });

      // Store session data
      if (session) {
        storeSessionData(session, user);
      }

      // Handle navigation based on current location and user state
      const currentPath = window.location.pathname;
      
      if (!profile.onboarding_completed && currentPath !== '/onboarding') {
        navigate('/onboarding');
      } else if (profile.onboarding_completed && currentPath === '/auth') {
        // Redirect to user-specific dashboard
        const dashboardPath = profile.role === 'mentor' 
          ? `/mentor-dashboard/${userId}`
          : `/mentee-dashboard/${userId}`;
        navigate(dashboardPath);
      }
    } catch (error: any) {
      setState({
        user: null,
        isLoading: false,
        error: error.message,
      });
      clearSessionData();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setState({ ...state, isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Store session data immediately after successful login
      if (data.session) {
        setSession(data.session);
        // The fetchUserProfile will be called by the auth state change listener
        // and will handle the redirect logic
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });

    } catch (error: any) {
      setState({ ...state, error: error.message, isLoading: false });
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const signup = async (email: string, password: string, fullName: string, role: UserRole) => {
    try {
      setState({ ...state, isLoading: true, error: null });
      
      const redirectUrl = `${window.location.origin}/onboarding`;
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data?.user) {
        // Store initial session data for the new user
        if (data.session) {
          setSession(data.session);
          localStorage.setItem(SESSION_STORAGE_KEYS.USER_ID, data.user.id);
          localStorage.setItem(SESSION_STORAGE_KEYS.USER_ROLE, role);
          localStorage.setItem(SESSION_STORAGE_KEYS.ONBOARDING_COMPLETED, 'false');
        }

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      setState({ ...state, error: error.message, isLoading: false });
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const logout = async () => {
    try {
      setState({ ...state, isLoading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setState({
        user: null,
        isLoading: false,
        error: null,
      });

      clearSessionData();
      navigate('/auth');
    } catch (error: any) {
      setState({ ...state, error: error.message, isLoading: false });
    }
  };

  const clearError = () => {
    setState({ ...state, error: null });
  };

  const signInWithGithub = async () => {
    try {
      setState({ ...state, isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
          scopes: 'read:user user:email',
        },
      });

      if (error) throw error;

      // The redirect will handle the rest through the onAuthStateChange listener

    } catch (error: any) {
      setState({ ...state, error: error.message, isLoading: false });
      toast({
        variant: "destructive",
        title: "GitHub Authentication Error",
        description: error.message,
      });
    }
  };

  const value = {
    ...state,
    login,
    signInWithGithub,
    signup,
    logout,
    clearError,
    // Add helper functions to the context
    storeSessionData,
    clearSessionData,
    getStoredSessionData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
