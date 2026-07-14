"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import AssignmentList from "@/components/assignments/AssignmentList";
import { ClipboardCheck } from "lucide-react";

export default function AssignmentsPage() {
  return (
    <DashboardLayout>
      <DashboardPageContainer>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
                <ClipboardCheck className="h-8 w-8 text-indigo-600" />
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
        </DashboardPageContainer>
    </DashboardLayout>
  );
}
