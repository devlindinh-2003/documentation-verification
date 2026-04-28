import { api } from '../lib/api';
import { ApiResponse, User } from '../types';

interface LoginResponse {
  access_token: string;
  user: User;
  refreshToken?: string;
}

/**
 * Authentication service handling login, token refresh, and demo account creation.
 * All methods return standardized ApiResponse wrappers from axios interceptors.
 */
export const authService = {
  /**
   * authenticates a user and returns a JWT access token.
   */
  login: async (credentials: Record<string, string>): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials);
    return { data };
  },

  /**
   * refreshes the session token (stub for future implementation).
   */
  refresh: async (refreshToken: string): Promise<ApiResponse<LoginResponse>> => {
    const { data } = await api.post<LoginResponse>('/auth/refresh', {
      refreshToken,
    });
    return { data };
  },

  /**
   * provisions a one-time demo account for system exploration.
   */
  demoCreate: async (): Promise<ApiResponse<{ email: string; password: 'password123' }>> => {
    const { data } = await api.post<{ email: string; password: 'password123' }>(
      '/auth/demo/create',
    );
    return { data };
  },
};
