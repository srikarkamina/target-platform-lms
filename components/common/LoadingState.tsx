import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingState({ message = "Loading data...", size = "md" }: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 w-full text-center">
      <Loader2 className={`animate-spin text-indigo-600 dark:text-indigo-400 ${sizeClasses[size]}`} />
      {message && (
        <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 mt-3">
          {message}
        </p>
      )}
    </div>
  );
}
