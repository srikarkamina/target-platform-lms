import React from "react";
import { Users } from "lucide-react";

interface StudentStats {
  total: number;
  active: number;
  new: number;
}

interface StudentSummaryCardProps {
  students: StudentStats;
}

export default function StudentSummaryCard({ students }: StudentSummaryCardProps) {
  const inactive = Math.max(0, students.total - students.active);
  const activePercent = students.total > 0 ? Math.round((students.active / students.total) * 100) : 0;
  const inactivePercent = students.total > 0 ? Math.round((inactive / students.total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between h-[300px] hover:shadow-md transition-shadow duration-300">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Users className="h-5 w-5" />
          </span>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
            Students Standing
          </h3>
        </div>

        {/* Detailed counts */}
        <div className="space-y-3 pt-2">
          {/* Active */}
          <div className="flex items-center justify-between text-xs font-bold font-mono">
            <div className="flex items-center gap-2 text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Active Students</span>
            </div>
            <span className="text-slate-800">{students.active}</span>
          </div>

          {/* New */}
          <div className="flex items-center justify-between text-xs font-bold font-mono">
            <div className="flex items-center gap-2 text-slate-500">
              <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
              <span>New (Last 30d)</span>
            </div>
            <span className="text-slate-800">+{students.new}</span>
          </div>

          {/* Inactive */}
          <div className="flex items-center justify-between text-xs font-bold font-mono">
            <div className="flex items-center gap-2 text-slate-500">
              <span className="h-2 w-2 rounded-full bg-slate-350"></span>
              <span>Inactive</span>
            </div>
            <span className="text-slate-800">{inactive}</span>
          </div>
        </div>
      </div>

      {/* Visual horizontal stack bar */}
      <div className="space-y-3 pt-4 border-t border-slate-100 shrink-0">
        <div className="flex items-center justify-between text-[10px] font-bold font-mono uppercase tracking-wider text-slate-450">
          <span>Active vs Inactive</span>
          <span>{activePercent}% Active</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${activePercent}%` }} />
          <div className="bg-slate-300 h-full transition-all" style={{ width: `${inactivePercent}%` }} />
        </div>
      </div>
    </div>
  );
}
