import { jwtDecode } from 'jwt-decode';
import { create } from 'zustand';

import { clearTokens, getAccessToken, setTokens } from '../lib/auth';
import { AuthRole, JWTPayload, User } from '../types';

interface AuthState {
  user: User | null;
  role: AuthRole | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  init: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  role: null,
  isAuthenticated: false,
  isInitialized: false,

  login: (accessToken: string, refreshToken: string) => {
    if (!accessToken) {
      console.error('Login failed: Access token is missing');
      return;
    }
    setTokens(accessToken, refreshToken);
    try {
      const decoded = jwtDecode<JWTPayload>(accessToken);
      const user: User = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
      set({ user, role: user.role, isAuthenticated: true });
    } catch (e) {
      console.error('Failed to parse token', e);
    }
  },

  logout: () => {
    clearTokens();
    set({ user: null, role: null, isAuthenticated: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  init: () => {
    if (typeof window === 'undefined') {
      set({ isInitialized: true });
      return;
    }

    const token = getAccessToken();
    if (token) {
      try {
        const decoded = jwtDecode<JWTPayload>(token);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (!isExpired) {
          const user: User = {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role,
          };
          set({
            user,
            role: user.role,
            isAuthenticated: true,
            isInitialized: true,
          });
        } else {
          clearTokens();
          set({
            user: null,
            role: null,
            isAuthenticated: false,
            isInitialized: true,
          });
        }
      } catch (e) {
        console.error('Auth initialization failed', e);
        clearTokens();
        set({
          user: null,
          role: null,
          isAuthenticated: false,
          isInitialized: true,
        });
      }
    } else {
      set({
        user: null,
        role: null,
        isAuthenticated: false,
        isInitialized: true,
      });
    }
  },
}));
