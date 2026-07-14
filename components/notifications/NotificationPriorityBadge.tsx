import { NotificationPriority } from "@/lib/notifications/types";

interface NotificationPriorityBadgeProps {
  priority: NotificationPriority;
}

export function NotificationPriorityBadge({ priority }: NotificationPriorityBadgeProps) {
  const styles = {
    [NotificationPriority.LOW]: "bg-slate-100 text-slate-700 border-slate-200",
    [NotificationPriority.NORMAL]: "bg-blue-50 text-blue-700 border-blue-200",
    [NotificationPriority.HIGH]: "bg-orange-50 text-orange-700 border-orange-200",
    [NotificationPriority.URGENT]: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-2xs font-bold tracking-wide uppercase shadow-2xs ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}
