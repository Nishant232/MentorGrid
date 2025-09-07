// This file is deprecated - authentication is now handled by AuthContext and Supabase directly
// Keeping for backward compatibility but all auth logic should use useAuth() hook

import { supabase } from '@/integrations/supabase/client';

const authService = {
  /**
   * @deprecated Use useAuth().signup instead
   */
  register: async (data: any) => {
    console.warn('authService.register is deprecated. Use useAuth().signup instead');
    return { success: false, error: 'Use useAuth().signup instead' };
  },

  /**
   * @deprecated OTP verification is handled automatically by Supabase
   */
  verifyOtp: async (data: any) => {
    console.warn('authService.verifyOtp is deprecated. OTP is handled automatically by Supabase');
    return { success: false, error: 'OTP is handled automatically by Supabase' };
  },

  /**
   * @deprecated Use useAuth().login instead
   */
  login: async (data: any) => {
    console.warn('authService.login is deprecated. Use useAuth().login instead');
    return { success: false, error: 'Use useAuth().login instead' };
  },

  /**
   * @deprecated Use useAuth().logout instead
   */
  logout: () => {
    console.warn('authService.logout is deprecated. Use useAuth().logout instead');
  },

  /**
   * Check if user is authenticated using Supabase session
   */
  isAuthenticated: async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  }
};

export default authService;
