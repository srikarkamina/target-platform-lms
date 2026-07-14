import React from "react";
import { BookOpen, CheckCircle2, Circle } from "lucide-react";

interface ProgressOverviewProps {
  completedCourses: number;
  totalCourses: number;
}

export default function ProgressOverview({
  completedCourses,
  totalCourses,
}: ProgressOverviewProps) {
  const completionRate =
    totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

  // SVG Circle geometry parameters
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - completionRate / 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow duration-300">
      <div className="space-y-2 text-center md:text-left min-w-0 flex-1">
        <h3 className="text-base font-bold text-slate-800 flex items-center justify-center md:justify-start gap-2">
          <BookOpen className="h-4.5 w-4.5 text-indigo-600" />
          <span>Curriculum Mastery</span>
        </h3>
        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          Tracking your overall academy standing based on courses fully completed.
        </p>

        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-3 text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>{completedCourses} Completed</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">
            <Circle className="h-4 w-4 text-indigo-500 animate-pulse" />
            <span>{Math.max(0, totalCourses - completedCourses)} In Progress</span>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center h-40 w-40 shrink-0">
        <svg className="w-32 h-32 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="text-slate-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
          />
          {/* Indicator circle */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="text-indigo-650 transition-all duration-1000 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>
        <div className="absolute text-center">
          <p className="text-2xl font-black text-indigo-950 font-sans tracking-tight">
            {completionRate}%
          </p>
          <p className="text-[9px] text-slate-400 font-bold font-mono uppercase tracking-widest mt-0.5">
            Graduation
          </p>
        </div>
      </div>
    </div>
  );
}
