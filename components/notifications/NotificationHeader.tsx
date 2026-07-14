import { CheckCheck } from "lucide-react";

interface NotificationHeaderProps {
  unreadCount: number;
  onMarkAllAsRead: () => void;
  hasNotifications: boolean;
}

export function NotificationHeader({
  unreadCount,
  onMarkAllAsRead,
  hasNotifications,
}: NotificationHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 bg-white p-6 rounded-2xl shadow-xs">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Notification Center</h1>
        <p className="text-xs text-slate-500 mt-1">
          {unreadCount > 0 ? (
            <span>You have <strong className="text-indigo-600 font-semibold">{unreadCount}</strong> unread message{unreadCount > 1 ? "s" : ""}</span>
          ) : (
            <span>You have no unread notifications</span>
          )}
        </p>
      </div>

      {unreadCount > 0 && hasNotifications && (
        <button
          onClick={onMarkAllAsRead}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-100 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
        >
          <CheckCheck className="h-4 w-4" />
          <span>Mark all as read</span>
        </button>
      )}
    </div>
  );
}
export default NotificationHeader;
