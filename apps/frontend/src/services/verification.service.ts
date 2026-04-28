import { api } from '../lib/api';
import { VerificationRecord, PaginatedResult, ApiResponse, VerificationStatus } from '../types';

/**
 * Service for managing document verifications.
 * Handles both seller-facing upload flows and admin-facing review flows.
 */
export const verificationService = {
  /**
   * Fetches all verification records for the authenticated seller.
   * Records are sorted by creation date (newest first).
   */
  getMyVerifications: async (): Promise<ApiResponse<VerificationRecord[]>> => {
    const { data } = await api.get<VerificationRecord[]>('/documents');
    const sorted = data.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return { data: sorted };
  },

  /**
   * Phase 1 of upload: requests a presigned PUT URL from the backend.
   * This allows the browser to upload directly to S3 without proxying through the API.
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
   * Phase 2 of upload: notifies the backend that the file is in storage.
   * The backend will validate the file on S3 before creating the database record.
   */
  confirmUpload: async (documentKey: string): Promise<ApiResponse<void>> => {
    await api.post('/documents/confirm', { documentKey });
    return { data: undefined as void };
  },

  /**
   * [Admin] Retrieves a paginated list of all verifications for the admin dashboard.
   */
  getAdminVerifications: async (params: {
    status?: VerificationStatus;
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
   * [Admin] Claims a record to prevent multiple admins from reviewing the same document.
   * Uses optimistic locking (version) to handle concurrent claim attempts.
   */
  claimRecord: async (id: string, version: number): Promise<ApiResponse<void>> => {
    await api.post(`/admin/verifications/${id}/claim`, { version });
    return { data: undefined as void };
  },

  /**
   * [Admin] Submits a final manual decision for an inconclusive verification.
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
