import React from "react";
import { Award, BookOpen, CheckCircle, XCircle } from "lucide-react";

interface QuizPerformanceData {
  quizId: string;
  quizName: string;
  courseCode: string;
  attemptCount: number;
  latestScore: number | null;
  highestScore: number | null;
  averageScore: number | null;
  passFailStatus: string;
}

interface QuizPerformanceTableProps {
  quizzes: QuizPerformanceData[];
}

export default function QuizPerformanceTable({ quizzes }: QuizPerformanceTableProps) {
  if (quizzes.length === 0) {
    return (
      <div className="text-center p-12 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <Award className="mx-auto h-12 w-12 text-slate-300 mb-3" />
        <h3 className="text-sm font-bold text-slate-800">No quiz records found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          You have not attempted any published quizzes in your enrolled courses yet.
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
              <th className="px-6 py-4">Quiz Title</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4 text-center">Attempts</th>
              <th className="px-6 py-4 text-center">Latest Score</th>
              <th className="px-6 py-4 text-center">Highest Score</th>
              <th className="px-6 py-4 text-center">Average Score</th>
              <th className="px-6 py-4 text-right">Pass/Fail Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-750">
            {quizzes.map((quiz) => (
              <tr key={quiz.quizId} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900 leading-tight">{quiz.quizName}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                    <BookOpen className="h-3 w-3" />
                    <span>{quiz.courseCode}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap font-mono font-bold text-slate-700">
                  {quiz.attemptCount}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap font-mono font-bold text-slate-800">
                  {quiz.latestScore !== null ? `${quiz.latestScore}%` : "—"}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap font-mono font-bold text-emerald-700">
                  {quiz.highestScore !== null ? `${quiz.highestScore}%` : "—"}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap font-mono font-bold text-indigo-650">
                  {quiz.averageScore !== null ? `${quiz.averageScore}%` : "—"}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold tracking-wide border ${
                    quiz.passFailStatus === "Pass"
                      ? "bg-emerald-50 text-emerald-750 border-emerald-200"
                      : quiz.passFailStatus === "Fail"
                        ? "bg-rose-50 text-rose-750 border-rose-200"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                  }`}>
                    {quiz.passFailStatus === "Pass" && <CheckCircle className="h-3.5 w-3.5" />}
                    {quiz.passFailStatus === "Fail" && <XCircle className="h-3.5 w-3.5" />}
                    <span>{quiz.passFailStatus}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked List View */}
      <div className="block md:hidden divide-y divide-slate-100 bg-white">
        {quizzes.map((quiz) => (
          <div key={quiz.quizId} className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900 leading-tight">{quiz.quizName}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md mt-1.5 font-mono">
                  {quiz.courseCode}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold tracking-wide border ${
                quiz.passFailStatus === "Pass"
                  ? "bg-emerald-50 text-emerald-750 border-emerald-200"
                  : quiz.passFailStatus === "Fail"
                    ? "bg-rose-50 text-rose-750 border-rose-200"
                    : "bg-slate-50 text-slate-500 border-slate-200"
              }`}>
                <span>{quiz.passFailStatus}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Attempts</p>
                <p className="font-black text-slate-700 font-mono">{quiz.attemptCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Latest Score</p>
                <p className="font-black text-slate-700 font-mono">
                  {quiz.latestScore !== null ? `${quiz.latestScore}%` : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Highest Score</p>
                <p className="font-black text-emerald-650 font-mono">
                  {quiz.highestScore !== null ? `${quiz.highestScore}%` : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Average Score</p>
                <p className="font-black text-indigo-650 font-mono">
                  {quiz.averageScore !== null ? `${quiz.averageScore}%` : "—"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
