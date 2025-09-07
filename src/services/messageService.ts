import api from './api';

// Types
interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  threadId?: string;
  bookingId?: string;
  read: boolean;
  createdAt: string;
  replyTo?: string;
  attachments?: Array<{
    type: string;
    url: string;
    name?: string;
    size?: number;
    mimeType?: string;
  }>;
  [key: string]: any; // For additional fields
}

interface SendMessageData {
  receiverId: string;
  content: string;
  threadId?: string;
  bookingId?: string;
  replyTo?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const messageService = {
  /**
   * Get messages thread with a specific user
   * @param threadId Thread/user ID
   */
  getThread: async (threadId: string): Promise<ApiResponse<Message[]>> => {
    try {
      const response = await api.get(`/messages/thread/${threadId}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to fetch messages'
      };
    }
  },

  /**
   * Send a message
   * @param data Message data
   */
  sendMessage: async (data: SendMessageData): Promise<ApiResponse<Message>> => {
    try {
      const response = await api.post('/messages/send', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to send message'
      };
    }
  },
  
  /**
   * Send a message with file attachments
   * @param formData FormData containing message content and attachments
   */
  sendMessageWithAttachments: async (formData: FormData): Promise<ApiResponse<Message>> => {
    try {
      const response = await api.post('/messages/with-attachments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to send message with attachments'
      };
    }
  },
  
  /**
   * Get unread message count
   */
  getUnreadCount: async (): Promise<ApiResponse<{count: number}>> => {
    try {
      const response = await api.get('/messages/unread/count');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to fetch unread count'
      };
    }
  },
  
  /**
   * Mark a message as read
   * @param messageId ID of the message to mark as read
   */
  markAsRead: async (messageId: string): Promise<ApiResponse<Message>> => {
    try {
      const response = await api.put(`/messages/${messageId}/read`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Failed to mark message as read'
      };
    }
  }
};

export default messageService;