import React from "react";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "An error occurred",
  message = "Failed to load data. Please check your network connection and try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-sm max-w-lg mx-auto">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 mb-4">
        <AlertCircle className="h-6 w-6" />
      </span>
      <h3 className="text-sm font-bold text-rose-800 dark:text-rose-455 tracking-tight">
        {title}
      </h3>
      {message && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
          {message}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold px-4 py-2 text-xs transition-colors cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
