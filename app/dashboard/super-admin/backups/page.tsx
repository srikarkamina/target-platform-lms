"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import { 
  History, Plus, RefreshCw, AlertCircle, 
  CheckCircle2, Loader2, Database, HelpCircle,
  ArrowUpDown, Filter, ShieldAlert, ShieldCheck
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface BackupRecord {
  id: string;
  type: "MANUAL" | "SCHEDULED" | "SYSTEM";
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
  fileName: string;
  fileSize: number;
  createdBy: string;
  createdAt: string;
  completedAt: string | null;
  notes: string | null;
}

export default function BackupsManagementPage() {
  const router = useRouter();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [notes, setNotes] = useState("");

  // Filters & Sorting States
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const fetchBackupHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/system/backups");
      setBackups(res.data);
    } catch (err: any) {
      console.error("Failed to load backup logs:", err);
      toast.error("Failed to load backups directory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const payload = parseJwt(token);
    if (!payload || payload.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchBackupHistory();
  }, [fetchBackupHistory, router]);

  const triggerManualBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      toast.loading("Initiating database backup manifest generation...", { id: "backup-toast" });
      const res = await api.post("/system/backups", { notes, type: "MANUAL" });
      toast.success(`Backup successfully created: ${res.data.fileName}`, { id: "backup-toast" });
      setNotes("");
      fetchBackupHistory();
    } catch (err: any) {
      console.error("Failed to compile backup package:", err);
      toast.error(err.response?.data?.message || "Failed to create backup package.", { id: "backup-toast" });
    } finally {
      setCreating(false);
    }
  };

  const getDuration = (b: BackupRecord) => {
    if (!b.completedAt) return "N/A";
    const start = new Date(b.createdAt).getTime();
    const end = new Date(b.completedAt).getTime();
    const diffSec = (end - start) / 1000;
    return `${diffSec.toFixed(1)}s`;
  };

  // 1. Compute Backup Health Badge Status locally
  const backupHealth = useMemo(() => {
    if (backups.length === 0) {
      return { status: "WARNING", message: "No backups registered" };
    }
    const latest = backups[0];
    if (latest.status === "FAILED") {
      return { status: "WARNING", message: "Last backup attempt failed" };
    }
    const timeDiffHrs = (Date.now() - new Date(latest.createdAt).getTime()) / (1000 * 3600);
    if (timeDiffHrs > 24) {
      return { status: "WARNING", message: "Last backup is older than 24 hours" };
    }
    return { status: "HEALTHY", message: "Backups up-to-date" };
  }, [backups]);

  // 2. Filter & Sort data dynamically on the client
  const processedBackups = useMemo(() => {
    let result = [...backups];

    // Filter
    if (statusFilter !== "ALL") {
      result = result.filter((b) => b.status === statusFilter);
    }
    if (typeFilter !== "ALL") {
      result = result.filter((b) => b.type === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "size") {
        comparison = a.fileSize - b.fileSize;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return result;
  }, [backups, statusFilter, typeFilter, sortBy, sortOrder]);

  const toggleSort = (field: "date" | "size") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        <div className="space-y-8 font-sans max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Database Backups & Restore</h1>
              <p className="text-xs text-slate-500 mt-1">Super Admin utility panel to execute manual backup diagnostics, view snapshot size estimates, and review historical logs.</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Backup Health Badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-extrabold tracking-wide ${
                backupHealth.status === "HEALTHY" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                  : "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
              }`}>
                {backupHealth.status === "HEALTHY" ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                )}
                {backupHealth.message}
              </div>

              <button
                onClick={fetchBackupHistory}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh History
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create manual backup form card */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit space-y-5">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Database className="h-4.5 w-4.5 text-indigo-650 shrink-0" />
                Trigger Manual Backup
              </h2>

              <form onSubmit={triggerManualBackup} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2">
                    Backup Notes / Description
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide description for this backup snapshot..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700 placeholder-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Compiling Manifest...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4.5 w-4.5" /> Start Backup
                    </>
                  )}
                </button>
              </form>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex gap-2.5">
                <HelpCircle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                  Manual backups generate DB manifests capturing exact table row statistics and real upload asset file sizes. Restore operations can be requested by contacting support.
                </p>
              </div>
            </div>

            {/* Backups list table card */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between min-h-96">
              
              {/* Header with Filters */}
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <History className="h-4.5 w-4.5 text-slate-400" /> Backup Logs Directory
                </h2>
                
                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Filter */}
                  <div className="flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-[10px] font-bold rounded-lg px-2 py-1 text-slate-650 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="SUCCESS">SUCCESS</option>
                      <option value="FAILED">FAILED</option>
                      <option value="RUNNING">RUNNING</option>
                    </select>
                  </div>

                  {/* Type Filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-[10px] font-bold rounded-lg px-2 py-1 text-slate-650 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Types</option>
                    <option value="MANUAL">MANUAL</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="SYSTEM">SYSTEM</option>
                  </select>
                </div>
              </div>

              {loading && backups.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-32">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
                  <p className="text-xs text-slate-400 mt-2 font-semibold">Reading backup logs...</p>
                </div>
              ) : processedBackups.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-32 text-center">
                  <Database className="h-12 w-12 text-slate-300 mb-2.5" />
                  <p className="text-xs text-slate-500 font-bold">No backups found</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs">No records matched your search parameters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto grow">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">File Name</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort("size")}>
                          <div className="flex items-center gap-1 justify-end">
                            Size <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort("date")}>
                          <div className="flex items-center gap-1">
                            Created By / Date <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedBackups.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate max-w-xs" title={b.fileName}>
                                {b.fileName}
                              </p>
                              {b.notes && (
                                <p className="text-[10px] text-slate-450 truncate max-w-xs mt-0.5" title={b.notes}>
                                  {b.notes}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-extrabold uppercase">
                            {b.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border flex items-center justify-center gap-1 w-fit mx-auto ${
                              b.status === "SUCCESS" 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                : b.status === "RUNNING" || b.status === "PENDING"
                                ? "bg-blue-50 text-blue-600 border-blue-100 animate-pulse"
                                : "bg-rose-50 text-rose-600 border-rose-100"
                            }`}>
                              {b.status === "SUCCESS" && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />}
                              {b.status === "FAILED" && <AlertCircle className="h-3 w-3 shrink-0 text-rose-500" />}
                              {b.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-700 font-extrabold text-right">
                            {b.fileSize ? `${b.fileSize.toFixed(2)} MB` : <span className="text-slate-400">0 MB</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-semibold">
                            <div>
                              <p className="text-slate-700">{b.createdBy}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{new Date(b.createdAt).toLocaleString()}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-extrabold text-right">
                            {getDuration(b)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardPageContainer>
    </DashboardLayout>
  );
}
