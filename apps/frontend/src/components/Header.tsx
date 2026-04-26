'use client';

import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, ShieldCheck, FileCheck } from 'lucide-react';

export function Header() {
  const { isAuthenticated, user, role, logout } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
              <ShieldCheck className="text-white" size={20} />
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              VeriFlow
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {role === 'admin' ? (
              <Link 
                href="/admin" 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                Admin Queue
              </Link>
            ) : (
              <Link 
                href="/seller" 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                My Verifications
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-sm font-semibold text-slate-900">{user?.email}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
              {role}
            </span>
          </div>

          <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent hover:border-red-100"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
