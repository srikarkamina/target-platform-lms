"use client";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Sparkles, Calendar, BookOpen, Clock } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-8 font-sans">
          {/* Hero Welcome Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Welcome to TARGET Platform 🚀
              </h1>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                You are logged into your centralized learning space. Navigate through courses, track progress, review lecture materials, and manage course assets using the sidebar menu.
              </p>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Courses</p>
                <h3 className="text-lg font-bold text-slate-800 mt-0.5">Academic Track</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Videos</p>
                <h3 className="text-lg font-bold text-slate-800 mt-0.5">Lessons & Playback</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Calendar className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timeline</p>
                <h3 className="text-lg font-bold text-slate-800 mt-0.5">2026 Academic Year</h3>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}