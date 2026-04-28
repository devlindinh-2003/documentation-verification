'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { verificationService } from '../../services/verification.service';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { AdminTable } from '../../components/AdminTable';
import { LayoutGrid, Users, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { VerificationRecord, ApiResponse, PaginatedResult } from '../../types';

export default function AdminPage() {
  const { isAuthenticated, role, isInitialized } = useAuth();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push('/login');
    } else if (role !== 'admin') {
      router.push('/seller');
    }
  }, [isInitialized, isAuthenticated, role, router]);

  const { data: verificationsResponse, isLoading } = useQuery<
    ApiResponse<PaginatedResult<VerificationRecord>>
  >({
    queryKey: ['admin-verifications', statusFilter],
    queryFn: () => verificationService.getAdminVerifications({ status: statusFilter }),
    enabled: isAuthenticated && role === 'admin',
    refetchInterval: 10000,
  });

  const data = verificationsResponse?.data;

  // Fetch stats (simplified for now by using the full list, in real app would be separate endpoint)
  const { data: allRecordsResponse } = useQuery<ApiResponse<PaginatedResult<VerificationRecord>>>({
    queryKey: ['admin-stats'],
    queryFn: () => verificationService.getAdminVerifications({ limit: 100 }),
    enabled: isAuthenticated && role === 'admin',
  });

  const allRecords = allRecordsResponse?.data?.data || [];

  const stats = {
    total: allRecords.length,
    pending: allRecords.filter((r) => r.status === 'pending').length,
    processing: allRecords.filter((r) => r.status === 'processing').length,
    inconclusive: allRecords.filter((r) => r.status === 'inconclusive').length,
  };

  if (!isInitialized || !isAuthenticated || role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-tighter text-xs">
              <LayoutGrid size={14} />
              Admin Management
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Verification Queue
            </h1>
            <p className="text-slate-500 font-medium">
              Review and process seller identification documents.
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
            {[
              {
                label: 'Total',
                value: stats.total,
                icon: Users,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
              },
              {
                label: 'Pending',
                value: stats.pending,
                icon: Clock,
                color: 'text-slate-600',
                bg: 'bg-slate-100',
              },
              {
                label: 'Processing',
                value: stats.processing,
                icon: CheckCircle2,
                color: 'text-green-600',
                bg: 'bg-green-50',
              },
              {
                label: 'Review',
                value: stats.inconclusive,
                icon: AlertTriangle,
                color: 'text-amber-600',
                bg: 'bg-amber-50',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 min-w-[140px]"
              >
                <div
                  className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}
                >
                  <stat.icon size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-tighter text-slate-400">
                    {stat.label}
                  </p>
                  <p className="text-xl font-black text-slate-900 leading-none mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters & Table Section */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200/60 shadow-sm">
              {[
                { id: '', label: 'All Requests' },
                { id: 'inconclusive', label: 'Needs Review' },
                { id: 'pending', label: 'Pending' },
                { id: 'processing', label: 'Processing' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-tighter rounded-lg transition-all duration-200 ${
                    statusFilter === tab.id
                      ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-xs font-black uppercase tracking-tighter text-slate-400">
                Syncing with Queue...
              </p>
            </div>
          ) : (
            <AdminTable data={data?.data || []} />
          )}
        </div>
      </div>
    </div>
  );
}
