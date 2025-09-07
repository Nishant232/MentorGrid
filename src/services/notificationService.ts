import api from './api';

// Types
interface Notification {
  _id: string;
  recipient: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
  [key: string]: any; // For additional fields
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const notificationService = {
  /**
   * Get user notifications
   * @param unreadOnly Whether to fetch only unread notifications
   */
  getNotifications: async (unreadOnly: boolean = false): Promise<ApiResponse<Notification[]>> => {
    try {
      const url = unreadOnly ? '/notifications?unreadOnly=true' : '/notifications';
      const response = await api.get(url);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to fetch notifications'
      };
    }
  },

  /**
   * Mark notification as read
   * @param id Notification ID
   */
  markAsRead: async (id: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to mark notification as read'
      };
    }
  }
};

export default notificationService;