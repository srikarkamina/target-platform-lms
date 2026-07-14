"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex flex-1 relative min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
