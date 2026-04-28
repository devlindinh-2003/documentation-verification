'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { isAuthenticated, role, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace('/login');
    } else if (role === 'admin') {
      router.replace('/admin');
    } else if (role === 'seller') {
      router.replace('/seller');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, role, isInitialized, router]);

  // Show a clean loading state while checking authentication
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50/50">
      <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-2xl border-4 border-primary/20 border-t-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Verifying Session
          </p>
          <p className="text-[10px] font-bold text-slate-300">SECURE GATEWAY</p>
        </div>
      </div>
    </div>
  );
}
