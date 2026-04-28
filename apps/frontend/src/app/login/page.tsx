'use client';

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth.service';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { JWTPayload } from '../../types';
import { mapErrorToMessage } from '../../lib/error-messages';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuth((state) => state.login);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authService.login({
        email,
        password,
      });

      // The login helper from useAuth already handles JWT decoding and state updates
      login(data.access_token, data.refreshToken || '');

      // Decode locally just for routing decision
      const decoded = jwtDecode<JWTPayload>(data.access_token);

      if (decoded.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/seller');
      }
    } catch (err: unknown) {
      setError(mapErrorToMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50 p-4">
      <div className="w-full max-w-[440px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Logo Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-xl shadow-primary/20 mb-2">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">VeriFlow</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Secure Identity Gateway
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-10 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-200">
          <div className="space-y-2 mb-8">
            <h2 className="text-xl font-black text-slate-900">Welcome Back</h2>
            <p className="text-sm font-medium text-slate-500">
              Sign in to your dashboard to continue.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-2xl animate-in shake duration-500">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                  size={18}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"
                  size={18}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:translate-y-0 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Enter Dashboard
                  <ArrowRight size={16} strokeWidth={3} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs font-bold text-slate-400">
          Trusted by over 10,000+ businesses globally.
        </p>
      </div>
    </div>
  );
}
