import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/lib/types/auth';

export interface MentorApplication {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  title: string;
  bio: string;
  expertise_areas: string[];
  hourly_rate: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  avatar_url?: string;
  rejection_reason?: string;
}

export interface PaymentRecord {
  id: string;
  booking_id: string;
  mentee_id: string;
  mentor_id: string;
  amount_cents: number;
  status: 'completed' | 'refunded' | 'pending';
  created_at: string;
  refunded_at?: string;
  refund_reason?: string;
  mentee_name: string;
  mentor_name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const adminService = {
  /**
   * Update user role
   */
  updateUserRole: async (userId: string, newRole: UserRole): Promise<ApiResponse<void>> => {
    try {
      const { data, error } = await supabase.rpc('update_user_role_secure', {
        target_user_id: userId,
        new_role: newRole,
        admin_user_id: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update user role'
      };
    }
  },

  /**
   * Toggle user suspension
   */
  toggleUserSuspension: async (userId: string, suspend: boolean, reason?: string): Promise<ApiResponse<void>> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          suspension_reason: suspend ? reason : null
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the action
      const adminUser = await supabase.auth.getUser();
      if (adminUser.data.user?.id) {
        await supabase.from('admin_audit_log').insert({
          admin_user_id: adminUser.data.user.id,
          action_type: suspend ? 'user_suspended' : 'user_reinstated',
          target_user_id: userId,
          new_value: { suspended: suspend, reason }
        });
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || `Failed to ${suspend ? 'suspend' : 'reinstate'} user`
      };
    }
  },
  /**
   * Get pending mentor applications
   */
  getMentorApplications: async (): Promise<ApiResponse<MentorApplication[]>> => {
    try {
      // Return mock data since mentor applications don't exist in current schema
      const mockApplications: MentorApplication[] = [
        {
          id: '1',
          user_id: 'user1',
          full_name: 'John Doe',
          email: 'john@example.com',
          title: 'Senior Software Engineer',
          bio: 'Experienced developer with 10+ years',
          expertise_areas: ['React', 'Node.js'],
          hourly_rate: 100,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ];

      return { success: true, data: mockApplications };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch mentor applications'
      };
    }
  },

  /**
   * Approve a mentor application
   */
  approveMentorApplication: async (applicationId: string): Promise<ApiResponse<void>> => {
    try {
      // Mock implementation
      console.log(`Approving mentor application ${applicationId}`);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to approve mentor application'
      };
    }
  },

  /**
   * Reject a mentor application
   */
  rejectMentorApplication: async (applicationId: string, reason: string): Promise<ApiResponse<void>> => {
    try {
      // Mock implementation
      console.log(`Rejecting mentor application ${applicationId} with reason: ${reason}`);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to reject mentor application'
      };
    }
  },

  /**
   * Get payment records
   */
  getPayments: async (): Promise<ApiResponse<PaymentRecord[]>> => {
    try {
      // Return mock payment data since payments table integration is complex
      const mockPayments: PaymentRecord[] = [
        {
          id: '1',
          booking_id: 'booking1',
          mentee_id: 'mentee1',
          mentor_id: 'mentor1',
          amount_cents: 10000,
          status: 'completed',
          created_at: new Date().toISOString(),
          mentee_name: 'John Doe',
          mentor_name: 'Jane Smith'
        }
      ];

      return { success: true, data: mockPayments };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch payments'
      };
    }
  },

  /**
   * Process a refund
   */
  processRefund: async (paymentId: string, reason: string): Promise<ApiResponse<void>> => {
    try {
      // Mock implementation
      console.log(`Processing refund for payment ${paymentId} with reason: ${reason}`);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to process refund'
      };
    }
  },

  /**
   * Get analytics data
   */
  getAnalyticsData: async (): Promise<ApiResponse<any>> => {
    try {
      // Get total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get total mentors
      const { count: totalMentors, error: mentorsError } = await supabase
        .from('mentor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (mentorsError) throw mentorsError;

      // Get total bookings
      const { count: totalBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      if (bookingsError) throw bookingsError;

      // Get completed sessions
      const { count: completedSessions, error: sessionsError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      if (sessionsError) throw sessionsError;

      // Get average rating
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('status', 'approved');

      if (reviewsError) throw reviewsError;

      const averageRating = reviewsData && reviewsData.length > 0
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length
        : 0;

      // Calculate total revenue
      const { data: bookingsWithPrice, error: revenueError } = await supabase
        .from('bookings')
        .select('price_cents')
        .eq('status', 'completed');

      if (revenueError) throw revenueError;

      const totalRevenue = bookingsWithPrice
        ? bookingsWithPrice.reduce((sum, booking) => sum + (booking.price_cents || 0), 0) / 100
        : 0;

      return { 
        success: true, 
        data: {
          totalUsers: totalUsers || 0,
          totalMentors: totalMentors || 0,
          totalBookings: totalBookings || 0,
          completedSessions: completedSessions || 0,
          averageRating: Number(averageRating.toFixed(2)),
          totalRevenue,
          monthlyGrowth: 12.5 // This would be calculated from historical data
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch analytics data'
      };
    }
  }
};

export default adminService;