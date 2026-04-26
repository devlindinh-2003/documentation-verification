'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, VerificationRecord } from '../../lib/api';
import axios from 'axios';
import { UploadDropzone } from '../../components/UploadDropzone';
import { StatusBadge } from '../../components/StatusBadge';
import { STATUS_CONFIG } from '../../lib/status-config';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FileText, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function SellerPage() {
  const { user, isAuthenticated, role } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Route protection
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (role !== 'seller') {
      router.push('/admin');
    }
  }, [isAuthenticated, role, router]);

  const { data: verification, isLoading } = useQuery<VerificationRecord | null>({
    queryKey: ['my-verification'],
    queryFn: async () => {
      try {
        const { data } = await api.get<VerificationRecord>('/documents/my');
        return data;
      } catch (error: any) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    // Poll every 5s if we're in a non-terminal state
    refetchInterval: (query) => {
      const state = query.state.data?.status;
      if (state === 'pending' || state === 'processing' || state === 'inconclusive') {
        return 5000;
      }
      return false;
    },
    enabled: isAuthenticated && role === 'seller',
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // 1. Get presigned URL
      const { data: uploadData } = await api.post<{ uploadUrl: string; documentKey: string }>('/documents/upload-url', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      // 2. Upload file directly
      await axios.put(uploadData.uploadUrl, file, {
        headers: { 'Content-Type': file.type },
      });

      // 3. Confirm upload
      await api.post('/documents/confirm', { documentKey: uploadData.documentKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-verification'] });
    },
  });

  if (!isAuthenticated || role !== 'seller') return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Seller Dashboard</h1>
          <p className="mt-2 text-slate-500">Manage your account verification status.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : !verification ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-slate-800">Verification Required</h2>
              <p className="mt-2 text-slate-500 max-w-lg mx-auto">
                Before you can list products on our marketplace, we need to verify your identity. Please upload a valid document (e.g. Business License or ID).
              </p>
            </div>
            
            <UploadDropzone 
              onUpload={async (file) => {
                await uploadMutation.mutateAsync(file);
              }} 
            />
            
            {uploadMutation.isError && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                <AlertCircle size={20} />
                <span>Failed to upload document. Please try again.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Current Status</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Submitted on {format(new Date(verification.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <StatusBadge status={verification.status} />
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
              <div className={`p-6 rounded-xl border ${
                ['rejected', 'denied'].includes(verification.status) 
                  ? 'bg-red-50 border-red-100 text-red-800'
                  : ['verified', 'approved'].includes(verification.status)
                  ? 'bg-green-50 border-green-100 text-green-800'
                  : 'bg-blue-50 border-blue-100 text-blue-800'
              }`}>
                <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                  <FileText size={20} />
                  {STATUS_CONFIG[verification.status].label}
                </h3>
                <p>{STATUS_CONFIG[verification.status].message}</p>
                
                {['pending', 'processing', 'inconclusive'].includes(verification.status) && (
                  <div className="mt-4 flex items-center gap-2 text-sm opacity-80">
                    <Clock size={16} />
                    <span className="animate-pulse">Waiting for update...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
