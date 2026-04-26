import { VerificationStatus, STATUS_CONFIG } from '../lib/status-config';

interface StatusBadgeProps {
  status: VerificationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${config.color} shadow-sm`}>
      {config.label}
    </span>
  );
}
