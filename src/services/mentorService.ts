import api from './api';

// Types
interface MentorProfile {
  _id: string;
  userId: string;
  headline: string;
  bio: string;
  expertise: string[];
  skills: string[];
  experienceYears: number;
  hourlyRate: number;
  languages?: string[];
  socialLinks?: Record<string, string>;
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    from: string;
    to: string;
  }>;
  workExperience?: Array<{
    company: string;
    position: string;
    from: string;
    to: string;
    description: string;
  }>;
  [key: string]: any; // For additional fields
}

interface MentorSetupData {
  headline: string;
  bio: string;
  expertise: string[];
  skills: string[];
  experienceYears: number;
  hourlyRate: number;
  languages?: string[];
  socialLinks?: Record<string, string>;
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    from: string;
    to: string;
  }>;
  workExperience?: Array<{
    company: string;
    position: string;
    from: string;
    to: string;
    description: string;
  }>;
  [key: string]: any; // For additional fields
}

interface AvailabilitySlot {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const mentorService = {
  /**
   * Setup or update mentor profile
   * @param data Mentor profile data
   */
  setupProfile: async (data: MentorSetupData): Promise<ApiResponse<MentorProfile>> => {
    try {
      const response = await api.post('/mentors/setup', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to setup mentor profile'
      };
    }
  },

  /**
   * Search mentors with optional query
   * @param query Search query
   */
  searchMentors: async (query?: string): Promise<ApiResponse<MentorProfile[]>> => {
    try {
      const url = query ? `/mentors?q=${encodeURIComponent(query)}` : '/mentors';
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to search mentors'
      };
    }
  },

  /**
   * Get mentor profile by ID
   * @param id Mentor ID
   */
  getMentorProfile: async (id: string): Promise<ApiResponse<MentorProfile>> => {
    try {
      const response = await api.get(`/mentors/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to fetch mentor profile'
      };
    }
  },

  /**
   * Update mentor availability
   * @param id Mentor ID
   * @param slots Availability slots
   */
  updateAvailability: async (id: string, slots: AvailabilitySlot[]): Promise<ApiResponse<any>> => {
    try {
      const response = await api.put(`/mentors/${id}/availability`, { slots });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to update availability'
      };
    }
  }
};

export default mentorService;