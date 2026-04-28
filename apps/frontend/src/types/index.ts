export * from './api';

export type VerificationStatus =
  | 'pending'
  | 'processing'
  | 'verified'
  | 'rejected'
  | 'inconclusive'
  | 'approved'
  | 'denied';

export type AuthRole = 'seller' | 'admin';

export interface User {
  id: string;
  email: string;
  role: AuthRole;
}

export interface VerificationRecord {
  id: string;
  status: VerificationStatus;
  sellerId: string;
  externalJobId?: string | null;
  documentKey: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  lockedBy?: string | null;
  lockedAt?: string | null;
}

export interface AuditEvent {
  id: string;
  recordId: string;
  actorId: string;
  actorRole: AuthRole;
  eventType: string;
  fromStatus: string;
  toStatus: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'VERIFICATION_RESULT';
  isRead: boolean;
  readAt: string | null;
  metadata: {
    recordId: string;
    status: VerificationStatus;
  };
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: AuthRole;
  exp: number;
}
