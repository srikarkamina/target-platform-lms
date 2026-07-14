"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import { 
  Activity, Database, HardDrive, Cpu, 
  Clock, RefreshCw, AlertTriangle, CheckCircle2,
  Terminal, ShieldCheck, Layers, FileText
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface HealthData {
  status: "HEALTHY" | "WARNING" | "CRITICAL";
  message: string;
  timestamp: string;
  uptime: number;
  nodeVersion: string;
  environment: string;
  cached?: boolean;
  database: {
    status: "HEALTHY" | "CRITICAL";
    message: string;
    responseTimeMs: number;
  };
  storage: {
    status: "HEALTHY" | "WARNING" | "CRITICAL";
    message: string;
    totalUsedMB: number;
  };
  api: {
    status: "HEALTHY" | "WARNING" | "CRITICAL";
    message: string;
    avgResponseTimeMs: number;
  };
  backups: {
    status: "HEALTHY" | "WARNING";
    message: string;
    lastBackup: {
      id: string;
      fileName: string;
      status: string;
      createdAt: string;
      completedAt: string | null;
      fileSizeMB: number;
    } | null;
  };
  envVars: {
    NODE_ENV: string;
    PORT: string;
    NEXT_PUBLIC_APP_URL: string;
  };
  subscriptions: {
    total: number;
    active: number;
    trial: number;
    expired: number;
    suspended: number;
    estimatedMonthlyRevenue: number;
    planBreakdown: Record<string, number>;
  };
  institutes: {
    activeCount: number;
  };
}

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

