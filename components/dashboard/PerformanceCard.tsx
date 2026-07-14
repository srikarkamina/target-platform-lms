import React, { useState } from "react";
import { Award, AlertCircle, User } from "lucide-react";

interface StudentPerformanceMetric {
  id: string;
  name: string;
  email: string;
  avgQuizScore: number;
  submissionRate: number;
  performanceScore: number;
}

interface PerformanceCardProps {
  topPerformers: StudentPerformanceMetric[];
  needingAttention: StudentPerformanceMetric[];
  loading?: boolean;
}

export default function PerformanceCard({
  topPerformers,
  needingAttention,
  loading = false,
}: PerformanceCardProps) {
  const [activeTab, setActiveTab] = useState<"top" | "attention">("top");

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-pulse h-96 flex flex-col">
        <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded"></div>
          <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>
        <div className="space-y-4 flex-1">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="flex gap-3 items-center">
              <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-800 rounded"></div>
                <div className="h-2 w-1/2 bg-slate-100 dark:bg-slate-800 rounded"></div>
              </div>
              <div className="h-6 w-10 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeStudents = activeTab === "top" ? topPerformers : needingAttention;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
        <button
          onClick={() => setActiveTab("top")}
          className={`flex items-center gap-1.5 pb-2 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "top"
              ? "border-indigo-600 text-indigo-650 dark:border-indigo-400 dark:text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400"
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Top Performers</span>
        </button>
        <button
          onClick={() => setActiveTab("attention")}
          className={`flex items-center gap-1.5 pb-2 px-1 ml-6 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "attention"
              ? "border-rose-500 text-rose-650 dark:border-rose-400 dark:text-rose-455"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400"
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          <span>Needs Attention</span>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {activeStudents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <User className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">
              No students recorded in this category.
            </p>
          </div>
        ) : (
          activeStudents.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                    activeTab === "top"
                      ? "bg-indigo-50 text-indigo-650 dark:bg-indigo-950/30 dark:text-indigo-400"
                      : "bg-rose-50 text-rose-650 dark:bg-rose-950/30 dark:text-rose-400"
                  }`}
                >
                  {student.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-150 truncate">
                    {student.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {student.email}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-4 text-right">
                <div className="hidden sm:block">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Quiz Avg
                  </p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-300 mt-0.5">
                    {student.avgQuizScore}%
                  </p>
                </div>
                <div className="hidden sm:block">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Submission
                  </p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-300 mt-0.5">
                    {student.submissionRate}%
                  </p>
                </div>
                <div>
                  <span
                    className={`inline-flex items-center justify-center font-extrabold text-[10px] px-2.5 py-1 rounded-full ${
                      activeTab === "top"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450"
                    }`}
                  >
                    {student.performanceScore}%
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
