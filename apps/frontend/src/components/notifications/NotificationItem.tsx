import { Notification } from "../../lib/api";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, XCircle, AlertCircle, Clock, FileText } from "lucide-react";
import { VerificationStatus } from "../../lib/status-config";
import { cn } from "../../lib/utils";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

const statusIcons: Record<VerificationStatus, React.ReactNode> = {
  pending: <Clock className="text-blue-500" size={16} />,
  processing: <Clock className="text-blue-500" size={16} />,
  verified: <CheckCircle2 className="text-green-500" size={16} />,
  approved: <CheckCircle2 className="text-green-500" size={16} />,
  rejected: <XCircle className="text-red-500" size={16} />,
  denied: <XCircle className="text-red-500" size={16} />,
  inconclusive: <AlertCircle className="text-amber-500" size={16} />,
};

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "p-4 border-b border-slate-100 last:border-0 cursor-pointer transition-colors duration-200 hover:bg-slate-50",
        !notification.isRead && "bg-blue-50/30 hover:bg-blue-50/50"
      )}
    >
      <div className="flex gap-3">
        <div className="mt-1 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            {statusIcons[notification.metadata.status] || <FileText size={16} className="text-slate-400" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "text-sm font-semibold truncate",
              notification.isRead ? "text-slate-700" : "text-slate-900"
            )}>
              {notification.title}
            </h4>
            {!notification.isRead && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
            {notification.body}
          </p>
          <span className="text-[10px] text-slate-400 mt-2 block">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}
