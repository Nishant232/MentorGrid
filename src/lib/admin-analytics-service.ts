import { supabase } from "@/integrations/supabase/client";

// Mock data for analytics dashboard
const mockUserAnalytics = {
  totalUsers: 1250,
  newUsers: 125,
  activeUsers: 780,
  growthRate: 8.5,
  activeRate: 62.4,
  usersByRole: {
    mentors: 320,
    mentees: 910,
    admins: 20
  },
  userGrowthByMonth: [
    { month: 'Jan', mentors: 20, mentees: 50 },
    { month: 'Feb', mentors: 25, mentees: 65 },
    { month: 'Mar', mentors: 30, mentees: 85 },
    { month: 'Apr', mentors: 35, mentees: 95 },
    { month: 'May', mentors: 40, mentees: 110 },
    { month: 'Jun', mentors: 45, mentees: 130 },
    { month: 'Jul', mentors: 50, mentees: 150 },
    { month: 'Aug', mentors: 55, mentees: 170 },
    { month: 'Sep', mentors: 60, mentees: 190 },
    { month: 'Oct', mentors: 65, mentees: 210 },
    { month: 'Nov', mentors: 70, mentees: 230 },
    { month: 'Dec', mentors: 75, mentees: 250 }
  ]
};

const mockBookingAnalytics = {
  totalBookings: 3200,
  completedBookings: 2800,
  cancelledBookings: 400,
  completionRate: 87.5,
  cancellationRate: 12.5,
  totalSessionHours: 4200,
  averageRating: 4.7,
  bookingsByMonth: [
    { month: 'Jan', bookings: 200, completed: 175, cancelled: 25 },
    { month: 'Feb', bookings: 220, completed: 190, cancelled: 30 },
    { month: 'Mar', bookings: 240, completed: 210, cancelled: 30 },
    { month: 'Apr', bookings: 260, completed: 230, cancelled: 30 },
    { month: 'May', bookings: 280, completed: 245, cancelled: 35 },
    { month: 'Jun', bookings: 300, completed: 260, cancelled: 40 },
    { month: 'Jul', bookings: 320, completed: 280, cancelled: 40 },
    { month: 'Aug', bookings: 340, completed: 300, cancelled: 40 },
    { month: 'Sep', bookings: 360, completed: 315, cancelled: 45 },
    { month: 'Oct', bookings: 380, completed: 330, cancelled: 50 },
    { month: 'Nov', bookings: 400, completed: 350, cancelled: 50 },
    { month: 'Dec', bookings: 420, completed: 370, cancelled: 50 }
  ]
};

const mockEngagementAnalytics = {
  totalMessages: 24500,
  activeChats: 850,
  averageResponseTime: 35, // minutes
  messagesPerDay: 210,
  engagementByMonth: [
    { month: 'Jan', messages: 1500, activeChats: 500 },
    { month: 'Feb', messages: 1600, activeChats: 520 },
    { month: 'Mar', messages: 1700, activeChats: 540 },
    { month: 'Apr', messages: 1800, activeChats: 560 },
    { month: 'May', messages: 1900, activeChats: 580 },
    { month: 'Jun', messages: 2000, activeChats: 600 },
    { month: 'Jul', messages: 2100, activeChats: 620 },
    { month: 'Aug', messages: 2200, activeChats: 640 },
    { month: 'Sep', messages: 2300, activeChats: 660 },
    { month: 'Oct', messages: 2400, activeChats: 680 },
    { month: 'Nov', messages: 2500, activeChats: 700 },
    { month: 'Dec', messages: 2600, activeChats: 720 }
  ]
};

const mockFinancialAnalytics = {
  totalRevenue: 125000,
  totalPayouts: 87500,
  netRevenue: 37500,
  transactionsByType: {
    bookings: 95000,
    subscriptions: 25000,
    credits: 5000
  },
  averageTransactionValue: 85,
  revenueByMonth: [
    { month: 'Jan', revenue: 8000, payouts: 5600, net: 2400 },
    { month: 'Feb', revenue: 8500, payouts: 5950, net: 2550 },
    { month: 'Mar', revenue: 9000, payouts: 6300, net: 2700 },
    { month: 'Apr', revenue: 9500, payouts: 6650, net: 2850 },
    { month: 'May', revenue: 10000, payouts: 7000, net: 3000 },
    { month: 'Jun', revenue: 10500, payouts: 7350, net: 3150 },
    { month: 'Jul', revenue: 11000, payouts: 7700, net: 3300 },
    { month: 'Aug', revenue: 11500, payouts: 8050, net: 3450 },
    { month: 'Sep', revenue: 12000, payouts: 8400, net: 3600 },
    { month: 'Oct', revenue: 12500, payouts: 8750, net: 3750 },
    { month: 'Nov', revenue: 13000, payouts: 9100, net: 3900 },
    { month: 'Dec', revenue: 13500, payouts: 9450, net: 4050 }
  ]
};

