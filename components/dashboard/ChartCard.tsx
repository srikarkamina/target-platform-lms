import React from "react";
import { LucideIcon } from "lucide-react";

interface ChartCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export default function ChartCard({
  title,
  description,
  icon: Icon,
  children,
  action,
}: ChartCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex gap-3">
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-55/70 text-slate-700 dark:bg-slate-800 dark:text-slate-350">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div>
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-slate-450 dark:text-slate-400 mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="flex-1 w-full min-h-[200px] flex flex-col justify-end">
        {children}
      </div>
    </div>
  );
}
