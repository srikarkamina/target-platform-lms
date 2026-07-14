import React from "react";
import { CheckCircle2, Clock } from "lucide-react";

interface CourseProgressData {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  completionPercentage: number;
  lessonsCompleted: number;
  lessonsRemaining: number;
  lastAccessDate: string | Date | null;
}

interface ProgressCardProps {
  progress: CourseProgressData;
}

export default function ProgressCard({ progress }: ProgressCardProps) {
  const formatDate = (dateVal: string | Date | null) => {
    if (!dateVal) return "Never accessed";
    const date = new Date(dateVal);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isCompleted = progress.completionPercentage === 100 && (progress.lessonsCompleted > 0 || progress.lessonsRemaining === 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full group">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-indigo-650 uppercase tracking-widest font-mono bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
              {progress.courseCode}
            </span>
            <h4 className="text-base font-extrabold text-slate-800 tracking-tight mt-2 line-clamp-2 leading-tight group-hover:text-indigo-650 transition-colors">
              {progress.courseTitle}
            </h4>
          </div>
          {isCompleted && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
              <CheckCircle2 className="h-4.5 w-4.5" />
            </span>
          )}
        </div>

        {/* Lessons stats breakdown */}
        <div className="grid grid-cols-2 gap-4 my-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lessons Done</p>
            <p className="text-base font-extrabold text-slate-700 font-mono mt-0.5">{progress.lessonsCompleted}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining</p>
            <p className="text-base font-extrabold text-slate-700 font-mono mt-0.5">{progress.lessonsRemaining}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar & Footer */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-550 mb-1.5 font-mono">
            <span>Progress</span>
            <span className={isCompleted ? "text-emerald-650" : "text-indigo-650"}>
              {progress.completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 shadow-inner overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-700 ease-out ${
                isCompleted ? "bg-emerald-500" : "bg-indigo-600"
              }`}
              style={{ width: `${progress.completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>Last Accessed: {formatDate(progress.lastAccessDate)}</span>
        </div>
      </div>
    </div>
  );
}
