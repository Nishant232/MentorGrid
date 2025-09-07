import api from './api';
import { supabase } from '@/integrations/supabase/client';

// Types
interface Booking {
  _id: string;
  mentorId: string;
  menteeId: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any; // For additional fields
}

interface CreateBookingData {
  mentorId: string;
  scheduledAt: string; // ISO date string
  durationMinutes: number;
  notes?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const bookingService = {
  /**
   * Create a new booking
   * @param data Booking data
   */
  createBooking: async (data: CreateBookingData): Promise<ApiResponse<Booking>> => {
    try {
      const response = await api.post('/bookings', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to create booking'
      };
    }
  },

  /**
   * Confirm a booking
   * @param id Booking ID
   */
  confirmBooking: async (id: string): Promise<ApiResponse<Booking>> => {
    try {
      const response = await api.put(`/bookings/${id}/confirm`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to confirm booking'
      };
    }
  },

  /**
   * Cancel a booking
   * @param id Booking ID
   */
  cancelBooking: async (id: string): Promise<ApiResponse<Booking>> => {
    try {
      const response = await api.put(`/bookings/${id}/cancel`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to cancel booking'
      };
    }
  },

  /**
   * Complete a booking
   * @param id Booking ID
   */
  completeBooking: async (id: string): Promise<ApiResponse<Booking>> => {
    try {
      const response = await api.put(`/bookings/${id}/complete`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to complete booking'
      };
    }
  },

  /**
   * Get bookings list
   * @param role User role ('mentee' or 'mentor')
   */
  getBookings: async (role: 'mentee' | 'mentor'): Promise<ApiResponse<Booking[]>> => {
    try {
      const response = await api.get(`/bookings?role=${role}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to fetch bookings'
      };
    }
  },

  /**
   * Check for conflicts before creating a booking using mentor availability and external busy events.
   */
  checkConflicts: async (mentorUserId: string, startIso: string, durationMinutes: number) => {
    const start = new Date(startIso);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    // 1) Check external busy events overlap - get calendar account IDs first
    const { data: accountIds } = await supabase
      .from('calendar_accounts')
      .select('id')
      .eq('user_id', mentorUserId);

    if (!accountIds || accountIds.length === 0) {
      // No calendar accounts, skip busy event check
    } else {
      const { data: busy } = await supabase
        .from('external_busy_events')
        .select('start_time, end_time')
        .in('calendar_account_id', accountIds.map(acc => acc.id))
        .lte('start_time', end.toISOString())
        .gte('end_time', start.toISOString());

      const hasExternalConflict = (busy || []).some((b: any) => {
        const bStart = new Date(b.start_time).getTime();
        const bEnd = new Date(b.end_time).getTime();
        return bStart < end.getTime() && bEnd > start.getTime();
      });

      if (hasExternalConflict) {
        return { ok: false, reason: 'External calendar conflict' } as const;
      }
    }

    // 2) Check availability exceptions blocking
    const dateStr = start.toISOString().slice(0, 10);
    const startMins = start.getUTCHours() * 60 + start.getUTCMinutes();
    const endMins = end.getUTCHours() * 60 + end.getUTCMinutes();

    const { data: exceptions } = await supabase
      .from('mentor_availability_exceptions')
      .select('date, start_minute, end_minute, is_available')
      .eq('mentor_user_id', mentorUserId)
      .eq('date', dateStr);

    const blockedByException = (exceptions || []).some((ex: any) => {
      if (ex.is_available) return false; // open extra slot
      return ex.start_minute < endMins && ex.end_minute > startMins;
    });

    if (blockedByException) {
      return { ok: false, reason: 'Blocked by exception' } as const;
    }

    // 3) Check weekly rule coverage (very basic UTC-based check)
    const weekday = start.getUTCDay();
    const { data: rules } = await supabase
      .from('mentor_availability_rules')
      .select('weekday, start_minute, end_minute, is_active')
      .eq('mentor_user_id', mentorUserId)
      .eq('weekday', weekday)
      .eq('is_active', true);

    const coveredByRule = (rules || []).some((r: any) => {
      return r.start_minute <= startMins && r.end_minute >= endMins;
    });

    if (!coveredByRule) {
      return { ok: false, reason: 'Outside available hours' } as const;
    }

    return { ok: true } as const;
  }
};

export default bookingService;