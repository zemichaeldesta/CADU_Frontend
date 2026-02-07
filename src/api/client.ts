import axios from 'axios';

// Use relative URL in production, absolute URL in development
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8000/api');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401 and error logging
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Log API errors (keep console.error for production error tracking)
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.detail || error.response.data?.error || 'An error occurred';
      
      // Log 5xx server errors
      if (status >= 500) {
        console.error('Server error:', {
          status,
          message,
          url: originalRequest?.url,
          method: originalRequest?.method,
        });
      }
      // Log 4xx client errors (except 401 which is handled below)
      else if (status >= 400 && status !== 401) {
        console.warn('Client error:', {
          status,
          message,
          url: originalRequest?.url,
        });
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error: No response from server', {
        url: originalRequest?.url,
      });
    } else {
      // Error in request setup
      console.error('Request setup error:', error.message);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Token refresh failed - clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        console.error('Token refresh failed, redirecting to login');
        window.location.href = '/admin/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

