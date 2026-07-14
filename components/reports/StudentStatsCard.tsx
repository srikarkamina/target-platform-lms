import React from "react";
import { LucideIcon } from "lucide-react";

interface StudentStatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  color?: "blue" | "violet" | "indigo" | "emerald" | "rose" | "orange";
}

export default function StudentStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = "indigo",
}: StudentStatsCardProps) {
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
    <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-lg transition-all duration-300 ${selectedColor.hover}`}>
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${selectedColor.bg}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
          {title}
        </p>
        <h3 className="text-3xl font-black text-slate-800 mt-0.5 tracking-tight truncate">
          {value}
        </h3>
        <p className="text-[10px] text-slate-450 font-semibold mt-0.5 uppercase tracking-wider font-mono truncate">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
