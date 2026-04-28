import { api } from '../lib/api';
import { ApiResponse } from '../types';

interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
  refreshToken?: string; // Optional if not returned by all endpoints
}

export const authService = {
  /**
   * Log in with email and password
   */
  login: async (credentials: Record<string, string>): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return { data };
  },

  /**
   * Refresh the access token
   */
  refresh: async (refreshToken: string): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await api.post<LoginResponse>('/auth/refresh', {
      refreshToken,
    });
    return { data };
  },
};
