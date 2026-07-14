import React from "react";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

interface AccessDeniedProps {
  title?: string;
  message?: string;
}

export default function AccessDenied({
  title = "Access Denied",
  message = "You do not have the required permissions to view this resource. Please contact your system administrator or log in with a different account.",
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl mx-auto my-8">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-550 mb-6 border border-rose-100 dark:border-rose-900/30">
        <ShieldAlert className="h-8 w-8" />
      </span>
      <h2 className="text-lg font-extrabold text-slate-850 dark:text-slate-100 tracking-tight">
        {title}
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed mx-auto">
        {message}
      </p>
      <div className="mt-8 flex gap-4 justify-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-755 text-white font-bold px-5 py-2.5 text-xs transition-colors shadow-sm cursor-pointer"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 font-bold px-5 py-2.5 text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          Log In Again
        </Link>
      </div>
    </div>
  );
}
