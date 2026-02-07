import apiClient from './client';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_admin: boolean;
  role: string | null;
  permissions?: string[];
  member_type?: 'executive' | 'regular' | 'general_assembly' | 'honorary';
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/token/', credentials);
    return response.data;
  },
  
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/token/refresh/', { refresh: refreshToken });
    return response.data;
  },
  
  getUserInfo: async (): Promise<UserInfo> => {
    const response = await apiClient.get('/user/me/');
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },
  
  isAdmin: (): boolean => {
    try {
      const userInfoStr = localStorage.getItem('user_info');
      if (userInfoStr) {
        const userInfo: UserInfo = JSON.parse(userInfoStr);
        return userInfo.is_admin === true;
      }
    } catch (e) {
      console.error('Error parsing user info:', e);
    }
    return false;
  },
  
  changePassword: async (data: { old_password: string; new_password: string }): Promise<void> => {
    const response = await apiClient.post('/user/change-password/', data);
    return response.data;
  },
};

