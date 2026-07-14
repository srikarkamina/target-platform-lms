import React from "react";
import { Bell, BellOff } from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string | Date;
}

interface NotificationSummaryProps {
  notifications: NotificationItem[];
  loading?: boolean;
  onMarkRead?: (id: string) => void;
}

export default function NotificationSummary({
  notifications,
  loading = false,
  onMarkRead,
}: NotificationSummaryProps) {
  const formatTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl animate-pulse flex items-start gap-3">
            <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 w-1/4 bg-slate-100 dark:bg-slate-800 rounded"></div>
              <div className="h-2.5 w-3/4 bg-slate-100 dark:bg-slate-800 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        <BellOff className="h-8 w-8 text-slate-350 dark:text-slate-655 mb-2" />
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">All caught up!</h4>
        <p className="text-xs text-slate-455 dark:text-slate-500 mt-0.5">
          No unread notifications at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-150 dark:border-slate-800/80 shadow-xs hover:border-slate-200 dark:hover:border-slate-700/80 transition-colors"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50/80 text-indigo-650 dark:bg-indigo-950/20 dark:text-indigo-400 mt-0.5">
            <Bell className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate leading-snug">
                {item.title}
              </h4>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                {formatTime(item.createdAt)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {item.message}
            </p>
            {onMarkRead && (
              <button
                onClick={() => onMarkRead(item.id)}
                className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 dark:text-indigo-455 dark:hover:text-indigo-400 mt-2 transition-colors cursor-pointer"
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
