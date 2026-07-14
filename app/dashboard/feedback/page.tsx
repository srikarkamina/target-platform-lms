"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import EmptyState from "@/components/common/EmptyState";
import { 
  HeartHandshake, Search, Send, Loader2, Shield,
  Trash2, PlusCircle, Download, Clock, CheckCircle, Eye
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

interface Creator {
  name: string;
  email: string;
  role: string;
}

interface Feedback {
  id: string;
  category: string;
  priority: string;
  status: string;
  comments: string;
  anonymous: boolean;
  adminResponse: string | null;
  adminResponseAt: string | null;
  adminResponseById: string | null;
  instituteId: string;
  institute?: { name: string } | null;
  createdBy: string;
  creator?: Creator;
  createdAt: string;
}

export default function FeedbackPage() {
  const [role, setRole] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRole, setLoadingRole] = useState(true);
  
  // Institute Admin form fields
  const [submitCategory, setSubmitCategory] = useState("PLATFORM");
  const [submitPriority, setSubmitPriority] = useState("NORMAL");
  const [submitComments, setSubmitComments] = useState("");
  const [submitAnonymous, setSubmitAnonymous] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Super Admin action states
  const [activeFeedback, setActiveFeedback] = useState<Feedback | null>(null);
  const [adminResponseInput, setAdminResponseInput] = useState("");
  const [adminStatusInput, setAdminStatusInput] = useState("PENDING");
  const [adminPriorityInput, setAdminPriorityInput] = useState("NORMAL");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Filters for both views
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const fetchUserRole = useCallback(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        setRole(payload.role || "STUDENT");
        setUserId(payload.id || "");
      } else {
        setRole("STUDENT");
      }
    } else {
      setRole("STUDENT");
    }
    setLoadingRole(false);
  }, []);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams: Record<string, any> = {
        search: activeSearch || undefined,
        category: filterCategory || undefined,
        priority: filterPriority || undefined,
        status: filterStatus || undefined
      };

      const res = await api.get("/feedback", { params: queryParams });
      setFeedbacks(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load platform feedbacks");
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterPriority, filterStatus, activeSearch]);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  useEffect(() => {
    if (userId && ["ADMIN", "SUPER_ADMIN"].includes(role)) {
      fetchFeedbacks();
    }
  }, [userId, role, fetchFeedbacks]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(search);
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!submitComments.trim()) {
      toast.error("Comments or details are required");
      return;
    }

    try {
      setSubmittingFeedback(true);
      await api.post("/feedback", {
        category: submitCategory,
        priority: submitPriority,
        comments: submitComments.trim(),
        anonymous: submitAnonymous
      });

      toast.success("Feedback submitted successfully. Thank you for helping improve the platform!");
      setSubmitComments("");
      setSubmitCategory("PLATFORM");
      setSubmitPriority("NORMAL");
      setSubmitAnonymous(false);
      fetchFeedbacks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleUpdateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFeedback) return;

    try {
      setSubmittingResponse(true);
      await api.patch(`/feedback/${activeFeedback.id}`, {
        adminResponse: adminResponseInput.trim() || undefined,
        status: adminStatusInput,
        priority: adminPriorityInput
      });

      toast.success("Feedback ticket updated successfully");
      setAdminResponseInput("");
      setActiveFeedback(null);
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update feedback ticket");
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feedback ticket permanently?")) return;
    try {
      await api.delete(`/feedback/${id}`);
      toast.success("Feedback deleted successfully");
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete feedback ticket");
    }
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Institute", "Submitted By", "Category", "Priority", "Status", "Comments", "Reply", "Submitted At"];
    const rows = feedbacks.map(f => [
      f.id,
      f.institute?.name || "Global",
      f.anonymous ? "Anonymous Admin" : f.creator?.name || "Admin",
      f.category,
      f.priority,
      f.status,
      f.comments.replace(/"/g, '""'),
      (f.adminResponse || "").replace(/"/g, '""'),
      new Date(f.createdAt).toLocaleDateString()
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `platform_feedback_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Feedback logs exported successfully");
  };

  // Status badge styling helper
  const getStatusBadge = (s: string) => {
    switch (s) {
      case "RESOLVED": return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900";
      case "REVIEWED": return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900";
      default: return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900";
    }
  };

  // Priority badge styling helper
  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "URGENT": return "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900";
      case "HIGH": return "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900";
      case "NORMAL": return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-805 dark:text-slate-400 dark:border-slate-800";
      default: return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900";
    }
  };

  // Category badge styling helper
  const getCategoryBadge = (c: string) => {
    switch (c) {
      case "BUG_REPORT": return "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900";
      case "SUGGESTION": return "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900";
      case "PLATFORM": return "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900";
      default: return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-805 dark:text-slate-400 dark:border-slate-800";
    }
  };

  if (loadingRole) {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  // 403 Forbidden Access Denied for Students and Faculty
  if (!["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 mb-4">
              <Shield className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150">Access Denied</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
              SaaS platform feedback channels are restricted to administrators. You do not have permissions to view this resource.
            </p>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  const isSuperAdmin = role === "SUPER_ADMIN";

  // Calculations for Super Admin analytics
  const totalCount = feedbacks.length;
  const pendingCount = feedbacks.filter(f => f.status === "PENDING").length;
  const resolvedCount = feedbacks.filter(f => f.status === "RESOLVED").length;
  const reviewedCount = feedbacks.filter(f => f.status === "REVIEWED").length;

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 dark:bg-slate-950 p-6 rounded-3xl border border-slate-850 shadow-sm text-left">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-650 text-white">
              <HeartHandshake className="h-6 w-6 text-white" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                {isSuperAdmin ? "Feedback & Platform Tickets" : "Platform Feedback & Support"}
              </h1>
              <p className="text-xs text-slate-200 mt-1">
                {isSuperAdmin 
                  ? "SaaS Super Admin support dashboard: review institute reports, manage status steps, and send replies." 
                  : "Institute platform feedback channel: submit suggestions directly to SaaS Super Admins."}
              </p>
            </div>
          </div>
          {isSuperAdmin && feedbacks.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-transparent transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        {isSuperAdmin ? (
          /* ==================== SUPER ADMIN WORKSPACE ==================== */
          <div className="space-y-8 mt-6">
            {/* Analytics Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Tickets</span>
                <span className="text-2xl font-extrabold text-slate-850 dark:text-slate-150 block mt-1">{totalCount}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Awaiting Action</span>
                <span className="text-2xl font-extrabold text-amber-600 block mt-1">{pendingCount}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Reviewed</span>
                <span className="text-2xl font-extrabold text-blue-600 block mt-1">{reviewedCount}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Resolved</span>
                <span className="text-2xl font-extrabold text-emerald-600 block mt-1">{resolvedCount}</span>
              </div>
            </div>

            {/* List & Filters */}
            <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-6">
              {/* Form Filters */}
              <form onSubmit={handleFilterSubmit} className="flex flex-col lg:flex-row items-center gap-4 border-b border-slate-100 dark:border-slate-850 pb-6">
                <div className="relative w-full lg:flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-550" />
                  <input
                    type="text"
                    placeholder="Search ticket comments..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-350 focus:outline-hidden"
                  >
                    <option value="">All Categories</option>
                    <option value="PLATFORM">Platform</option>
                    <option value="BUG_REPORT">Bug Report</option>
                    <option value="SUGGESTION">Suggestion</option>
                    <option value="OTHER">Other</option>
                  </select>

                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-650 dark:text-slate-350 focus:outline-hidden"
                  >
                    <option value="">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-650 dark:text-slate-350 focus:outline-hidden"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>

                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-colors border-none cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              </form>

              {/* Feedbacks Entries List */}
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-650" /></div>
              ) : feedbacks.length === 0 ? (
                <EmptyState title="No platform feedback" description="No feedback received." />
              ) : (
                <div className="space-y-4">
                  {feedbacks.map((f) => (
                    <div 
                      key={f.id}
                      className="p-5 border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-6 text-left hover:border-indigo-400 transition-colors"
                    >
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getCategoryBadge(f.category)}`}>
                            {f.category}
                          </span>
                          
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getPriorityBadge(f.priority)}`}>
                            {f.priority} Priority
                          </span>

                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(f.status)}`}>
                            {f.status}
                          </span>

                          <span className="text-[10px] text-indigo-650 font-bold bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-md">
                            {f.institute?.name || "Global Workspace"}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-650 dark:text-slate-350 leading-normal whitespace-pre-line">
                          "{f.comments}"
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                          <span>Submitted By: {f.anonymous ? "Anonymous Admin" : f.creator?.name || "Institute Admin"}</span>
                          <span suppressHydrationWarning>{new Date(f.createdAt).toLocaleString()}</span>
                        </div>

                        {f.adminResponse && (
                          <div className="bg-emerald-500/5 border border-emerald-500/30 p-3.5 rounded-xl space-y-1.5 mt-3">
                            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Super Admin Official Response</span>
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-normal">
                              {f.adminResponse}
                            </p>
                            <span className="text-[9px] text-slate-400 block pt-1 border-t border-slate-100/50" suppressHydrationWarning>
                              Responded on {f.adminResponseAt ? new Date(f.adminResponseAt).toLocaleString() : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row md:flex-col gap-2 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => { 
                            setActiveFeedback(f); 
                            setAdminResponseInput(f.adminResponse || ""); 
                            setAdminStatusInput(f.status);
                            setAdminPriorityInput(f.priority);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 font-bold rounded-xl text-xs border border-indigo-200 dark:border-indigo-900 transition-colors cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Action</span>
                        </button>
                        <button
                          onClick={() => handleDeleteFeedback(f.id)}
                          className="inline-flex items-center justify-center p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                          title="Delete Ticket"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ==================== INSTITUTE ADMIN WORKSPACE ==================== */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-6">
            {/* Left side form */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs text-left space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-4">
                <PlusCircle className="h-5 w-5 text-indigo-650" />
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150">New Platform Ticket</h3>
              </div>

              <form onSubmit={handleSubmitFeedback} className="space-y-5">
                {/* Category Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Category</label>
                  <select
                    value={submitCategory}
                    onChange={(e) => setSubmitCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PLATFORM">General Platform</option>
                    <option value="BUG_REPORT">Bug Report</option>
                    <option value="SUGGESTION">Feature Request / Suggestion</option>
                    <option value="OTHER">Other Query</option>
                  </select>
                </div>

                {/* Priority Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Severity Priority</label>
                  <select
                    value={submitPriority}
                    onChange={(e) => setSubmitPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {/* Comments */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Ticket Details *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Describe your issue or suggestion in detail..."
                    value={submitComments}
                    onChange={(e) => setSubmitComments(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-850 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-y"
                  />
                </div>

                {/* Anonymous switch */}
                <label className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={submitAnonymous}
                    onChange={(e) => setSubmitAnonymous(e.target.checked)}
                    className="h-4 w-4 rounded-sm text-indigo-650 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Submit feedback anonymously</span>
                </label>

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm shadow-indigo-100 border-none cursor-pointer"
                >
                  {submittingFeedback ? "Submitting..." : "Submit Ticket"}
                </button>
              </form>
            </div>

            {/* Right side history */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-455 dark:text-slate-500 text-left">My Platform Feedbacks</h3>
              
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-650" /></div>
              ) : feedbacks.length === 0 ? (
                <EmptyState title="No feedback submitted yet." description="You have not submitted any feedbacks to this institute yet." />
              ) : (
                <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                  {feedbacks.map((f) => (
                    <div 
                      key={f.id}
                      className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4 text-left"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getCategoryBadge(f.category)}`}>
                            {f.category}
                          </span>
                          
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getPriorityBadge(f.priority)}`}>
                            {f.priority}
                          </span>

                          {f.anonymous && (
                            <span className="text-[9px] font-extrabold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              Anonymous submission
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold" suppressHydrationWarning>{new Date(f.createdAt).toLocaleDateString()}</span>
                      </div>

                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-line">
                        "{f.comments}"
                      </p>

                      {/* Status Timeline */}
                      <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Ticket Progress Timeline</span>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-1.5">
                            <Clock className={`h-4.5 w-4.5 ${f.status === "PENDING" ? "text-amber-500 animate-pulse" : "text-emerald-500"}`} />
                            <span className={`text-[10px] font-bold ${f.status === "PENDING" ? "text-amber-500" : "text-emerald-500"}`}>Submitted</span>
                          </div>
                          
                          <div className="h-0.5 w-8 bg-slate-200 dark:bg-slate-800" />

                          <div className="flex items-center gap-1.5">
                            {f.status === "PENDING" ? (
                              <Clock className="h-4.5 w-4.5 text-slate-300" />
                            ) : (
                              <Eye className={`h-4.5 w-4.5 ${f.status === "REVIEWED" ? "text-blue-500 animate-pulse" : "text-emerald-500"}`} />
                            )}
                            <span className={`text-[10px] font-bold ${f.status === "PENDING" ? "text-slate-300" : f.status === "REVIEWED" ? "text-blue-500" : "text-emerald-500"}`}>Reviewed</span>
                          </div>

                          <div className="h-0.5 w-8 bg-slate-200 dark:bg-slate-800" />

                          <div className="flex items-center gap-1.5">
                            {f.status === "RESOLVED" ? (
                              <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                            ) : (
                              <Clock className="h-4.5 w-4.5 text-slate-300" />
                            )}
                            <span className={`text-[10px] font-bold ${f.status === "RESOLVED" ? "text-emerald-500" : "text-slate-300"}`}>Resolved</span>
                          </div>
                        </div>
                      </div>

                      {f.adminResponse && (
                        <div className="bg-emerald-500/5 border border-emerald-500/30 p-3.5 rounded-xl space-y-1.5 mt-3">
                          <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Super Admin Official Response</span>
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-normal">
                            {f.adminResponse}
                          </p>
                          <span className="text-[9px] text-slate-400 block pt-1 border-t border-slate-100/50" suppressHydrationWarning>
                            Responded on {new Date(f.adminResponseAt || "").toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Super Admin Ticket Action Modal */}
        {activeFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs font-sans">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 dark:border-slate-805 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150 tracking-tight flex items-center gap-2">
                  <HeartHandshake className="h-5 w-5 text-indigo-650" />
                  <span>Update Feedback Ticket</span>
                </h3>
                <button 
                  onClick={() => setActiveFeedback(null)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-650 hover:bg-slate-50 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="p-6 space-y-4 text-left">
                <div className="bg-slate-50 dark:bg-slate-850 p-4 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-2">
                  <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-widest block">Institute Comment</span>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-350 leading-normal whitespace-pre-line">
                    "{activeFeedback.comments}"
                  </p>
                </div>

                <form onSubmit={handleUpdateFeedback} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Status</label>
                      <select
                        value={adminStatusInput}
                        onChange={(e) => setAdminStatusInput(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 focus:outline-hidden"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="REVIEWED">Reviewed</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Priority</label>
                      <select
                        value={adminPriorityInput}
                        onChange={(e) => setAdminPriorityInput(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 focus:outline-hidden"
                      >
                        <option value="LOW">Low</option>
                        <option value="NORMAL">Normal</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Write Response / Actions Taken</label>
                    <textarea
                      rows={4}
                      placeholder="Write an official response to the Institute Admin..."
                      value={adminResponseInput}
                      onChange={(e) => setAdminResponseInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-y"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-105 dark:border-slate-808">
                    <button
                      type="button"
                      onClick={() => setActiveFeedback(null)}
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-750 font-bold border border-slate-200 dark:border-slate-800 rounded-xl text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingResponse}
                      className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs border-none"
                    >
                      {submittingResponse ? "Updating..." : "Update Ticket"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </DashboardPageContainer>
    </DashboardLayout>
  );
}
