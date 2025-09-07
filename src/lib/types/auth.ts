export type UserRole = 'mentor' | 'mentee' | 'admin';

export interface User {
  id: string;
  user_id: string; // Added for compatibility with Supabase profiles table
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  onboarding_completed: boolean;
  is_suspended?: boolean;
  suspension_reason?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  signInWithGithub: () => Promise<void>;
  // Session management helper functions
  storeSessionData: (session: any, user: User) => void;
  clearSessionData: () => void;
  getStoredSessionData: () => {
    accessToken: string | null;
    userId: string | null;
    userRole: string | null;
    onboardingCompleted: boolean;
  };
}
