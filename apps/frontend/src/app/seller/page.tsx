'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationService } from '../../services/verification.service';
import axios from 'axios';
import { UploadDropzone } from '../../components/UploadDropzone';
import { StatusBadge } from '../../components/StatusBadge';
import { STATUS_CONFIG } from '../../lib/status-config';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FileText, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { VerificationRecord, ApiResponse } from '../../types';

export default function SellerPage() {
  const { isAuthenticated, role, isInitialized } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push('/login');
    } else if (role !== 'seller') {
      router.push('/admin');
    }
  }, [isInitialized, isAuthenticated, role, router]);

  const { data: verificationsResponse, isLoading } = useQuery<ApiResponse<VerificationRecord[]>>({
    queryKey: ['my-verifications'],
    queryFn: () => verificationService.getMyVerifications(),
    refetchInterval: (query) => {
      const hasActive = query.state.data?.data?.some((v) =>
        ['pending', 'processing', 'inconclusive'].includes(v.status),
      );
      return hasActive ? 5000 : false;
    },
    enabled: isAuthenticated && role === 'seller',
  });

  const verifications = verificationsResponse?.data;

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data } = await verificationService.getUploadUrl({
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });

      await axios.put(data.uploadUrl, file, {
        headers: { 'Content-Type': file.type },
      });

      await verificationService.confirmUpload(data.documentKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-verifications'] });
    },
  });

  if (!isInitialized || !isAuthenticated || role !== 'seller') return null;

  const latestVerification = verifications?.[0];

  const activeCount =
    verifications?.filter((v) => ['pending', 'processing', 'inconclusive'].includes(v.status))
      .length || 0;
  const MAX_PENDING = 5;
  const isLimitReached = activeCount >= MAX_PENDING;

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/10 rounded-2xl mb-2">
            <ShieldCheck className="text-blue-600" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Verify Your Identity</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            To ensure a safe marketplace, we require all sellers to verify their identity. Upload a
            valid government-issued ID to get started.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-400">Loading your profile...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10">
            {latestVerification && (
              <div
                className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-500 p-8 sm:p-10 ${
                  STATUS_CONFIG[latestVerification.status].theme === 'green'
                    ? 'bg-green-50/50 border-green-200'
                    : STATUS_CONFIG[latestVerification.status].theme === 'red'
                      ? 'bg-red-50/50 border-red-200'
                      : STATUS_CONFIG[latestVerification.status].theme === 'yellow'
                        ? 'bg-yellow-50/50 border-yellow-200'
                        : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
                }`}
              >
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-4">
                    <StatusBadge status={latestVerification.status} />
                    <h2 className="text-2xl font-bold text-slate-900">
                      {STATUS_CONFIG[latestVerification.status].label}
                    </h2>
                    <p className="text-slate-600 leading-relaxed max-w-md">
                      {STATUS_CONFIG[latestVerification.status].message}
                    </p>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      Last Updated:{' '}
                      {format(
                        new Date(latestVerification.updatedAt || latestVerification.createdAt),
                        'MMM d, h:mm a',
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {[
                      { label: 'Submitted', done: true },
                      {
                        label: 'Processing',
                        done: [
                          'processing',
                          'verified',
                          'rejected',
                          'inconclusive',
                          'approved',
                          'denied',
                        ].includes(latestVerification.status),
                      },
                      {
                        label: 'Verified',
                        done: ['verified', 'approved'].includes(latestVerification.status),
                      },
                    ].map((step, i, arr) => (
                      <div key={step.label} className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
                            step.done
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-white border-slate-200 text-slate-300'
                          }`}
                        >
                          {step.done ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <span className="text-xs font-bold">{i + 1}</span>
                          )}
                        </div>
                        {i < arr.length - 1 && (
                          <div
                            className={`w-8 h-1 transition-colors duration-500 ${
                              arr[i + 1].done ? 'bg-green-500' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`absolute -right-20 -bottom-20 w-64 h-64 rounded-full blur-3xl opacity-10 ${
                    STATUS_CONFIG[latestVerification.status].theme === 'green'
                      ? 'bg-green-500'
                      : STATUS_CONFIG[latestVerification.status].theme === 'red'
                        ? 'bg-red-500'
                        : STATUS_CONFIG[latestVerification.status].theme === 'yellow'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                  }`}
                />
              </div>
            )}

            {(!latestVerification ||
              ['rejected', 'denied'].includes(latestVerification.status)) && (
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="p-8 sm:p-12 border-b border-slate-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {isLimitReached ? 'Upload Limit Reached' : 'Upload Document'}
                      </h2>
                      <p className="text-sm font-medium text-slate-500 mt-1">
                        Please provide a clear photo of your ID.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                      <Clock size={14} />
                      EST. WAIT: 2-5 MIN
                    </div>
                  </div>
                </div>
                <div className="p-8 sm:p-12">
                  <UploadDropzone
                    onUpload={async (file) => {
                      await uploadMutation.mutateAsync(file);
                    }}
                    disabled={isLimitReached}
                    disabledMessage={`You have ${activeCount} active verification requests. Please wait.`}
                  />
                </div>
              </div>
            )}

            {verifications && verifications.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="text-primary" size={20} />
                    Submission History
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">
                    {verifications.length} Documents
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {verifications.map((v) => (
                    <div
                      key={v.id}
                      className="group bg-white p-6 rounded-3xl border border-slate-200 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors shrink-0 ${
                                STATUS_CONFIG[v.status].theme === 'green'
                                  ? 'bg-green-50 border-green-100 text-green-600'
                                  : STATUS_CONFIG[v.status].theme === 'red'
                                    ? 'bg-red-50 border-red-100 text-red-600'
                                    : 'bg-blue-50 border-blue-100 text-blue-600'
                              }`}
                            >
                              <FileText size={24} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[15px] font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                                {STATUS_CONFIG[v.status].label}
                              </p>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter mt-1">
                                SUBMITTED {format(new Date(v.createdAt), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0">
                            <StatusBadge status={v.status} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && (!verifications || verifications.length === 0) && (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <FileText size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">No verifications yet</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">
                    Upload your first document to verify your identity and start selling.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
