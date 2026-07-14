import React from "react";
import { ClipboardList, BookOpen, Clock, CheckCircle } from "lucide-react";

interface AssignmentData {
  assignmentId: string;
  assignmentName: string;
  courseCode: string;
  submissionStatus: "Graded" | "Submitted" | "Pending";
  grade: number | null;
  submissionDate: string | Date | null;
  feedback: string | null;
}

interface AssignmentTableProps {
  assignments: AssignmentData[];
}

export default function AssignmentTable({ assignments }: AssignmentTableProps) {
  const formatDate = (dateVal: string | Date | null) => {
    if (!dateVal) return "—";
    const date = new Date(dateVal);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (assignments.length === 0) {
    return (
      <div className="text-center p-12 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-3" />
        <h3 className="text-sm font-bold text-slate-800">No assignments found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          You do not have any assignments posted for your enrolled courses yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
            <tr>
              <th className="px-6 py-4">Assignment Name</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Grade</th>
              <th className="px-6 py-4 text-center">Submission Date</th>
              <th className="px-6 py-4">Feedback</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-750">
            {assignments.map((item) => (
              <tr key={item.assignmentId} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900 leading-tight">{item.assignmentName}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                    <BookOpen className="h-3 w-3" />
                    <span>{item.courseCode}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold tracking-wide border ${
                    item.submissionStatus === "Graded"
                      ? "bg-emerald-50 text-emerald-750 border-emerald-250"
                      : item.submissionStatus === "Submitted"
                        ? "bg-indigo-50 text-indigo-750 border-indigo-200"
                        : "bg-amber-50 text-amber-750 border-amber-200"
                  }`}>
                    {item.submissionStatus === "Graded" && <CheckCircle className="h-3.5 w-3.5" />}
                    {item.submissionStatus === "Submitted" && <Clock className="h-3.5 w-3.5" />}
                    <span>{item.submissionStatus}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap font-mono font-bold text-slate-800">
                  {item.grade !== null ? `${item.grade} / 100` : "—"}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap font-mono text-slate-500">
                  {formatDate(item.submissionDate)}
                </td>
                <td className="px-6 py-4 max-w-xs">
                  {item.feedback ? (
                    <p className="text-xs text-slate-500 italic line-clamp-2" title={item.feedback}>
                      &ldquo;{item.feedback}&rdquo;
                    </p>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No feedback provided yet.</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked List View */}
      <div className="block md:hidden divide-y divide-slate-100 bg-white">
        {assignments.map((item) => (
          <div key={item.assignmentId} className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900 leading-tight">{item.assignmentName}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md mt-1.5 font-mono">
                  {item.courseCode}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold tracking-wide border ${
                item.submissionStatus === "Graded"
                  ? "bg-emerald-50 text-emerald-750 border-emerald-250"
                  : item.submissionStatus === "Submitted"
                    ? "bg-indigo-50 text-indigo-750 border-indigo-200"
                    : "bg-amber-50 text-amber-750 border-amber-200"
              }`}>
                <span>{item.submissionStatus}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Grade</p>
                <p className="font-black text-slate-700 font-mono">
                  {item.grade !== null ? `${item.grade} / 100` : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Submitted At</p>
                <p className="font-bold text-slate-600 font-mono">{formatDate(item.submissionDate)}</p>
              </div>
            </div>

            {item.feedback && (
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Feedback</p>
                <p className="text-xs text-slate-650 italic">&ldquo;{item.feedback}&rdquo;</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
