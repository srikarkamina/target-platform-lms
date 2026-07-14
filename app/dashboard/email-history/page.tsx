"use client";

import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { 
  Search, Loader2, RefreshCw, ChevronLeft, ChevronRight, Mail, 
  Calendar, Filter, Eye, X, AlertTriangle, RotateCw
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";

interface EmailRecord {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  type: string;
  status: string;
  retryCount: number;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  } | null;
}

export default function EmailHistoryPage() {
  const [role, setRole] = useState<string>("STUDENT");
  const [records, setRecords] = useState<EmailRecord[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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

  const fetchRecords = async (currentPage = page) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const params = new URLSearchParams();
      params.append("page", String(currentPage));
      params.append("limit", String(limit));
      if (search) params.append("search", search);
      if (status) params.append("status", status);
      if (type) params.append("type", type);
      if (startDate) params.append("startDate", new Date(startDate).toISOString());
      if (endDate) params.append("endDate", new Date(endDate).toISOString());

      const res = await fetch(`/api/institute/email/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch email history");
      }

      const data = await res.json();
      setRecords(data.data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error(err.message || "Error loading email history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      fetchRecords(1);
      setPage(1);
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, search, status, type, startDate, endDate]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchRecords(newPage);
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`/api/institute/email/history/${id}/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to queue email retry");
      }

      toast.success("Email retry queued successfully!");
      fetchRecords();
    } catch (err: any) {
      toast.error(err.message || "Failed to retry email");
    } finally {
      setRetryingId(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setType("");
    setStartDate("");
    setEndDate("");
    toast.success("Filters reset successfully");
  };

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
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
                Only administrators are authorized to view and interact with the enterprise email settings and history logs.
              </p>
            </div>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  const totalPages = Math.ceil(total / limit) || 1;

  const typesList = [
    "WELCOME", "COURSE_ENROLLMENT", "ASSIGNMENT_CREATED", 
    "ASSIGNMENT_REMINDER", "QUIZ_PUBLISHED", "QUIZ_REMINDER", 
    "CERTIFICATE_ISSUED", "PASSWORD_RESET", "GENERAL"
  ];

  const statusesList = [
    "PENDING", "SENDING", "SENT", "FAILED", "RETRYING", "CANCELLED"
  ];

  const getStatusBadgeClass = (statusStr: string) => {
    switch (statusStr) {
      case "SENT":
        return "text-emerald-700 bg-emerald-50 border-emerald-100";
      case "PENDING":
      case "SENDING":
        return "text-amber-700 bg-amber-50 border-amber-100 animate-pulse";
      case "RETRYING":
        return "text-indigo-700 bg-indigo-50 border-indigo-100";
      case "FAILED":
        return "text-rose-700 bg-rose-50 border-rose-100";
      default:
        return "text-slate-700 bg-slate-50 border-slate-100";
    }
  };

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        <Toaster position="top-right" />
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-6 w-6 text-indigo-600" />
                <h1 className="text-2xl font-black text-slate-900">Email Notification History</h1>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Monitor system email notifications, verify statuses, and manually retry failed message dispatches.
              </p>
            </div>
            <button
              onClick={() => fetchRecords()}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {/* Filters Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              <Filter className="h-3.5 w-3.5" />
              Filter Emails
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Search bar */}
              <div className="relative md:col-span-2">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by recipient email or subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="">All Statuses</option>
                  {statusesList.map((stat) => (
                    <option key={stat} value={stat}>{stat}</option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="">All Types</option>
                  {typesList.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button */}
              <div>
                <button
                  onClick={resetFilters}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold py-2.5 rounded-xl text-sm transition-all text-center cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sent From</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sent To</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logs Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="p-20 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-indigo-650 animate-spin" />
                <span className="text-xs font-bold text-slate-400">Loading email dispatch records...</span>
              </div>
            ) : records.length === 0 ? (
              <div className="p-20 text-center space-y-2">
                <Mail className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-sm font-black text-slate-800">No email records found</p>
                <p className="text-xs text-slate-400">Try adjusting your filters or search criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-4 px-6">Timestamp</th>
                      <th className="py-4 px-6">Recipient</th>
                      <th className="py-4 px-6">Subject</th>
                      <th className="py-4 px-6">Type</th>
                      <th className="py-4 px-6 text-center">Retries</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
                    {records.map((log) => {
                      const date = new Date(log.createdAt);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-4.5 px-6 whitespace-nowrap text-xs text-slate-500 font-mono">
                            {date.toLocaleString()}
                          </td>
                          <td className="py-4.5 px-6 whitespace-nowrap">
                            <span className="font-bold text-slate-800">{log.recipientEmail}</span>
                          </td>
                          <td className="py-4.5 px-6 max-w-xs truncate text-xs text-slate-700">
                            {log.subject}
                          </td>
                          <td className="py-4.5 px-6 whitespace-nowrap text-xs text-indigo-650">
                            {log.type}
                          </td>
                          <td className="py-4.5 px-6 text-center whitespace-nowrap text-xs font-mono text-slate-500">
                            {log.retryCount}
                          </td>
                          <td className="py-4.5 px-6 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadgeClass(log.status)}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-4.5 px-6 text-center whitespace-nowrap space-x-2">
                            <button
                              onClick={() => setSelectedEmail(log)}
                              className="inline-flex items-center justify-center p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {(log.status === "FAILED" || log.status === "RETRYING") && (
                              <button
                                onClick={() => handleRetry(log.id)}
                                disabled={retryingId === log.id}
                                className="inline-flex items-center justify-center p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Retry Now"
                              >
                                {retryingId === log.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCw className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Panel */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50/50">
                <span className="text-xs text-slate-500 font-semibold">
                  Page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong> ({total} records total)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="p-1.5 border border-slate-250 rounded-lg text-slate-600 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-1.5 border border-slate-250 rounded-lg text-slate-600 hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details Modal */}
        {selectedEmail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end z-50 transition-opacity">
            <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between font-sans">
              <div className="space-y-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-5 w-5 text-indigo-650" />
                    <h3 className="text-lg font-black text-slate-900">Email Logs Details</h3>
                  </div>
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="space-y-4 text-xs font-semibold text-slate-800">
                  {/* Meta details */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recipient</span>
                      <span className="text-sm font-black text-slate-800">{selectedEmail.recipientEmail}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Type</span>
                      <span className="text-sm font-black text-indigo-650">{selectedEmail.type}</span>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subject</span>
                      <span className="text-sm font-black text-slate-800 leading-normal block">{selectedEmail.subject}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(selectedEmail.status)}`}>
                        {selectedEmail.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Created Time</span>
                      <span className="font-mono text-slate-600">{new Date(selectedEmail.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Body Context */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Message Content</span>
                    <div className="border border-slate-200 rounded-2xl p-4 bg-white whitespace-pre-wrap font-sans text-xs text-slate-700 leading-relaxed max-h-60 overflow-y-auto">
                      {selectedEmail.body}
                    </div>
                  </div>

                  {/* Error block if failed */}
                  {selectedEmail.errorMessage && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Error Log</span>
                      <div className="border border-rose-100 rounded-2xl p-3 bg-rose-50/50 text-rose-800 font-mono text-[10px] leading-relaxed max-h-40 overflow-y-auto">
                        {selectedEmail.errorMessage}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl text-sm transition-all text-center cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardPageContainer>
    </DashboardLayout>
  );
}
