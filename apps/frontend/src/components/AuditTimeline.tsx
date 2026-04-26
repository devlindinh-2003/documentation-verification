import { AuditEvent } from '../lib/api';
import { format } from 'date-fns';
import { User, Shield, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface AuditTimelineProps {
  events: AuditEvent[];
}

export function AuditTimeline({ events }: AuditTimelineProps) {
  if (!events || events.length === 0) return <div className="text-sm text-slate-500">No history available</div>;

  const getIcon = (type: string) => {
    if (type.includes('reject') || type.includes('denied')) return <XCircle className="text-red-500" size={16} />;
    if (type.includes('verify') || type.includes('approve')) return <CheckCircle className="text-green-500" size={16} />;
    if (type.includes('inconclusive')) return <AlertTriangle className="text-yellow-500" size={16} />;
    if (type.includes('admin')) return <User className="text-blue-500" size={16} />;
    return <Shield className="text-slate-500" size={16} />;
  };

  return (
    <div className="space-y-6">
      {events.map((event, index) => (
        <div key={event.id} className="relative flex gap-4">
          {index !== events.length - 1 && (
            <div className="absolute top-8 left-4 bottom-[-16px] w-px bg-slate-200"></div>
          )}
          <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shadow-sm shrink-0">
            {getIcon(event.eventType)}
          </div>
          <div className="flex-1 pt-1.5 pb-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {event.eventType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{event.fromStatus}</span>
                  <ArrowRight size={12} className="text-slate-400" />
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{event.toStatus}</span>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                {format(new Date(event.createdAt), 'MMM d, h:mm a')}
              </div>
            </div>
            
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <User size={12} />
                {event.actorRole === 'system' ? 'System' : `User ${event.actorId.substring(0, 6)}`}
              </span>
            </div>
            
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-600 overflow-x-auto border border-slate-100">
                <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
