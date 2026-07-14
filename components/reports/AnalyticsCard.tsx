import React from "react";
import { LucideIcon } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export default function AnalyticsCard({
  title,
  description,
  icon: Icon,
  children,
  className = "",
}: AnalyticsCardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300 ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-indigo-600 shrink-0" />}
            <span className="truncate">{title}</span>
          </h3>
          {description && (
            <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center min-h-[220px]">
        {children}
      </div>
    </div>
  );
}
