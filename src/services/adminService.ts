import { supabase } from '@/integrations/supabase/client';

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
   * Get pending mentor applications
   */
  getMentorApplications: async (): Promise<ApiResponse<MentorApplication[]>> => {
    try {
      const { data, error } = await supabase
        .from('mentor_profiles')
        .select(`
          *,
          profiles!mentor_profiles_user_id_fkey(full_name, email, avatar_url)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const applications = data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        full_name: item.profiles.full_name,
        email: item.profiles.email,
        avatar_url: item.profiles.avatar_url,
        title: item.title,
        bio: item.bio,
        expertise_areas: item.expertise_areas,
        hourly_rate: item.hourly_rate,
        status: item.status,
        created_at: item.created_at,
      }));

      return { success: true, data: applications };
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
      const { error } = await supabase
        .from('mentor_profiles')
        .update({ status: 'approved' })
        .eq('id', applicationId);

      if (error) throw error;

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
      const { error } = await supabase
        .from('mentor_profiles')
        .update({ 
          status: 'rejected',
          rejection_reason: reason 
        })
        .eq('id', applicationId);

      if (error) throw error;

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
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          mentee:mentee_id(full_name),
          mentor:mentor_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const payments = data.map(item => ({
        id: item.id,
        booking_id: item.booking_id,
        mentee_id: item.mentee_id,
        mentor_id: item.mentor_id,
        amount_cents: item.amount_cents,
        status: item.status,
        created_at: item.created_at,
        refunded_at: item.refunded_at,
        refund_reason: item.refund_reason,
        mentee_name: item.mentee?.full_name || 'Unknown',
        mentor_name: item.mentor?.full_name || 'Unknown',
      }));

      return { success: true, data: payments };
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
      const { error } = await supabase
        .from('payments')
        .update({ 
          status: 'refunded',
          refunded_at: new Date().toISOString(),
          refund_reason: reason 
        })
        .eq('id', paymentId);

      if (error) throw error;

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