import api from './api';

// Types
interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  headline?: string;
  bio?: string;
  expertise?: string[];
  skills?: string[];
  avatar?: string;
  [key: string]: any; // For additional fields
}

interface UpdateProfileData {
  name?: string;
  headline?: string;
  bio?: string;
  expertise?: string[];
  skills?: string[];
  [key: string]: any; // For additional fields
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const userService = {
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to fetch profile'
      };
    }
  },

  /**
   * Update user profile
   * @param data Profile data to update
   */
  updateProfile: async (data: UpdateProfileData): Promise<ApiResponse<UserProfile>> => {
    try {
      const response = await api.put('/users/me', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to update profile'
      };
    }
  }
};

export default userService;