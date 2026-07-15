"use client";

import { Building2, Cloud, ShieldCheck, GraduationCap } from "lucide-react";

export default function StatisticsSection() {
  const stats = [
    {
      label: "Built for",
      value: "Coaching Institutes",
      description: "Designed specifically for modern training organizations and academies.",
      icon: Building2,
      color: "from-blue-500 to-indigo-500",
    },
    {
      label: "Platform Type",
      value: "Modern LMS",
      description: "Combining course distribution, video streaming, quizzes, and certificates.",
      icon: GraduationCap,
      color: "from-purple-500 to-pink-500",
    },
    {
      label: "Hosting",
      value: "Cloud Hosted",
      description: "Global low-latency delivery powered by Next.js and Supabase.",
      icon: Cloud,
      color: "from-emerald-500 to-teal-500",
    },
    {
      label: "Environment",
      value: "Secure & Encrypted",
      description: "Role-based tenant isolation and secure cryptographical token validation.",
      icon: ShieldCheck,
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <section id="stats" className="py-12 border-t border-slate-200/60 dark:border-slate-800/40 scroll-mt-20">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.value}
            className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/40"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/45 px-2 py-0.5 rounded-md">
                {stat.label}
              </span>
              <div className="text-slate-400 dark:text-slate-500">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white leading-tight">
              {stat.value}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-normal">
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
