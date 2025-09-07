import  api  from './api';

export interface VideoSessionData {
  token: string;
  channelName: string;
  uid: string | number;
  appId: string;
  sessionInfo: {
    topic: string;
    duration: number;
    mentor: {
      id: string;
      name: string;
    };
    mentee: {
      id: string;
      name: string;
    };
  };
}

export const videoSessionService = {
  /**
   * Initialize a video session
   * @param bookingId - The booking ID
   * @returns Video session data
   */
  initializeSession: async (bookingId: string): Promise<VideoSessionData> => {
    const response = await api.post(`/video-sessions/${bookingId}/initialize`);
    return response.data.data;
  },

  /**
   * End a video session
   * @param bookingId - The booking ID
   * @param recordingUrl - Optional recording URL
   * @returns Updated booking
   */
  endSession: async (bookingId: string, recordingUrl?: string) => {
    const response = await api.post(`/video-sessions/${bookingId}/end`, { recordingUrl });
    return response.data.data.booking;
  },

  /**
   * Report technical issues during a session
   * @param bookingId - The booking ID
   * @param issue - Description of the issue
   * @returns Updated booking
   */
  reportIssue: async (bookingId: string, issue: string) => {
    const response = await api.post(`/video-sessions/${bookingId}/report-issue`, { issue });
    return response.data.data.booking;
  },

  /**
   * Get session recordings
   * @param bookingId - The booking ID
   * @returns List of recordings
   */
  getRecordings: async (bookingId: string) => {
    const response = await api.get(`/video-sessions/${bookingId}/recordings`);
    return response.data.data.recordings;
  }
};