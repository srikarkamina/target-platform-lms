import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, ExternalLink } from "lucide-react";
import { Notification } from "@/lib/notifications/types";
import { getNotificationIcon } from "@/lib/notifications/icon";
import { formatNotificationTime } from "@/lib/notifications/time";
import { NotificationPriorityBadge } from "./NotificationPriorityBadge";

interface NotificationCardProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClickCloseDropdown?: () => void;
}

export function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
  onClickCloseDropdown,
}: NotificationCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const IconComponent = getNotificationIcon(notification.type);
  const timeFormatted = formatNotificationTime(notification.createdAt);

  const isInteractive = !!notification.actionUrl;

  const handleCardClick = () => {
    if (!isInteractive) return;

    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (onClickCloseDropdown) {
      onClickCloseDropdown();
    }
    router.push(notification.actionUrl!);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      setIsDeleting(true);
      setTimeout(() => {
        onDelete(notification.id);
      }, 300); // Matches globals.css fade-out-left animation duration
    }
  };

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkRead) {
      onMarkRead(notification.id);
    }
  };

  return (
    <div
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      onClick={isInteractive ? handleCardClick : undefined}
      className={`group relative flex gap-4 border-b border-slate-100 p-4 transition-all duration-200 ${
        isInteractive
          ? "cursor-pointer hover:bg-slate-50 focus:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-indigo-600"
          : "bg-white"
      } ${
        !notification.isRead
          ? "border-l-4 border-l-indigo-600 bg-indigo-50/10"
          : "bg-white"
      } ${isDeleting ? "animate-card-remove" : ""}`}
      aria-label={`Notification: ${notification.title}. ${notification.message}. Priority: ${notification.priority}. Status: ${
        notification.isRead ? "Read" : "Unread"
      }${isInteractive ? ". Press Enter or Space to open." : ""}`}
      role={isInteractive ? "button" : undefined}
    >
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 border border-slate-100 group-hover:bg-white group-focus:bg-white transition-colors">
        <IconComponent className="h-5 w-5 text-slate-500" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-8">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h4 className="text-sm font-semibold text-slate-900 truncate">
            {notification.title}
          </h4>
          <NotificationPriorityBadge priority={notification.priority} />
          {isInteractive && (
            <ExternalLink className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity" />
          )}
        </div>
        <p className="text-xs text-slate-600 leading-relaxed mb-2 break-words">
          {notification.message}
        </p>
        <span className="text-3xs font-medium text-slate-400 tracking-wide uppercase">
          {timeFormatted}
        </span>
      </div>

      {/* Actions (absolute positioning for visual alignment) */}
      <div className="absolute right-4 top-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
        {!notification.isRead && onMarkRead && (
          <button
            onClick={handleMarkRead}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-colors shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 cursor-pointer"
            title="Mark as read"
            aria-label="Mark notification as read"
          >
            <Check className="h-4 w-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-650 hover:border-red-100 transition-colors shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer"
            title="Delete notification"
            aria-label="Delete notification"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Static Unread Indicator Dot */}
      {!notification.isRead && (
        <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-indigo-600 group-hover:hidden group-focus:hidden" />
      )}
    </div>
  );
}
export default NotificationCard;
