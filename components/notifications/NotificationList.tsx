import { useMemo } from "react";
import { Notification } from "@/app/generated/prisma/client";
import { NotificationCard } from "./NotificationCard";
import { NotificationListSkeleton } from "./NotificationSkeleton";
import { EmptyNotifications } from "./EmptyNotifications";
import { groupNotifications } from "@/lib/notifications/grouping";
import { AlertCircle, RotateCcw } from "lucide-react";

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onRetry: () => void;
  isSearchActive: boolean;
  isUnreadFilterActive: boolean;
}

export function NotificationList({
  notifications,
  loading,
  error,
  onMarkRead,
  onDelete,
  onRetry,
  isSearchActive,
  isUnreadFilterActive,
}: NotificationListProps) {
  const grouped = useMemo(() => groupNotifications(notifications), [notifications]);

  const hasNotifications = notifications.length > 0;

  if (loading) {
    return <NotificationListSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-2xl border border-red-100 shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100 mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Failed to load notifications</h3>
        <p className="max-w-xs text-xs text-slate-500 leading-relaxed mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Try again</span>
        </button>
      </div>
    );
  }

  if (!hasNotifications) {
    if (isSearchActive) {
      return <EmptyNotifications type="search" />;
    }
    if (isUnreadFilterActive) {
      return <EmptyNotifications type="unread" />;
    }
    return <EmptyNotifications type="default" />;
  }

  const renderGroup = (title: string, groupNotifications: Notification[]) => {
    if (groupNotifications.length === 0) return null;
    return (
      <div className="space-y-3.5 animate-fade-in-up">
        <div className="flex items-center gap-3 px-2">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">{title}</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          {groupNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderGroup("Today", grouped.today)}
      {renderGroup("Yesterday", grouped.yesterday)}
      {renderGroup("Earlier", grouped.earlier)}
    </div>
  );
}
export default NotificationList;