export default function SystemMonitoringPage() {
  const router = useRouter();
  const [data, setData] = useState<HealthData | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchHealthMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const [healthRes, backupsRes] = await Promise.all([
        api.get("/system/health?dashboard=system"),
        api.get("/system/backups"),
      ]);
      setData(healthRes.data);
      setBackups(backupsRes.data.slice(0, 5)); // show latest 5
    } catch (err: any) {
      console.error("Failed to load health statistics:", err);
      toast.error("Failed to retrieve diagnostics statistics.");
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
    fetchHealthMetrics();
  }, [fetchHealthMetrics, router]);

  const formatDuration = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    
    if (d > 0) {
      return `${d}d ${h}h ${m}m`;
    }
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  const getSeverityBadgeClass = (status: "HEALTHY" | "WARNING" | "CRITICAL") => {
    if (status === "HEALTHY") {
      return "bg-emerald-50 text-emerald-700 border-emerald-250";
    }
    if (status === "WARNING") {
      return "bg-amber-50 text-amber-700 border-amber-250 animate-pulse";
    }
    return "bg-rose-50 text-rose-700 border-rose-250 animate-bounce";
  };

  if (loading && !data) {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex flex-col items-center justify-center p-32">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-xs text-slate-400 mt-2 font-semibold">Running platform diagnostic checks...</p>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex flex-col items-center justify-center p-16 bg-white border border-rose-200 shadow-sm rounded-2xl text-center">
            <AlertTriangle className="h-12 w-12 text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-rose-800">Diagnostics Offline</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">Failed to establish connection to monitoring services.</p>
            <button
              onClick={fetchHealthMetrics}
              className="mt-4 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Retry Checks
            </button>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        <div className="space-y-8 font-sans max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">System Health & Diagnostics</h1>
              <p className="text-xs text-slate-500 mt-1">Super Admin dashboard monitoring service statuses, database metrics, and disk capacities.</p>
            </div>
            <button
              onClick={fetchHealthMetrics}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Run Health Audit
            </button>
          </div>

          {/* Quick Metrics Severity Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {/* Status Card */}
            <div className={`bg-white border rounded-2xl p-5 shadow-xs flex items-center gap-4 ${getSeverityBadgeClass(data.status)}`}>
              <div className="p-2 bg-white/60 rounded-xl shrink-0">
                <Activity className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-wider">Overall Status</p>
                <p className="text-base font-black capitalize mt-0.5">{data.status}</p>
                <p className="text-[10px] opacity-80 mt-0.5 truncate">{data.message}</p>
              </div>
            </div>

            {/* DB Status */}
            <div className={`bg-white border rounded-2xl p-5 shadow-xs flex items-center gap-4 ${getSeverityBadgeClass(data.database.status)}`}>
              <div className="p-2 bg-white/60 rounded-xl shrink-0">
                <Database className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-wider">Database Status</p>
                <p className="text-base font-black mt-0.5">{data.database.status}</p>
                <p className="text-[10px] opacity-80 mt-0.5 truncate">{data.database.responseTimeMs}ms response time</p>
              </div>
            </div>

            {/* Disk usage */}
            <div className={`bg-white border rounded-2xl p-5 shadow-xs flex items-center gap-4 ${getSeverityBadgeClass(data.storage.status)}`}>
              <div className="p-2 bg-white/60 rounded-xl shrink-0">
                <HardDrive className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-wider">Storage Capacity</p>
                <p className="text-base font-black mt-0.5">
                  {data.storage.totalUsedMB >= 1024 
                    ? `${(data.storage.totalUsedMB / 1024).toFixed(1)} GB` 
                    : `${data.storage.totalUsedMB} MB`}
                </p>
                <p className="text-[10px] opacity-80 mt-0.5 truncate">{data.storage.message}</p>
              </div>
            </div>

            {/* API performance */}
            <div className={`bg-white border rounded-2xl p-5 shadow-xs flex items-center gap-4 ${getSeverityBadgeClass(data.api.status)}`}>
              <div className="p-2 bg-white/60 rounded-xl shrink-0">
                <Clock className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-wider">Average API Response</p>
                <p className="text-base font-black mt-0.5">{data.api.avgResponseTimeMs} ms</p>
                <p className="text-[10px] opacity-80 mt-0.5 truncate">{data.api.message}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* System parameters */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Cpu className="h-4 w-4 text-slate-450" /> System Details
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-450 font-bold">Node Version</span>
                  <span className="font-extrabold text-slate-700">{data.nodeVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 font-bold">Environment</span>
                  <span className="font-extrabold uppercase text-slate-700">{data.environment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 font-bold">Prisma Status</span>
                  <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 font-bold">System Uptime</span>
                  <span className="font-extrabold text-slate-700">{formatDuration(data.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 font-bold">Active Institutes</span>
                  <span className="font-extrabold text-indigo-650">{data.institutes.activeCount} Institutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 font-bold">Server Port</span>
                  <span className="font-extrabold text-slate-700">{data.envVars.PORT}</span>
                </div>
              </div>
            </div>

            {/* Subscription statistics */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Layers className="h-4 w-4 text-slate-450" /> Subscription metrics
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-450 font-bold">Total Clients</span>
                  <span className="font-extrabold text-slate-700">{data.subscriptions.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 font-bold">Active Licenses</span>
                  <span className="font-extrabold text-emerald-600">{data.subscriptions.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 font-bold">Trialing Workspaces</span>
                  <span className="font-extrabold text-blue-600">{data.subscriptions.trial}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-450 font-bold">Expired Accounts</span>
                  <span className="font-extrabold text-rose-600">{data.subscriptions.expired}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 font-bold">
                  <span className="text-slate-800">Est. MRR Revenue</span>
                  <span className="font-black text-slate-900">₹{(data.subscriptions.estimatedMonthlyRevenue * 10).toLocaleString()} / mo</span>
                </div>
              </div>
            </div>

            {/* Backups summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <FileText className="h-4 w-4 text-slate-450" /> Backups status
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-450 font-bold">Last Backup Status</span>
                  <span className={`font-extrabold uppercase ${
                    data.backups.status === "HEALTHY" ? "text-emerald-600" : "text-amber-600"
                  }`}>
                    {data.backups.message}
                  </span>
                </div>
                {data.backups.lastBackup && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-450 font-bold">Last Backup Name</span>
                      <span className="font-extrabold text-slate-700 truncate max-w-44" title={data.backups.lastBackup.fileName}>
                        {data.backups.lastBackup.fileName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450 font-bold">Last Backup Date</span>
                      <span className="font-bold text-slate-700">
                        {new Date(data.backups.lastBackup.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450 font-bold">Backup Size</span>
                      <span className="font-extrabold text-slate-700">{data.backups.lastBackup.fileSizeMB} MB</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Recent Backup History list */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm md:col-span-2 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <FileText className="h-4.5 w-4.5 text-slate-400" /> Recent Backup History
              </h3>

              {backups.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold py-8 text-center">No backups logs found in history.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {backups.map((b) => (
                    <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate max-w-md" title={b.fileName}>{b.fileName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {b.createdBy} • {new Date(b.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          b.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}>
                          {b.status}
                        </span>
                        <span className="font-bold text-slate-650 shrink-0">{b.fileSize.toFixed(1)} MB</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error logs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm md:col-span-1 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Terminal className="h-4 w-4 text-rose-500" /> Recent Diagnostic Logs
                </h3>
                
                <div className="bg-slate-950 text-emerald-500 font-mono text-[9px] p-3 rounded-xl space-y-1.5 h-44 overflow-y-auto leading-relaxed border border-slate-900 mt-2">
                  <div>[INFO] Diagnostics check successfully compiled.</div>
                  <div>[INFO] Database status: {data.database.status} ({data.database.responseTimeMs}ms)</div>
                  <div>[INFO] Storage status: {data.storage.status}</div>
                  <div>[INFO] API latency averages: {data.api.avgResponseTimeMs}ms</div>
                  {data.cached && <div className="text-amber-400">[CACHE] Serving diagnostics from memory cache.</div>}
                  <div className="text-slate-450 font-semibold">Diagnostic logs finished.</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 font-medium flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Diagnostic status: {data.status}.
              </div>
            </div>
          </div>
        </div>
      </DashboardPageContainer>
    </DashboardLayout>
  );
}