const mockMentorAnalytics = {
  topMentors: [
    { id: '1', name: 'Jane Smith', sessions: 120, hours: 180, rating: 4.9, earnings: 9000 },
    { id: '2', name: 'John Doe', sessions: 110, hours: 165, rating: 4.8, earnings: 8250 },
    { id: '3', name: 'Alice Johnson', sessions: 100, hours: 150, rating: 4.7, earnings: 7500 },
    { id: '4', name: 'Bob Williams', sessions: 90, hours: 135, rating: 4.6, earnings: 6750 },
    { id: '5', name: 'Carol Brown', sessions: 80, hours: 120, rating: 4.5, earnings: 6000 }
  ],
  averageSessionsPerMentor: 45,
  averageHoursPerMentor: 67.5,
  averageEarningsPerMentor: 3375
};

const mockPlatformHealth = {
  userMetrics: mockUserAnalytics,
  bookingMetrics: mockBookingAnalytics,
  engagementMetrics: mockEngagementAnalytics,
  financialMetrics: mockFinancialAnalytics
};

// Admin Analytics Service
export class AdminAnalyticsService {
  private static API_URL = '/api/v1/analytics';

  private static async fetchWithAuth(endpoint: string, params: Record<string, any> = {}) {
    try {
      // In a real implementation, this would make an authenticated API call
      // For now, we'll return mock data
      console.log(`Fetching ${endpoint} with params:`, params);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock data based on endpoint
      return { data: this.getMockData(endpoint), error: null };
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return { data: null, error: 'Failed to fetch analytics data' };
    }
  }

  private static getMockData(endpoint: string) {
    switch (endpoint) {
      case '/users':
        return mockUserAnalytics;
      case '/bookings':
        return mockBookingAnalytics;
      case '/engagement':
        return mockEngagementAnalytics;
      case '/financial':
        return mockFinancialAnalytics;
      case '/mentors':
        return mockMentorAnalytics;
      case '/platform-health':
        return mockPlatformHealth;
      default:
        return {};
    }
  }

  // Get user growth analytics
  static async getUserAnalytics(params: { startDate: string; endDate: string; role?: string } = { 
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString(),
    endDate: new Date().toISOString() 
  }) {
    return this.fetchWithAuth(`${this.API_URL}/users`, params);
  }

  // Get booking analytics
  static async getBookingAnalytics(params: { startDate: string; endDate: string } = { 
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString(),
    endDate: new Date().toISOString() 
  }) {
    return this.fetchWithAuth(`${this.API_URL}/bookings`, params);
  }

  // Get engagement analytics
  static async getEngagementAnalytics(params: { startDate: string; endDate: string } = { 
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString(),
    endDate: new Date().toISOString() 
  }) {
    return this.fetchWithAuth(`${this.API_URL}/engagement`, params);
  }

  // Get financial analytics
  static async getFinancialAnalytics(params: { startDate: string; endDate: string } = { 
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString(),
    endDate: new Date().toISOString() 
  }) {
    return this.fetchWithAuth(`${this.API_URL}/financial`, params);
  }

  // Get mentor performance analytics
  static async getMentorAnalytics(params: { 
    startDate: string; 
    endDate: string;
    limit?: number;
  } = { 
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString(),
    endDate: new Date().toISOString(),
    limit: 10
  }) {
    return this.fetchWithAuth(`${this.API_URL}/mentors`, params);
  }

  // Get platform health dashboard
  static async getPlatformHealth() {
    return this.fetchWithAuth(`${this.API_URL}/platform-health`);
  }

  // Export analytics data
  static async exportAnalytics(params: {
    startDate: string;
    endDate: string;
    metrics: ('users' | 'bookings' | 'engagement' | 'financial' | 'mentors')[];
    format?: 'json' | 'csv';
  }) {
    return this.fetchWithAuth(`${this.API_URL}/export`, params);
  }
}