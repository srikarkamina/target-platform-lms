import React from "react";
import { LucideIcon } from "lucide-react";

interface SubMetric {
  label: string;
  value: string | number;
}

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "violet" | "indigo" | "emerald" | "rose" | "orange";
  subMetrics?: SubMetric[];
}

export default function AdminStatsCard({
  title,
  value,
  icon: Icon,
  color = "indigo",
  subMetrics = [],
}: AdminStatsCardProps) {
  const colorMap = {
    blue: {
      bg: "bg-blue-50 text-blue-600 border-blue-100",
      hover: "hover:shadow-blue-100/50",
    },
    violet: {
      bg: "bg-violet-50 text-violet-600 border-violet-100",
      hover: "hover:shadow-violet-100/50",
    },
    indigo: {
      bg: "bg-indigo-50 text-indigo-600 border-indigo-100",
      hover: "hover:shadow-indigo-100/50",
    },
    emerald: {
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      hover: "hover:shadow-emerald-100/50",
    },
    rose: {
      bg: "bg-rose-50 text-rose-600 border-rose-100",
      hover: "hover:shadow-rose-100/50",
    },
    orange: {
      bg: "bg-orange-50 text-orange-600 border-orange-100",
      hover: "hover:shadow-orange-100/50",
    },
  };

  const selectedColor = colorMap[color];

  return (
    <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-lg transition-all duration-300 group ${selectedColor.hover}`}>
      <div className="flex items-center gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${selectedColor.bg} group-hover:scale-105 transition-transform`}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
            {title}
          </p>
          <h3 className="text-3xl font-black text-slate-800 mt-0.5 tracking-tight truncate">
            {value}
          </h3>
        </div>
      </div>

      {subMetrics.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] font-bold font-mono text-slate-450 uppercase tracking-wider">
          {subMetrics.map((sm, idx) => (
            <div key={idx} className="min-w-0">
              <span className="text-slate-400 block">{sm.label}</span>
              <span className="text-slate-700 font-extrabold text-xs block mt-0.5 truncate">{sm.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
