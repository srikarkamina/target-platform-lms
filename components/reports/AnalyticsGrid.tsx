import React from "react";
import { CheckCircle2, Users, TrendingUp } from "lucide-react";

interface PlatformStats {
  completionRate: number;
  studentEngagement: number;
  averageProgress: number;
}

interface AnalyticsGridProps {
  stats: PlatformStats;
}

interface GaugeProps {
  title: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  circleColor: string;
  description: string;
}

function ProgressGauge({
  title,
  value,
  icon: Icon,
  colorClass,
  circleColor,
  description,
}: GaugeProps) {
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - value / 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow duration-300">
      <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
        <h4 className="text-sm font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-2">
          <Icon className={`h-4.5 w-4.5 ${colorClass}`} />
          <span>{title}</span>
        </h4>
        <p className="text-xs text-slate-400 font-medium leading-normal">
          {description}
        </p>
      </div>

      <div className="relative flex items-center justify-center h-28 w-28 shrink-0">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="text-slate-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            className={`${circleColor} transition-all duration-1000 ease-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>
        <div className="absolute text-center">
          <p className="text-xl font-black text-slate-800 font-sans tracking-tight">
            {value}%
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsGrid({ stats }: AnalyticsGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ProgressGauge
        title="Course Completion Rate"
        value={stats.completionRate}
        icon={CheckCircle2}
        colorClass="text-emerald-600"
        circleColor="text-emerald-500"
        description="Percentage of active students who completed all videos in their enrolled courses."
      />
      <ProgressGauge
        title="Student Engagement"
        value={stats.studentEngagement}
        icon={Users}
        colorClass="text-indigo-650"
        circleColor="text-indigo-600"
        description="Percentage of registered student accounts that have recorded video watch progress."
      />
      <ProgressGauge
        title="Average Student Progress"
        value={stats.averageProgress}
        icon={TrendingUp}
        colorClass="text-blue-600"
        circleColor="text-blue-500"
        description="Mean progress percentage across all active enrollments in the institute."
      />
    </div>
  );
}
