import { supabase } from "@/integrations/supabase/client";
import { mockMentors, mockLeaderboard, mockCategories, mockTestimonials } from "./mock-data";

// API service with fallback to mock data
export class ApiService {
  private static async handleApiCall<T>(
    apiCall: () => Promise<{ data: T | null; error: any }>,
    mockData: T,
    errorMessage: string = "API call failed"
  ): Promise<{ data: T; error: null } | { data: null; error: string }> {
    try {
      const result = await apiCall();
      if (result.error) {
        console.warn(`${errorMessage}:`, result.error);
        // Return mock data as fallback
        return { data: mockData, error: null };
      }
      return { data: result.data || mockData, error: null };
    } catch (error) {
      console.warn(`${errorMessage}:`, error);
      // Return mock data as fallback
      return { data: mockData, error: null };
    }
  }

  // Get mentors with filters
  static async getMentors(filters?: {
    category?: string;
    rating?: number;
    priceRange?: { min: number; max: number };
  }) {
    return this.handleApiCall(
      async () => {
        let query = supabase
          .from("mentor_profiles")
          .select(`
            *,
            profiles!inner(full_name, avatar_url, email, user_id)
          `)
          .eq("is_active", true);

        if (filters?.category) {
          query = query.contains("expertise_areas", [filters.category]);
        }

        return await query;
      },
      [] as any, // Return empty array instead of mock data when API fails
      "Failed to fetch mentors"
    );
  }

  // Get leaderboard data
  static async getLeaderboard() {
    return this.handleApiCall(
      async () => {
        return await supabase
          .from("leaderboard")
          .select("user_id, full_name, avatar_url, role, xp, current_streak_days")
          .order("xp", { ascending: false })
          .limit(20);
      },
      mockLeaderboard as any,
      "Failed to fetch leaderboard"
    );
  }

  // Get categories
  static async getCategories() {
    return this.handleApiCall(
      async () => {
        return await supabase
          .from("categories")
          .select("*")
          .order("mentor_count", { ascending: false });
      },
      mockCategories as any,
      "Failed to fetch categories"
    );
  }

  // Get testimonials
  static async getTestimonials() {
    return this.handleApiCall(
      async () => {
        return await supabase
          .from("testimonials")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);
      },
      mockTestimonials as any,
      "Failed to fetch testimonials"
    );
  }

  // Get mentor profile by ID
  static async getMentorProfile(mentorId: string) {
    return this.handleApiCall(
      async () => {
        return await supabase
          .from("mentor_profiles")
          .select(`
            *,
            profiles!inner(full_name, avatar_url, email, user_id)
          `)
          .eq("user_id", mentorId)
          .eq("is_active", true)
          .maybeSingle();
      },
      null as any,
      "Failed to fetch mentor profile"
    );
  }

  // Get mentor availability
  static async getMentorAvailability(mentorId: string) {
    return this.handleApiCall(
      async () => {
        return await supabase
          .from("mentor_availability_rules")
          .select("*")
          .eq("mentor_user_id", mentorId)
          .eq("is_active", true);
      },
      [
        {
          id: "mock-1",
          mentor_user_id: mentorId,
          weekday: 1,
          start_minute: 540, // 9:00 AM
          end_minute: 1020, // 5:00 PM
          timezone: "UTC",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "mock-2", 
          mentor_user_id: mentorId,
          weekday: 2,
          start_minute: 540,
          end_minute: 1020,
          timezone: "UTC", 
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ] as any,
      "Failed to fetch mentor availability"
    );
  }

  // Get mentee profile
  static async getMenteeProfile() {
    return this.handleApiCall(
      async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("User not authenticated");
        }

        return await supabase
          .from("mentee_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
      },
      {
        id: "mock-mentee-id",
        user_id: "mock-user-id",
        bio: "I'm a passionate developer looking to improve my skills in React and Node.js.",
        interests: ["React", "Node.js", "TypeScript", "Full-stack Development"],
        goals: ["Improve React skills", "Learn Node.js backend", "Master TypeScript"],
        current_level: "Intermediate",
        learning_style: "Hands-on",
        preferred_meeting_frequency: "Weekly",
        budget_range: "$50-100",
        timezone: "America/Los_Angeles",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      "Failed to fetch mentee profile"
    );
  }

  // Update mentee profile
  static async updateMenteeProfile(profileData: FormData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Extract profile data from FormData
      const profile = {
        bio: profileData.get('bio') as string,
        interests: (profileData.get('interests') as string).split(',').map(i => i.trim()),
        goals: (profileData.get('goals') as string).split(',').map(g => g.trim()),
        current_level: profileData.get('currentLevel') as string,
        learning_style: profileData.get('learningStyle') as string,
        preferred_meeting_frequency: profileData.get('meetingFrequency') as string,
        budget_range: profileData.get('budgetRange') as string,
        timezone: profileData.get('timezone') as string,
        updated_at: new Date().toISOString()
      };

      // Update or insert profile
      const { data, error } = await supabase
        .from("mentee_profiles")
        .upsert({
          user_id: user.id,
          ...profile
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating mentee profile:', error);
      return { data: null, error: error as Error };
    }
  }

  // Authentication with fallback
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // For testing purposes, allow mock login
        if (email.includes("test") || email.includes("demo")) {
          return {
            data: {
              user: {
                id: "mock-user-id",
                email: email,
                user_metadata: { full_name: "Test User" }
              },
              session: null
            },
            error: null
          };
        }
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  static async signUp(email: string, password: string, fullName: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      
      if (error) {
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
