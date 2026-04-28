import { VerificationStatus } from '../types';

export const STATUS_CONFIG: Record<
  VerificationStatus,
  {
    label: string;
    color: string;
    message: string;
    theme: 'blue' | 'green' | 'red' | 'yellow' | 'slate';
  }
> = {
  pending: {
    label: 'Waiting for review',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    message: 'Your submission is in the queue.',
    theme: 'slate',
  },
  processing: {
    label: 'Processing...',
    color: 'bg-blue-50 text-blue-700 border-blue-100',
    message: 'We are currently verifying your identity.',
    theme: 'blue',
  },
  verified: {
    label: 'Verified',
    color: 'bg-green-50 text-green-700 border-green-100',
    message: 'Identity verification successful.',
    theme: 'green',
  },
  rejected: {
    label: 'System Rejected',
    color: 'bg-red-50 text-red-700 border-red-100',
    message: 'Automated verification was unsuccessful.',
    theme: 'red',
  },
  inconclusive: {
    label: 'Needs review',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    message: 'Requires manual verification by our team.',
    theme: 'yellow',
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-200',
    message: 'Verification approved by administrator.',
    theme: 'green',
  },
  denied: {
    label: 'Admin Denied',
    color: 'bg-red-100 text-red-800 border-red-200',
    message: 'Verification denied after manual review.',
    theme: 'red',
  },
};
