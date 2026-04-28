import { AuditEvent } from '../types';
import { formatDistanceToNow, format } from 'date-fns';
import {
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Settings,
  Eye,
  Zap,
} from 'lucide-react';

interface AuditTimelineProps {
  events: AuditEvent[];
}

const EVENT_MAP: Record<string, { title: string; description: string; color: string; bg: string }> =
  {
    document_uploaded: {
      title: 'Document Uploaded',
      description: 'Submitted for review.',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    job_processing_started: {
      title: 'Processing Started',
      description: 'System verification started.',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    verification_automated_success: {
      title: 'Verified',
      description: 'Identity verified successfully.',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    verification_content_rejected: {
      title: 'Rejected',
      description: 'Automated verification failed.',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    verification_manual_review_required: {
      title: 'Review Required',
      description: 'Flagged for manual review.',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    claim_review: {
      title: 'Review Claimed',
      description: 'Administrator review started.',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    admin_decision: {
      title: 'Final Decision',
      description: 'Manual review completed.',
      color: 'text-slate-900',
      bg: 'bg-slate-100',
    },
  };

function EventItem({ event, isLast }: { event: AuditEvent; isLast: boolean }) {
  const getEventInfo = (type: string) => {
    return (
      EVENT_MAP[type] || {
        title: type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        description: 'System activity recorded',
        color: 'text-slate-600',
        bg: 'bg-slate-50',
      }
    );
  };

  const getIcon = (type: string) => {
    if (type.includes('reject') || type.includes('denied'))
      return <XCircle size={14} strokeWidth={3} />;
    if (type.includes('verify') || type.includes('approve'))
      return <CheckCircle size={14} strokeWidth={3} />;
    if (type.includes('inconclusive') || type.includes('required'))
      return <AlertTriangle size={14} strokeWidth={3} />;
    if (type.includes('claim')) return <Eye size={14} strokeWidth={3} />;
    if (type.includes('upload')) return <Upload size={14} strokeWidth={3} />;
    if (type.includes('started')) return <Zap size={14} strokeWidth={3} />;
    if (type.includes('admin')) return <User size={14} strokeWidth={3} />;
    return <Settings size={14} strokeWidth={3} />;
  };

  const info = getEventInfo(event.eventType);

  return (
    <div className="relative flex gap-4">
      {!isLast && (
        <div className="absolute top-8 left-[13px] bottom-[-16px] w-[2px] bg-slate-100"></div>
      )}

      <div
        className={`relative z-10 flex items-center justify-center w-[28px] h-[28px] rounded-lg border-2 border-white shadow-sm shrink-0 mt-0.5 ${info.bg} ${info.color}`}
      >
        {getIcon(event.eventType)}
      </div>

      <div className="flex-1 pb-8">
        <div className="flex justify-between items-baseline gap-2">
          <h4 className="text-[13px] font-bold text-slate-900 tracking-tight leading-tight">
            {info.title}
          </h4>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
            {formatDistanceToNow(new Date(event.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>

        <p className="text-[11px] font-medium text-slate-500 mt-1 leading-relaxed">
          {info.description}
        </p>

        <div className="mt-1 text-[9px] font-semibold text-slate-300 uppercase tracking-widest">
          {format(new Date(event.createdAt), 'HH:mm:ss · MMM d')}
        </div>
      </div>
    </div>
  );
}

export function AuditTimeline({ events }: AuditTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="py-12 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
        <Settings className="mx-auto text-slate-200 mb-2" size={32} />
        <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
          No activity logged.
        </p>
      </div>
    );
  }

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="pt-2">
      {sortedEvents.map((event, index) => (
        <EventItem key={event.id} event={event} isLast={index === sortedEvents.length - 1} />
      ))}
    </div>
  );
}
