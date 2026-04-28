'use client';

import { useState } from 'react';
import { mapErrorToMessage } from '../lib/error-messages';
import { Check, X, AlertCircle, MessageSquare, Loader2, ShieldCheck, ShieldX } from 'lucide-react';

interface DecisionPanelProps {
  onSubmit: (decision: 'approved' | 'denied', reason: string) => Promise<void>;
  disabled?: boolean;
}

export function DecisionPanel({ onSubmit, disabled }: DecisionPanelProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState<'approved' | 'denied' | null>(null);

  const handleSubmit = async (decision: 'approved' | 'denied') => {
    setError('');
    setSubmitting(decision);
    try {
      await onSubmit(decision, reason);
    } catch (err: unknown) {
      setError(mapErrorToMessage(err));
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden animate-in slide-in-from-bottom-2 duration-500">
      <div className="p-5 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tighter flex items-center gap-2">
          <Check size={16} strokeWidth={3} className="text-primary" />
          Review Decision
        </h3>
        <div className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
          Manual Action
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="p-4 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <MessageSquare size={14} />
            Reasoning & Internal Notes
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={disabled || submitting !== null}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-medium focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 min-h-[120px] outline-none transition-all duration-200 disabled:opacity-50 placeholder:text-slate-300"
            placeholder="Explain why this document was approved or denied. This will be recorded in the audit history..."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => handleSubmit('denied')}
            disabled={disabled || submitting !== null}
            className="flex-1 group relative flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-600 font-bold uppercase tracking-tighter text-xs rounded-2xl transition-all duration-200 disabled:opacity-50 overflow-hidden"
          >
            {submitting === 'denied' ? (
              <Loader2 className="animate-spin" size={18} strokeWidth={3} />
            ) : (
              <>
                <ShieldX
                  size={18}
                  strokeWidth={2.5}
                  className="group-hover:scale-110 transition-transform"
                />
                Reject Identity
              </>
            )}
          </button>

          <button
            onClick={() => handleSubmit('approved')}
            disabled={disabled || submitting !== null}
            className="flex-1 group relative flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white font-bold uppercase tracking-tighter text-xs rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:translate-y-0 overflow-hidden"
          >
            {submitting === 'approved' ? (
              <Loader2 className="animate-spin" size={18} strokeWidth={3} />
            ) : (
              <>
                <ShieldCheck
                  size={18}
                  strokeWidth={2.5}
                  className="group-hover:scale-110 transition-transform"
                />
                Approve Identity
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-center font-bold text-slate-400">
          This action is permanent and will notify the seller immediately.
        </p>
      </div>
    </div>
  );
}
