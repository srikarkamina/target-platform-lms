import React from "react";
import { User, BookOpen, Award, Scroll, ClipboardList, HelpCircle, ShieldAlert } from "lucide-react";

interface ActivityItem {
  id: string;
  user: string;
  userRole: string;
  action: string;
  module: string;
  description: string;
  timestamp: string | Date;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  loading?: boolean;
}

export default function RecentActivity({ activities, loading = false }: RecentActivityProps) {
  const getModuleBadge = (moduleName: string) => {
    const norm = moduleName.toLowerCase();
    if (norm.includes("user") || norm.includes("student") || norm.includes("faculty")) {
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50",
        icon: User,
      };
    }
    if (norm.includes("course") || norm.includes("batch")) {
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
        icon: BookOpen,
      };
    }
    if (norm.includes("certificate")) {
      return {
        bg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50",
        icon: Scroll,
      };
    }
    if (norm.includes("quiz") || norm.includes("test")) {
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50",
        icon: Award,
      };
    }
    if (norm.includes("submission") || norm.includes("assignment")) {
      return {
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50",
        icon: ClipboardList,
      };
    }
    return {
      bg: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800",
      icon: HelpCircle,
    };
  };

  const timeAgo = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="flex gap-4 items-center animate-pulse">
            <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-800 rounded"></div>
              <div className="h-2 w-1/2 bg-slate-100 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="h-2 w-12 bg-slate-100 dark:bg-slate-800 rounded shrink-0"></div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ShieldAlert className="h-8 w-8 text-slate-300 dark:text-slate-650 mb-2" />
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No activity yet</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          New system actions and events will show up in this feed.
        </p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((item, idx) => {
          const badge = getModuleBadge(item.module);
          const BadgeIcon = badge.icon;
          return (
            <li key={item.id || idx}>
              <div className="relative pb-8">
                {idx !== activities.length - 1 && (
                  <span
                    className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3 items-start">
                  <div>
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border ${badge.bg}`}
                    >
                      <BadgeIcon className="h-5 w-5 shrink-0" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-850 dark:text-slate-100">
                        {item.description}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                        by <span className="font-semibold text-slate-600 dark:text-slate-400">{item.user}</span> ({item.userRole.toLowerCase()})
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap bg-slate-50 dark:bg-slate-850 px-2 py-0.5 rounded-md">
                        {timeAgo(item.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
