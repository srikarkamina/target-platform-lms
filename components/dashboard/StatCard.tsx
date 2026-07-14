import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  trendType?: "up" | "down" | "neutral";
  loading?: boolean;
  color?: "indigo" | "blue" | "emerald" | "purple" | "rose" | "amber" | "slate";
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendType = "neutral",
  loading = false,
  color = "indigo",
}: StatCardProps) {
  const bgColors = {
    indigo: "bg-indigo-50/70 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400",
    blue: "bg-blue-50/70 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    emerald: "bg-emerald-50/70 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    purple: "bg-purple-50/70 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
    rose: "bg-rose-50/70 text-rose-650 dark:bg-rose-950/40 dark:text-rose-400",
    amber: "bg-amber-50/70 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    slate: "bg-slate-50/70 text-slate-650 dark:bg-slate-900/40 dark:text-slate-400",
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 animate-pulse">
        <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 shrink-0"></div>
        <div className="space-y-2 flex-1">
          <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
          <div className="h-7 w-12 bg-slate-100 dark:bg-slate-800 rounded"></div>
          <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bgColors[color]} font-semibold`}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
          {title}
        </p>
        <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1 tracking-tight">
          {value}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal truncate">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                trendType === "up"
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : trendType === "down"
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                  : "bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-450"
              }`}
            >
              {trend}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
