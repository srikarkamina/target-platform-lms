import React from "react";
import { Award, Layers, MessageSquare, BookOpen } from "lucide-react";

interface QuizStats {
  total: number;
  attempts: number;
  averageScore: number;
}

interface QuizSummaryCardProps {
  quizzes: QuizStats;
}

export default function QuizSummaryCard({ quizzes }: QuizSummaryCardProps) {
  const avgAttemptsPerQuiz =
    quizzes.total > 0 ? Math.round((quizzes.attempts / quizzes.total) * 10) / 10 : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between h-[300px] hover:shadow-md transition-shadow duration-300">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-650 border border-indigo-100">
            <Award className="h-5 w-5" />
          </span>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
            Quiz Summary
          </h3>
        </div>

        {/* Detailed stats list */}
        <div className="space-y-3 pt-2">
          {/* Total Quizzes */}
          <div className="flex items-center justify-between text-xs font-bold font-mono">
            <div className="flex items-center gap-2 text-slate-500">
              <BookOpen className="h-4 w-4 text-slate-400" />
              <span>Total Quizzes</span>
            </div>
            <span className="text-slate-800">{quizzes.total}</span>
          </div>

          {/* Total Attempts */}
          <div className="flex items-center justify-between text-xs font-bold font-mono">
            <div className="flex items-center gap-2 text-slate-500">
              <Layers className="h-4 w-4 text-slate-400" />
              <span>Total Attempts</span>
            </div>
            <span className="text-slate-800">{quizzes.attempts}</span>
          </div>

          {/* Average Attempts */}
          <div className="flex items-center justify-between text-xs font-bold font-mono">
            <div className="flex items-center gap-2 text-slate-500">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              <span>Attempts / Quiz</span>
            </div>
            <span className="text-slate-800">{avgAttemptsPerQuiz}</span>
          </div>
        </div>
      </div>

      {/* Visual average score progression bar */}
      <div className="space-y-3 pt-4 border-t border-slate-100 shrink-0">
        <div className="flex items-center justify-between text-[10px] font-bold font-mono uppercase tracking-wider text-slate-450">
          <span>Average Quiz Score</span>
          <span className="text-indigo-650 font-extrabold">{quizzes.averageScore}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div className="bg-indigo-600 h-full transition-all duration-700" style={{ width: `${quizzes.averageScore}%` }} />
        </div>
      </div>
    </div>
  );
}
