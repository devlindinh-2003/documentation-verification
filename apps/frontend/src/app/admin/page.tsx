'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, PaginatedResult, VerificationRecord } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { AdminTable } from '../../components/AdminTable';
import { VerificationStatus } from '../../lib/status-config';

export default function AdminPage() {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();
  
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (role !== 'admin') {
      router.push('/seller');
    }
  }, [isAuthenticated, role, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications', statusFilter],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResult<VerificationRecord>>('/admin/verifications', {
        params: { status: statusFilter || undefined, limit: 50, offset: 0 },
      });
      return data;
    },
    enabled: isAuthenticated && role === 'admin',
    refetchInterval: 10000, // Poll every 10s to see new items
  });

  if (!isAuthenticated || role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
            <p className="mt-2 text-slate-500">Review and manage seller verifications.</p>
          </div>
          
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            {[
              { id: '', label: 'All' },
              { id: 'inconclusive', label: 'Needs Review' },
              { id: 'pending', label: 'Pending' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  statusFilter === tab.id 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : data ? (
            <AdminTable data={data.data} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
