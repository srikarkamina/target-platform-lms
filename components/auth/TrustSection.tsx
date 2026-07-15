"use client";

import { Landmark } from "lucide-react";

export default function TrustSection() {
  const placeholders = [
    { id: 1, name: "Apex Academy" },
    { id: 2, name: "Pioneer Classes" },
    { id: 3, name: "Elite Institute" },
    { id: 4, name: "Vanguard Academy" },
  ];

  return (
    <section id="trust" className="py-12 border-t border-slate-200/60 dark:border-slate-800/40">
      <div className="text-left mb-8">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl tracking-tight">
          Trusted by Coaching Institutes
        </h2>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Join the growing community of academies, colleges, and training centers transforming their learning experience with Target LMS.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {placeholders.map((item) => (
          <div
            key={item.id}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition-colors hover:bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/20 dark:hover:bg-slate-900/40 dark:hover:border-slate-700"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200/50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 mb-2">
              <Landmark className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {item.name}
            </span>
            <span className="mt-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Coming Soon
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
