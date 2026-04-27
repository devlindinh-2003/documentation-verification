import axios from 'axios';
import { getToken, getRefreshToken, setTokens, clearTokens } from './auth';
import { VerificationStatus } from './status-config';
import { useAuth } from '../hooks/useAuth';

export interface VerificationRecord {
  id: string;
  status: VerificationStatus;
  sellerId: string;
  externalJobId?: string | null;
  documentKey: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  lockedBy?: string | null;
  lockedAt?: string | null;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorRole: string;
  eventType: string;
  fromStatus: string;
  toStatus: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'VERIFICATION_RESULT';
  isRead: boolean;
  readAt: string | null;
  metadata: {
    recordId: string;
    status: VerificationStatus;
  };
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

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
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s and token refresh
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

          if (res?.data?.accessToken) {
            setTokens(res.data.accessToken, res.data.refreshToken || refreshToken);
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Use global auth state to logout and redirect
          useAuth.getState().logout();
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, logout and redirect
        useAuth.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);
