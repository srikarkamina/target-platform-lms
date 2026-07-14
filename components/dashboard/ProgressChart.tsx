import React from "react";

interface ProgressChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: "indigo" | "blue" | "emerald" | "rose" | "purple";
  title?: string;
}

export default function ProgressChart({
  percentage,
  size = 140,
  strokeWidth = 12,
  color = "indigo",
  title,
}: ProgressChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  const colorMap = {
    indigo: {
      stroke: "#4f46e5",
      bg: "stroke-indigo-50 dark:stroke-indigo-950/30",
      text: "text-indigo-650 dark:text-indigo-400",
    },
    blue: {
      stroke: "#2563eb",
      bg: "stroke-blue-50 dark:stroke-blue-950/30",
      text: "text-blue-600 dark:text-blue-400",
    },
    emerald: {
      stroke: "#059669",
      bg: "stroke-emerald-50 dark:stroke-emerald-950/30",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    rose: {
      stroke: "#e11d48",
      bg: "stroke-rose-50 dark:stroke-rose-950/30",
      text: "text-rose-600 dark:text-rose-450",
    },
    purple: {
      stroke: "#7c3aed",
      bg: "stroke-purple-50 dark:stroke-purple-950/30",
      text: "text-purple-650 dark:text-purple-400",
    },
  };

  const activeColor = colorMap[color];

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={`radialGrad-${color}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={activeColor.stroke} />
              <stop offset="100%" stopColor={`${activeColor.stroke}cc`} />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            className={`text-slate-100 dark:text-slate-800 ${activeColor.bg}`}
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            stroke="currentColor"
          />

          {/* Foreground progress arc */}
          <circle
            stroke={`url(#radialGrad-${color})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center overlay label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold text-slate-850 dark:text-slate-50 tracking-tight">
            {percentage}%
          </span>
          {title && (
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
              {title}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
