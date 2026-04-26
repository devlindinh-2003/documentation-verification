'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, AuditEvent, VerificationRecord } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuditTimeline } from '../../../components/AuditTimeline';
import { DecisionPanel } from '../../../components/DecisionPanel';
import { StatusBadge } from '../../../components/StatusBadge';
import { format } from 'date-fns';
import { ArrowLeft, FileText, Lock, ShieldAlert } from 'lucide-react';
import Link from 'next/navigation';

export default function AdminRecordPage() {
  const { isAuthenticated, role, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [conflictError, setConflictError] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (role !== 'admin') {
      router.push('/seller');
    }
  }, [isAuthenticated, role, router]);

  const { data: record, isLoading: loadingRecord } = useQuery({
    queryKey: ['admin-verification', id],
    queryFn: async () => {
      const { data } = await api.get<VerificationRecord>(`/admin/verifications/${id}`);
      return data;
    },
    enabled: !!id && isAuthenticated && role === 'admin',
    retry: false,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['admin-history', id],
    queryFn: async () => {
      const { data } = await api.get<AuditEvent[]>(`/admin/verifications/${id}/history`);
      return data;
    },
    enabled: !!id && isAuthenticated && role === 'admin',
  });

  const { data: documentData, isLoading: loadingDoc } = useQuery({
    queryKey: ['admin-document', id],
    queryFn: async () => {
      const { data } = await api.get<{ url: string }>(`/admin/verifications/${id}/document`);
      return data;
    },
    enabled: !!id && isAuthenticated && role === 'admin',
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<VerificationRecord>(`/admin/verifications/${id}/claim`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verification', id] });
    },
  });

  const decisionMutation = useMutation({
    mutationFn: async ({ decision, reason }: { decision: 'approved' | 'denied', reason: string }) => {
      const version = (record as any)?.version || 1; 
      const { data } = await api.post<VerificationRecord>(`/admin/verifications/${id}/decision`, {
        decision,
        reason,
        version,
      });
      return data;
    },
    onSuccess: () => {
      setConflictError(false);
      queryClient.invalidateQueries({ queryKey: ['admin-verification', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-history', id] });
    },
    onError: (error: any) => {
      if (error?.response?.status === 409) {
        setConflictError(true);
        // Refresh data to show latest state
        queryClient.invalidateQueries({ queryKey: ['admin-verification', id] });
        queryClient.invalidateQueries({ queryKey: ['admin-history', id] });
      } else {
        throw error;
      }
    }
  });

  if (!isAuthenticated || role !== 'admin') return null;

  const handleClaim = () => {
    claimMutation.mutate();
  };

  const isLoading = loadingRecord || loadingHistory || loadingDoc;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mt-12"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16 px-4">
        <div className="max-w-4xl mx-auto text-center mt-12">
          <p className="text-slate-500">Record not found.</p>
          <button onClick={() => router.push('/admin')} className="mt-4 text-blue-600 hover:underline">
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  const isLockedByMe = record?.lockedBy === user?.id;
  const isLockedByOther = record?.lockedBy && !isLockedByMe;
  const isTerminal = ['verified', 'rejected', 'approved', 'denied'].includes(record?.status || '');

  return (
    <div className="min-h-screen bg-slate-50 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <button 
          onClick={() => router.push('/admin')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} /> Back to Queue
        </button>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Main Content: Record & Document */}
          <div className="flex-1 space-y-6">
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-wrap justify-between items-start gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 font-mono">
                    Record: {record?.id?.substring(0, 8)}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    Submitted on {record?.createdAt ? format(new Date(record.createdAt), 'MMM d, yyyy h:mm a') : '—'}
                  </p>
                </div>
                <StatusBadge status={record?.status} />
              </div>

              {isLockedByOther && !isTerminal && (
                <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 text-amber-800 flex items-center gap-2 text-sm">
                  <Lock size={16} />
                  <span>This record is currently being reviewed by another admin.</span>
                </div>
              )}

              {conflictError && (
                <div className="px-6 py-4 bg-red-50 border-b border-red-100 text-red-800 flex items-start gap-3">
                  <ShieldAlert size={20} className="mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm">Concurrent Modification Detected</h4>
                    <p className="text-sm mt-1">This record was updated by another admin while you were reviewing it. The page has been refreshed with the latest data.</p>
                  </div>
                </div>
              )}

              <div className="p-6 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
                  <FileText size={18} /> Document Preview
                </h3>
                
                {documentData?.url ? (
                  <div className="bg-slate-200 rounded-lg aspect-[3/4] sm:aspect-video md:aspect-[3/4] xl:aspect-video w-full overflow-hidden border border-slate-300 relative flex items-center justify-center">
                    {/* Basic check for images vs pdf based on URL extension could go here, fallback to iframe */}
                    <iframe 
                      src={documentData.url} 
                      className="absolute inset-0 w-full h-full"
                      title="Document Preview"
                    />
                  </div>
                ) : (
                  <div className="bg-slate-100 rounded-lg p-12 text-center text-slate-500 border border-slate-200">
                    Document preview not available.
                  </div>
                )}
              </div>
            </div>

            {record?.status === 'inconclusive' && !isTerminal && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                {!record?.lockedBy ? (
                  <div className="text-center py-6">
                    <p className="text-slate-600 mb-4">You need to claim this record to submit a decision.</p>
                    <button
                      onClick={handleClaim}
                      disabled={claimMutation.isPending}
                      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {claimMutation.isPending ? 'Claiming...' : 'Claim for Review'}
                    </button>
                  </div>
                ) : isLockedByMe ? (
                  <DecisionPanel 
                    onSubmit={async (decision, reason) => {
                      await decisionMutation.mutateAsync({ decision, reason });
                    }} 
                  />
                ) : null}
              </div>
            )}
          </div>

          {/* Sidebar: Audit History */}
          <div className="w-full md:w-80 lg:w-96 shrink-0 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-800">Audit History</h3>
              </div>
              <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <AuditTimeline events={history || []} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
