import React from "react";
import { Calendar, Clock } from "lucide-react";

interface DeadlineItem {
  id: string;
  title: string;
  dueDate: string | Date | null;
  course: {
    title: string;
  };
}

interface DeadlineCardProps {
  deadlines: DeadlineItem[];
  loading?: boolean;
}

export default function DeadlineCard({ deadlines, loading = false }: DeadlineCardProps) {
  const getDaysRemaining = (dateStr: string | Date | null) => {
    if (!dateStr) return null;
    const diffMs = new Date(dateStr).getTime() - Date.now();
    const diffDays = Math.ceil(diffMs / 86400000);
    return diffDays;
  };

  const getBadgeStyle = (days: number | null) => {
    if (days === null) return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    if (days < 0) return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-200/50 dark:border-rose-900/30";
    if (days <= 2) return "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30 animate-pulse";
    return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/30";
  };

  const formatDaysText = (days: number | null) => {
    if (days === null) return "No due date";
    if (days < 0) return "Overdue";
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `${days} days left`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl animate-pulse flex justify-between items-center">
            <div className="space-y-2 flex-1">
              <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-800 rounded"></div>
              <div className="h-2.5 w-1/2 bg-slate-100 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        <Calendar className="h-8 w-8 text-slate-350 dark:text-slate-655 mb-2" />
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No deadlines</h4>
        <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5">
          Everything is completed! Enjoy your day.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deadlines.map((item) => {
        const days = getDaysRemaining(item.dueDate);
        return (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-100/50 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 border border-slate-150/50 dark:border-slate-800/80 transition-colors gap-4"
          >
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-150 truncate leading-snug">
                {item.title}
              </h4>
              <p className="text-[10px] text-slate-450 dark:text-slate-400 mt-1 font-semibold flex items-center gap-1">
                <span>{item.course.title}</span>
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap ${getBadgeStyle(days)}`}>
                <Clock className="h-3 w-3" />
                <span>{formatDaysText(days)}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
