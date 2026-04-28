import { api } from '../lib/api';
import { VerificationRecord, PaginatedResult, ApiResponse } from '../types';

export const verificationService = {
  /**
   * Get all verification records for the current seller
   */
  getMyVerifications: async (): Promise<ApiResponse<VerificationRecord[]>> => {
    const { data } = await api.get<VerificationRecord[]>('/documents');
    const sorted = data.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return { data: sorted };
  },

  /**
   * Request a presigned URL for document upload
   */
  getUploadUrl: async (params: {
    fileName: string;
    mimeType: string;
    fileSize: number;
  }): Promise<ApiResponse<{ uploadUrl: string; documentKey: string }>> => {
    const { data } = await api.post<{
      uploadUrl: string;
      documentKey: string;
    }>('/documents/upload-url', params);
    return { data };
  },

  /**
   * Confirm document upload
   */
  confirmUpload: async (documentKey: string): Promise<ApiResponse<void>> => {
    await api.post('/documents/confirm', { documentKey });
    return { data: undefined as void };
  },

  /**
   * [Admin] Get all verification records with filters
   */
  getAdminVerifications: async (params: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<PaginatedResult<VerificationRecord>>> => {
    const { data } = await api.get<PaginatedResult<VerificationRecord>>('/admin/verifications', {
      params: {
        status: params.status || undefined,
        limit: params.limit || 50,
        offset: params.offset || 0,
      },
    });
    return { data };
  },

  /**
   * [Admin] Claim a verification record
   */
  claimRecord: async (id: string, version: number): Promise<ApiResponse<void>> => {
    await api.post(`/admin/verifications/${id}/claim`, { version });
    return { data: undefined as void };
  },

  /**
   * [Admin] Submit a decision for a verification record
   */
  submitDecision: async (
    id: string,
    params: {
      decision: 'approved' | 'denied';
      reason: string;
      version: number;
    },
  ): Promise<ApiResponse<void>> => {
    await api.post(`/admin/verifications/${id}/decision`, params);
    return { data: undefined as void };
  },
};
