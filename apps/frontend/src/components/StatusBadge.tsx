import { STATUS_CONFIG } from '../lib/status-config';
import { VerificationStatus } from '../types';

interface StatusBadgeProps {
  status?: VerificationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status || !STATUS_CONFIG[status]) return null;

  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors duration-200 ${config.color}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${
          config.theme === 'blue'
            ? 'bg-blue-400'
            : config.theme === 'green'
              ? 'bg-green-400'
              : config.theme === 'red'
                ? 'bg-red-400'
                : config.theme === 'yellow'
                  ? 'bg-yellow-400'
                  : 'bg-slate-400'
        }`}
      />
      {config.label}
    </span>
  );
}
