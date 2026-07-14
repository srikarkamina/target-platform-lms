import { BellOff, Search, CheckCircle } from "lucide-react";

interface EmptyNotificationsProps {
  type?: "default" | "search" | "unread";
}

export function EmptyNotifications({ type = "default" }: EmptyNotificationsProps) {
  const configs = {
    default: {
      Icon: BellOff,
      title: "No notifications",
      description: "You're all caught up! When you receive alerts, they'll appear here.",
    },
    search: {
      Icon: Search,
      title: "No search results",
      description: "We couldn't find any notifications matching your search query.",
    },
    unread: {
      Icon: CheckCircle,
      title: "No unread notifications",
      description: "Excellent work! You have read all of your notifications.",
    },
  };

  const { Icon, title, description } = configs[type];

  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 mb-4">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="max-w-xs text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
