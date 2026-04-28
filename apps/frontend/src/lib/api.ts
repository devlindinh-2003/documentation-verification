import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../types/api';
import { clearTokens, getRefreshToken, getToken, setTokens } from './auth';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle 401s, token refresh, and error normalization
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;

    // Avoid infinite loops for login or refresh itself
    if (
      error?.response?.status === 401 &&
      !originalRequest?._retry &&
      originalRequest?.url !== '/auth/refresh' &&
      originalRequest?.url !== '/auth/login'
    ) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken,
          });

          if (res?.data?.access_token) {
            setTokens(res.data.access_token, res.data.refresh_token || refreshToken);
            originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Use global auth state to logout and redirect
          useAuth.getState().logout();
          return Promise.reject({
            statusCode: 401,
            message: 'Session expired',
          } as ApiError);
        }
      } else {
        // No refresh token available, logout and redirect
        useAuth.getState().logout();
        return Promise.reject({
          statusCode: 401,
          message: 'Please log in again',
        } as ApiError);
      }
    }

    // Normalize error object
    const normalizedError: ApiError = {
      statusCode: error?.response?.status || 0,
      message: error?.response?.data?.message || 'Network error',
      error: error?.response?.data?.error || 'Unknown error',
    };

    return Promise.reject(normalizedError);
  },
);
