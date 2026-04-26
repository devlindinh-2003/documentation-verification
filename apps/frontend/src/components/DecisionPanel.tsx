'use client';

import { useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit decision');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800">Admin Decision Panel</h3>
      </div>
      
      <div className="p-6 space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Decision Reason (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={disabled || submitting !== null}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] outline-none transition disabled:bg-slate-50 disabled:text-slate-500"
            placeholder="Explain your decision..."
          />
        </div>
        
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleSubmit('denied')}
            disabled={disabled || submitting !== null}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 font-medium rounded-lg transition disabled:opacity-50"
          >
            {submitting === 'denied' ? (
              <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <X size={18} />
            )}
            Deny Document
          </button>
          
          <button
            onClick={() => handleSubmit('approved')}
            disabled={disabled || submitting !== null}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 font-medium rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {submitting === 'approved' ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Check size={18} />
            )}
            Approve Document
          </button>
        </div>
      </div>
    </div>
  );
}
