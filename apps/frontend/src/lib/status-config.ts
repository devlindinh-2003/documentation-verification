export type VerificationStatus = 
  | 'pending'
  | 'processing'
  | 'verified'
  | 'rejected'
  | 'inconclusive'
  | 'approved'
  | 'denied';

export const STATUS_CONFIG: Record<VerificationStatus, { label: string; color: string; message: string }> = {
  pending: {
    label: 'Pending',
    color: 'bg-slate-500',
    message: 'Your document is in the queue.',
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-500',
    message: 'Your document is currently being verified. This may take up to 24 hours.',
  },
  verified: {
    label: 'Verified',
    color: 'bg-green-500',
    message: 'Your document was automatically verified! You can now start selling.',
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-500',
    message: 'Your document could not be verified automatically and was rejected.',
  },
  inconclusive: {
    label: 'In Review',
    color: 'bg-yellow-500',
    message: 'We need a little more time to review your document. Our team is looking into it.',
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-600',
    message: 'Good news! Our team has manually approved your document.',
  },
  denied: {
    label: 'Denied',
    color: 'bg-red-600',
    message: 'Unfortunately, your document was denied after manual review.',
  },
};
