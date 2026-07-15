"use client";

import React, { useState } from "react";
import { Search, Clock } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

interface DemoRequest {
  id: string;
  name: string;
  instituteName: string;
  email: string;
  phone: string;
  demoDate: string;
  message: string;
  status: string;
}

export default function DemoRequestsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  // Simulated static demo bookings matching submissions logged to console via /api/demo
  const [demos] = useState<DemoRequest[]>([
    {
      id: "demo-1",
      name: "Alice Smith",
      instituteName: "Summit International College",
      email: "alice@summitcollege.edu",
      phone: "+1 (555) 234-5678",
      demoDate: "2026-07-20",
      message: "We need an LMS that supports student batching and multi-faculty courses.",
      status: "SCHEDULED",
    },
    {
      id: "demo-2",
      name: "Dr. David Carter",
      instituteName: "Carter Institute of Tech",
      email: "carter@techinst.org",
      phone: "+44 20 7946 0958",
      demoDate: "2026-07-22",
      message: "Interested in the enterprise subscription limits and white-labeling.",
      status: "PENDING",
    },
    {
      id: "demo-3",
      name: "Maria Gonzalez",
      instituteName: "Gonzalez Preparatory School",
      email: "maria.g@prepschool.edu",
      phone: "+34 91 123 4567",
      demoDate: "2026-07-15",
      message: "Looking for simple quiz assignment tracking for middle school students.",
      status: "COMPLETED",
    },
  ]);

  const filteredDemos = demos.filter((demo) => {
    const matchesSearch =
      demo.name.toLowerCase().includes(search.toLowerCase()) ||
      demo.instituteName.toLowerCase().includes(search.toLowerCase()) ||
      demo.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = status === "ALL" || demo.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b_0%,transparent_50%)] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                📅 Demo Bookings
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                View public demo booking submissions and coordinate scheduling calls.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by contact name, institute or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-500 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-350 focus:outline-none focus:border-indigo-500 transition-colors w-full md:w-44"
                  >
                    <option value="ALL">All Schedules</option>
                    <option value="PENDING">Pending Schedule</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table / List */}
            <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl backdrop-blur-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-900/40">
                    <th className="p-4 pl-6">Contact Person</th>
                    <th className="p-4">Academy / Institute</th>
                    <th className="p-4">Contact Info</th>
                    <th className="p-4">Preferred Date</th>
                    <th className="p-4">Message</th>
                    <th className="p-4 pr-6">Status Badge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {filteredDemos.map((demo) => (
                    <tr key={demo.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 pl-6 font-semibold text-white">{demo.name}</td>
                      <td className="p-4 text-slate-300 font-semibold">{demo.instituteName}</td>
                      <td className="p-4 text-xs space-y-0.5">
                        <div className="flex items-center gap-1 text-indigo-400 font-medium font-mono">{demo.email}</div>
                        <div className="text-slate-500">{demo.phone}</div>
                      </td>
                      <td className="p-4 font-semibold text-xs text-indigo-300 flex items-center gap-1.5 mt-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        {new Date(demo.demoDate).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-xs text-slate-400 max-w-xs truncate">{demo.message}</td>
                      <td className="p-4 pr-6">
                        {demo.status === "SCHEDULED" && (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">Scheduled</span>
                        )}
                        {demo.status === "PENDING" && (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">Pending</span>
                        )}
                        {demo.status === "COMPLETED" && (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
