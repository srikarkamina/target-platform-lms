"use client";

import Link from "next/link";
import { Calendar } from "lucide-react";

interface BookDemoButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "white";
  size?: "sm" | "md" | "lg";
}

export default function BookDemoButton({
  className = "",
  variant = "primary",
  size = "md",
}: BookDemoButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";

  const variants = {
    primary:
      "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-none hover:shadow-lg",
    secondary:
      "bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100",
    outline:
      "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50",
    white:
      "bg-white hover:bg-slate-50 text-slate-900 shadow-md hover:shadow-lg",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <Link
      href="/demo"
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      <Calendar className="h-4 w-4" />
      <span>Book a Demo</span>
    </Link>
  );
}
