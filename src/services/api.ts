import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Create axios instance with base URL from environment variables
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with an error status
      const { status } = error.response;
      
      // Handle 401 Unauthorized - token expired or invalid
      if (status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/auth';
      }
      
      // Handle 403 Forbidden - insufficient permissions
      if (status === 403) {
        console.error('Permission denied');
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error, please check your connection');
    } else {
      // Error in setting up the request
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;