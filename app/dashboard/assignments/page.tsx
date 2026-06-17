"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import AssignmentList from "@/components/assignments/AssignmentList";
import { ClipboardCheck } from "lucide-react";

export default function AssignmentsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
                <ClipboardCheck className="h-8 w-8 text-indigo-650" />
                <span>Course Assignments</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage and track coursework assignments across all your teaching courses
              </p>
            </div>
          </div>

          <div className="mt-4">
            <AssignmentList />
          </div>
        </main>
      </div>
    </div>
  );
}
