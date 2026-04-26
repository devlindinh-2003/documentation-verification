import { create } from 'zustand';
import { clearTokens, setTokens, getAccessToken } from '../lib/auth';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  role: 'seller' | 'admin';
}

interface AuthState {
  user: User | null;
  role: 'seller' | 'admin' | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  init: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  role: null,
  isAuthenticated: false,

  login: (accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken);
    try {
      const decoded = jwtDecode<User>(accessToken);
      set({ user: decoded, role: decoded.role, isAuthenticated: true });
    } catch (e) {
      console.error('Failed to parse token', e);
    }
  },

  logout: () => {
    clearTokens();
    set({ user: null, role: null, isAuthenticated: false });
    // Force a full page reload to clear all states and redirect
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  init: () => {
    if (typeof window === 'undefined') return;
    
    const token = getAccessToken();
    if (token) {
      try {
        const decoded = jwtDecode<User>(token);
        // Simple expiry check (assumes exp is in seconds)
        const isExpired = (decoded as any).exp * 1000 < Date.now();
        
        if (!isExpired) {
          set({ user: decoded, role: decoded.role, isAuthenticated: true });
        } else {
          // Token expired, attempt to clear or let axios interceptor handle refresh
          // For initial load, if it's expired we clear to be safe
          clearTokens();
          set({ user: null, role: null, isAuthenticated: false });
        }
      } catch (e) {
        console.error('Auth initialization failed', e);
        clearTokens();
        set({ user: null, role: null, isAuthenticated: false });
      }
    }
  },
}));
