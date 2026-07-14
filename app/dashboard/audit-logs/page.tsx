"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { 
  Search, Loader2, Download, Calendar, Filter, 
  Eye, RefreshCw, ChevronLeft, ChevronRight, X, History,
  ShieldCheck, AlertTriangle
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";

interface AuditLog {
  id: string;
  instituteId: string;
  userId: string | null;
  action: string;
  module: string;
  entityType: string | null;
  entityId: string | null;
  description: string | null;
  oldValues: any;
  newValues: any;
  ipAddress: string | null;
  userAgent: string | null;
  requestMethod: string | null;
  requestPath: string | null;
  status: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export default function AuditLogsPage() {
  const [role, setRole] = useState<string>("STUDENT");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [module, setModule] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filterInstituteId, setFilterInstituteId] = useState<string>("");

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.role) {
        setRole(payload.role);
      }
    }
  }, []);

  const fetchLogs = async (currentPage = page) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const params = new URLSearchParams();
      params.append("page", String(currentPage));
      params.append("limit", String(limit));
      if (search) params.append("search", search);
      if (action) params.append("action", action);
      if (module) params.append("module", module);
      if (status) params.append("status", status);
      if (startDate) params.append("startDate", new Date(startDate).toISOString());
      if (endDate) params.append("endDate", new Date(endDate).toISOString());

      // Pass instituteId query param if user is SUPER_ADMIN and filtered
      const urlParams = new URLSearchParams(window.location.search);
      const urlInstituteId = urlParams.get("instituteId");
      if (urlInstituteId) {
        params.append("instituteId", urlInstituteId);
      } else if (role === "SUPER_ADMIN" && filterInstituteId) {
        params.append("instituteId", filterInstituteId);
      }

      const res = await fetch(`/api/institute/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Forbidden: You do not have access to view audit logs.");
        }
        throw new Error("Failed to fetch audit logs");
      }

      const data = await res.json();
      setLogs(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error(err.message || "Error loading audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "FACULTY" || role === "STUDENT") {
      fetchLogs(1);
      setPage(1);
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, search, action, module, status, startDate, endDate, filterInstituteId]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchLogs(newPage);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (action) params.append("action", action);
      if (module) params.append("module", module);
      if (status) params.append("status", status);
      if (startDate) params.append("startDate", new Date(startDate).toISOString());
      if (endDate) params.append("endDate", new Date(endDate).toISOString());

      const urlParams = new URLSearchParams(window.location.search);
      const urlInstituteId = urlParams.get("instituteId");
      if (urlInstituteId) {
        params.append("instituteId", urlInstituteId);
      } else if (role === "SUPER_ADMIN" && filterInstituteId) {
        params.append("instituteId", filterInstituteId);
      }

      const res = await fetch(`/api/institute/audit-logs/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Export failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Audit logs exported to CSV successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to export logs");
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setAction("");
    setModule("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    setFilterInstituteId("");
    toast.success("Filters reset successfully");
  };

  if (role === "FACULTY" || (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STUDENT")) {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-slate-50 font-sans p-6">
            <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
              <div className="h-14 w-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-black text-slate-800">Access Denied</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Faculty members are not authorized to view enterprise audit logs.
              </p>
            </div>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  const totalPages = Math.ceil(total / limit) || 1;

  const actionsList = [
    "LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", 
    "UPLOAD", "DOWNLOAD", "GENERATE", "REVOKE", "SUBMIT", "GRADE"
  ];

  const modulesList = [
    "AUTH", "COURSES", "VIDEOS", "ASSIGNMENTS", 
    "QUIZZES", "CERTIFICATES", "NOTIFICATIONS", "SETTINGS"
  ];

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <History className="h-6 w-6 text-indigo-650" />
            <h1 className="text-2xl font-black text-slate-905">
              {role === "STUDENT" ? "My Activity" : "Enterprise Audit Logs"}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {role === "STUDENT"
              ? "Track your personal activity history and event timeline"
              : "Track user operations, authorization requests, and resource state modifications"}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchLogs()}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          {(role === "ADMIN" || role === "SUPER_ADMIN") && (
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-xs cursor-pointer"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5" />
          Filter Logs
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search bar */}
          <div className={`relative ${role === "STUDENT" ? "md:col-span-3 lg:col-span-4" : "md:col-span-2"}`}>
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={role === "STUDENT" ? "Search activity..." : "Search by description, path, user..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1"
            >
              <option value="">All Actions</option>
              {actionsList.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {/* Module Filter */}
          {role !== "STUDENT" && (
            <div>
              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1"
              >
                <option value="">All Modules</option>
                {modulesList.map((mod) => (
                  <option key={mod} value={mod}>{mod}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          {role !== "STUDENT" && (
            <div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILURE">FAILURE</option>
              </select>
            </div>
          )}

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-sm transition-all text-center cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Advanced filters: Date Pickers & Super Admin Institute Id Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {role === "SUPER_ADMIN" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter by Institute UUID</label>
              <input
                type="text"
                placeholder="Paste Institute ID..."
                value={filterInstituteId}
                onChange={(e) => setFilterInstituteId(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="text-xs font-bold text-slate-400">Loading audit records...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-20 text-center space-y-2">
            <History className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-black text-slate-800">No logs found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Timestamp</th>
                  {role !== "STUDENT" && <th className="py-4 px-6">User</th>}
                  <th className="py-4 px-6">Action</th>
                  {role !== "STUDENT" && <th className="py-4 px-6">Module</th>}
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
                {logs.map((log) => {
                  const date = new Date(log.createdAt);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-4.5 px-6 whitespace-nowrap text-xs text-slate-500 font-mono">
                        {date.toLocaleString()}
                      </td>
                      {role !== "STUDENT" && (
                        <td className="py-4.5 px-6">
                          {log.user ? (
                            <div className="flex flex-col">
                              <span className="text-slate-800 font-bold">{log.user.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{log.user.email}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">System / Anonymous</span>
                          )}
                        </td>
                      )}
                      <td className="py-4.5 px-6 whitespace-nowrap">
                        <span className="inline-block bg-slate-100 border border-slate-200 text-[10px] font-black tracking-wider text-slate-700 px-2 py-0.5 rounded-md">
                          {log.action}
                        </span>
                      </td>
                      {role !== "STUDENT" && (
                        <td className="py-4.5 px-6 whitespace-nowrap">
                          <span className="text-xs font-bold text-indigo-650">
                            {log.module}
                          </span>
                        </td>
                      )}
                      <td className="py-4.5 px-6 max-w-xs truncate text-xs text-slate-600">
                        {log.description}
                      </td>
                      <td className="py-4.5 px-6 whitespace-nowrap">
                        {log.status === "SUCCESS" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <ShieldCheck className="h-3 w-3" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                            <AlertTriangle className="h-3 w-3" />
                            Failure
                          </span>
                        )}
                      </td>
                      <td className="py-4.5 px-6 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center justify-center p-1.5 text-indigo-650 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!isLoading && logs.length > 0 && (
          <div className="bg-slate-50/75 border-t border-slate-200 px-6 py-4 flex items-center justify-between text-sm">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Total logs: <span className="text-slate-700 font-black">{total}</span>
            </span>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500">
                Page <span className="font-black text-slate-700">{page}</span> of <span className="font-black text-slate-700">{totalPages}</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="p-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 rounded-xl transition-all cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 rounded-xl transition-all cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end z-50 transition-opacity">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between font-sans">
            <div className="space-y-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <History className="h-5 w-5 text-indigo-650" />
                  <h3 className="text-lg font-black text-slate-900">Audit Log Details</h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-4 text-xs font-semibold text-slate-800">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 font-sans">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Action</span>
                    <span className="inline-block bg-slate-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md text-slate-700">{selectedLog.action}</span>
                  </div>
                  {role !== "STUDENT" && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Module</span>
                      <span className="text-sm font-black text-indigo-650">{selectedLog.module}</span>
                    </div>
                  )}
                  <div className="space-y-1 col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</span>
                    <span className="text-xs font-semibold text-slate-600 leading-relaxed block">{selectedLog.description}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                    {selectedLog.status === "SUCCESS" ? (
                      <span className="inline-flex items-center gap-0.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                        Failure
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timestamp</span>
                    <span className="font-mono text-slate-600">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* User Context */}
                {role !== "STUDENT" && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Actor Context</span>
                    <div className="border border-slate-250 rounded-2xl p-3 bg-white space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-550">Name</span>
                        <span className="font-extrabold text-slate-800">{selectedLog.user?.name || "System/Cron"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-550">Email</span>
                        <span className="font-extrabold text-slate-800 font-mono">{selectedLog.user?.email || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-550">Role</span>
                        <span className="font-extrabold text-slate-800 uppercase tracking-wider">{selectedLog.user?.role || "N/A"}</span>
                      </div>
                      {role !== ("FACULTY" as string) && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-550">IP Address</span>
                          <span className="font-extrabold text-slate-800 font-mono">{selectedLog.ipAddress || "N/A"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Network / Request Context */}
                {role !== "STUDENT" && role !== ("FACULTY" as string) && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Request Context</span>
                    <div className="border border-slate-250 rounded-2xl p-3 bg-white space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-550">HTTP Method</span>
                        <span className="font-black text-slate-800 font-mono">{selectedLog.requestMethod || "N/A"}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-550">Path</span>
                        <span className="font-extrabold text-slate-800 font-mono text-[11px] truncate max-w-sm">{selectedLog.requestPath || "N/A"}</span>
                      </div>
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-slate-550">User Agent</span>
                        <span className="text-slate-605 font-mono text-[10px] leading-normal break-all p-2 bg-slate-50 border border-slate-200/50 rounded-lg">{selectedLog.userAgent || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* State Diff / JSON Values */}
                {role !== "STUDENT" && role !== ("FACULTY" as string) && (selectedLog.oldValues || selectedLog.newValues) && (
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">State Modifications</span>
                    {selectedLog.oldValues && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Old State Values</span>
                        <pre className="bg-slate-900 text-slate-100 rounded-xl p-3 text-[10px] overflow-x-auto font-mono max-h-40">
                          {JSON.stringify(selectedLog.oldValues, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.newValues && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New State Values</span>
                        <pre className="bg-slate-900 text-slate-100 rounded-xl p-3 text-[10px] overflow-x-auto font-mono max-h-40">
                          {JSON.stringify(selectedLog.newValues, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-6">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl text-sm transition-all text-center cursor-pointer"
              >
                Close Details Drawer
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </DashboardPageContainer>
    </DashboardLayout>
  );
}
