import React from "react";
import { FolderOpen, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  title,
  description,
  icon: Icon = FolderOpen,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-xs max-w-lg mx-auto">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-300 mb-4">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-755 text-white font-bold px-4 py-2 text-xs transition-colors shadow-xs cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
