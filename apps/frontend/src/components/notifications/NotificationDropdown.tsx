import { Notification } from "../../lib/api";
import { NotificationItem } from "./NotificationItem";
import { RefreshCw, BellOff, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import Link from "next/link";

interface NotificationDropdownProps {
  notifications: Notification[];
  isLoading: boolean;
  onRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onRefresh: () => void;
  isOpen: boolean;
}

export function NotificationDropdown({
  notifications,
  isLoading,
  onRead,
  onMarkAllAsRead,
  onRefresh,
  isOpen,
}: NotificationDropdownProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[100] animate-in fade-in zoom-in duration-200 origin-top-right">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAllAsRead();
            }}
            disabled={isLoading || notifications.filter(n => !n.isRead).length === 0}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 px-2 py-1.5 rounded-lg transition-all disabled:opacity-30"
          >
            Mark all read
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            disabled={isLoading}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={cn(isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
            <p className="text-sm text-slate-500">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={onRead}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <BellOff size={20} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-900">All caught up!</p>
            <p className="text-xs text-slate-500 mt-1">
              You have no notifications at the moment.
            </p>
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t border-slate-100 text-center bg-slate-50/30">
          <Link 
            href="/seller"
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            onClick={() => onRefresh()}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
