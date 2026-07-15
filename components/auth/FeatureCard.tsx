"use client";

import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 dark:border-slate-800/80 dark:bg-slate-900/50 dark:hover:border-indigo-500/40">
      <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-indigo-50/50 dark:bg-indigo-950/10 group-hover:scale-125 transition-transform duration-300 pointer-events-none" />
      
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
