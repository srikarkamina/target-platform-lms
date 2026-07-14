import React, { useState } from "react";
import { BookOpen, Award, ClipboardCheck, Medal, Clock, CheckCircle2, XCircle } from "lucide-react";

interface EnrollmentActivity {
  id: string;
  studentName: string;
  courseTitle: string;
  date: string;
}

interface QuizActivity {
  id: string;
  studentName: string;
  quizTitle: string;
  score: number;
  percentage: number;
  passed: boolean;
  date: string;
}

interface SubmissionActivity {
  id: string;
  studentName: string;
  assignmentTitle: string;
  grade: number | null;
  date: string;
}

interface CertificateActivity {
  id: string;
  studentName: string;
  courseTitle: string;
  certificateNumber: string;
  date: string;
}

interface CombinedActivityItem {
  id: string;
  studentName: string;
  date: string;
  courseTitle?: string;
  quizTitle?: string;
  assignmentTitle?: string;
  score?: number;
  percentage?: number;
  passed?: boolean;
  grade?: number | null;
  certificateNumber?: string;
}

interface RecentActivityTableProps {
  activity: {
    enrollments: EnrollmentActivity[];
    quizAttempts: QuizActivity[];
    submissions: SubmissionActivity[];
    certificates: CertificateActivity[];
  };
}

export default function RecentActivityTable({ activity }: RecentActivityTableProps) {
  const [activeTab, setActiveTab] = useState<"enrollments" | "quizzes" | "submissions" | "certificates">("enrollments");

  const formatDate = (dateVal: string) => {
    const date = new Date(dateVal);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tabs = [
    { id: "enrollments" as const, label: "Enrollments", icon: BookOpen, data: activity.enrollments as CombinedActivityItem[] },
    { id: "quizzes" as const, label: "Quiz Attempts", icon: Award, data: activity.quizAttempts as CombinedActivityItem[] },
    { id: "submissions" as const, label: "Submissions", icon: ClipboardCheck, data: activity.submissions as CombinedActivityItem[] },
    { id: "certificates" as const, label: "Certificates", icon: Medal, data: activity.certificates as CombinedActivityItem[] },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-3 gap-6 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3.5 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "border-indigo-650 text-indigo-650 font-extrabold"
                  : "border-transparent text-slate-450 hover:text-slate-700"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md font-bold text-slate-500">
                {tab.data.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline List Content */}
      <div className="flex-1 overflow-y-auto p-6 divide-y divide-slate-100">
        {currentTab.data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <Clock className="h-10 w-10 text-slate-350 mb-2.5 animate-pulse" />
            <p className="text-sm font-bold text-slate-700">No recent activity</p>
            <p className="text-xs text-slate-400 mt-0.5">Nothing has been recorded in this feed yet.</p>
          </div>
        ) : (
          currentTab.data.map((item: CombinedActivityItem) => (
            <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-slate-800 leading-snug">
                  {item.studentName}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {activeTab === "enrollments" && `Enrolled in ${item.courseTitle}`}
                  {activeTab === "quizzes" && `Submitted ${item.quizTitle}`}
                  {activeTab === "submissions" && `Submitted coursework for ${item.assignmentTitle}`}
                  {activeTab === "certificates" && `Earned completion for ${item.courseTitle}`}
                </p>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 font-mono">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(item.date)}</span>
                </span>
              </div>

              {/* Status / Metric right column */}
              <div className="shrink-0 text-right">
                {activeTab === "quizzes" && (
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      item.passed ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                    }`}>
                      {item.passed ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                      <span>{item.percentage}%</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">{item.score} marks</span>
                  </div>
                )}
                {activeTab === "submissions" && (
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    item.grade !== null ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}>
                    {item.grade !== null ? `${item.grade} / 100` : "Pending Grading"}
                  </span>
                )}
                {activeTab === "certificates" && (
                  <span className="inline-block text-[10px] font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                    No: {item.certificateNumber}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
