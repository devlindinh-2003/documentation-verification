'use client';

import { useState } from 'react';
import { Copy, Check, LogIn, Mail, Lock } from 'lucide-react';

interface DemoCredentialsProps {
  credentials: {
    email: string;
    password: 'password123';
  };
  onLogin: () => void;
  loading: boolean;
}

export function DemoCredentials({ credentials, onLogin, loading }: DemoCredentialsProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const copyToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 p-6 bg-slate-900 rounded-[32px] shadow-2xl border border-slate-800 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h3 className="text-white font-black text-sm uppercase tracking-widest">
            Demo Account Ready
          </h3>
          <p className="text-slate-400 text-[11px] font-bold">
            Use these credentials to explore the system.
          </p>
        </div>

        <div className="space-y-3">
          {/* Email Row */}
          <div className="group relative bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 transition-all hover:border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-primary transition-colors">
                  <Mail size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Email
                  </span>
                  <span className="text-xs font-bold text-slate-200">{credentials.email}</span>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(credentials.email, setCopiedEmail)}
                className="p-2 text-slate-500 hover:text-white transition-colors"
                title="Copy Email"
              >
                {copiedEmail ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Password Row */}
          <div className="group relative bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 transition-all hover:border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400 group-hover:text-primary transition-colors">
                  <Lock size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Password
                  </span>
                  <span className="text-xs font-bold text-slate-200">{credentials.password}</span>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(credentials.password, setCopiedPassword)}
                className="p-2 text-slate-500 hover:text-white transition-colors"
                title="Copy Password"
              >
                {copiedPassword ? (
                  <Check size={16} className="text-green-400" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onLogin}
          disabled={loading}
          className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:translate-y-0 mt-2 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Authenticating...
            </span>
          ) : (
            <>
              Login with this account
              <LogIn size={16} strokeWidth={3} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
