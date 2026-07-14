"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import LoadingState from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import { 
  HelpCircle, Search, Filter, Plus, 
  Paperclip, Send, CheckCircle2,
  FileText, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

interface Attachment {
  fileUrl: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
}

interface Creator {
  name: string;
  role: string;
  email: string;
}

interface DoubtReply {
  id: string;
  content: string;
  attachments: Attachment[];
  createdBy: string;
  creator: Creator;
  createdAt: string;
}

interface DoubtTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  courseId: string;
  course: { title: string };
  createdBy: string;
  creator: Creator;
  assigneeId: string | null;
  assignee: { name: string; email: string } | null;
  attachments: Attachment[];
  createdAt: string;
}

export default function DoubtsPage() {
  const [role, setRole] = useState<string>("STUDENT");
  const [userId, setUserId] = useState<string>("");
  const [tickets, setTickets] = useState<DoubtTicket[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  
  // Ticket detail view
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketDetails, setTicketDetails] = useState<DoubtTicket | null>(null);
  const [replies, setReplies] = useState<DoubtReply[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const [replyUploading, setReplyUploading] = useState(false);

  // Status & Assignee updates (for Faculty/Admin)
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateAssigneeId, setUpdateAssigneeId] = useState("");
  const [updatingTicket, setUpdatingTicket] = useState(false);

  // New ticket modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [priorityField, setPriorityField] = useState("LOW");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Dropdowns lists
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [facultyList, setFacultyList] = useState<Array<{ id: string; name: string }>>([]);

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
      }
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams: Record<string, any> = {
        page,
        limit: 10,
        search: activeSearch || undefined,
        status: status || undefined,
        priority: priority || undefined,
      };

      const res = await api.get("/doubts", { params: queryParams });
      setTickets(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load doubts tickets");
    } finally {
      setLoading(false);
    }
  }, [page, status, priority, activeSearch]);

  const fetchDropdowns = useCallback(async () => {
    try {
      // Courses
      const coursesRes = await api.get("/courses");
      setCourses(coursesRes.data.data || []);
      
      // Faculty (for assignment dropdown)
      if (["ADMIN", "SUPER_ADMIN", "FACULTY"].includes(role)) {
        const facultyRes = await api.get("/users?role=FACULTY").catch(() => ({ data: { data: [] } }));
        setFacultyList(facultyRes.data?.data || []);
      }
    } catch (err) {
      console.error("Doubt dropdowns error:", err);
    }
  }, [role]);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  useEffect(() => {
    if (userId) {
      fetchDropdowns();
    }
  }, [userId, fetchDropdowns]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(search);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "create" | "reply") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === "create") {
      setUploadingAttachment(true);
    } else {
      setReplyUploading(true);
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/upload/doubt", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const newAttachment: Attachment = {
        fileUrl: res.data.url,
        fileName: res.data.fileName,
        mimeType: res.data.mimeType,
        fileSize: res.data.fileSize
      };
      if (target === "create") {
        setAttachments([...attachments, newAttachment]);
      } else {
        setReplyAttachments([...replyAttachments, newAttachment]);
      }
      toast.success("Attachment uploaded successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "File upload failed");
    } finally {
      setUploadingAttachment(false);
      setReplyUploading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || !courseId) {
      toast.error("Subject, description, and course are required.");
      return;
    }

    try {
      await api.post("/doubts", {
        subject: subject.trim(),
        description: description.trim(),
        courseId,
        priority: priorityField,
        attachments
      });
      toast.success("Doubt ticket submitted successfully");
      setShowCreateModal(false);
      setSubject("");
      setDescription("");
      setCourseId("");
      setPriorityField("LOW");
      setAttachments([]);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit doubt ticket");
    }
  };

  const fetchTicketDetails = async (id: string) => {
    try {
      setLoadingDetails(true);
      const res = await api.get(`/doubts/${id}`);
      setTicketDetails(res.data.ticket);
      setReplies(res.data.replies || []);
      setUpdateStatus(res.data.ticket.status);
      setUpdateAssigneeId(res.data.ticket.assigneeId || "");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load ticket details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSelectTicket = (id: string) => {
    if (activeTicketId === id) {
      setActiveTicketId(null);
      setTicketDetails(null);
      setReplies([]);
    } else {
      setActiveTicketId(id);
      setReplyInput("");
      setReplyAttachments([]);
      fetchTicketDetails(id);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || !replyInput.trim()) return;

    try {
      await api.post(`/doubts/${activeTicketId}/replies`, {
        content: replyInput.trim(),
        attachments: replyAttachments
      });
      toast.success("Response sent!");
      setReplyInput("");
      setReplyAttachments([]);
      fetchTicketDetails(activeTicketId);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send response");
    }
  };

  const handleUpdateTicketMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId) return;

    try {
      setUpdatingTicket(true);
      await api.patch(`/doubts/${activeTicketId}`, {
        status: updateStatus,
        assigneeId: updateAssigneeId || null
      });
      toast.success("Ticket details updated successfully");
      fetchTicketDetails(activeTicketId);
      fetchTickets(); // Refresh lists
    } catch (err) {
      console.error(err);
      toast.error("Failed to update ticket parameters");
    } finally {
      setUpdatingTicket(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "CLOSED": return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400";
      case "RESOLVED": return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450";
      case "IN_PROGRESS": return "bg-indigo-50 text-indigo-700 border-indigo-250 dark:bg-indigo-950/20 dark:text-indigo-400";
      default: return "bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400";
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "URGENT": return "bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/20 dark:text-rose-455";
      case "HIGH": return "bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400";
      case "MEDIUM": return "bg-indigo-50 text-indigo-750 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400";
      default: return "bg-slate-50 text-slate-650 border-slate-200 dark:bg-slate-805 dark:text-slate-400";
    }
  };

  const isFacultyOrAdmin = ["FACULTY", "ADMIN", "SUPER_ADMIN"].includes(role);

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 dark:bg-slate-950 p-6 rounded-3xl border border-slate-850 shadow-sm text-left">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-650 text-white">
              <HelpCircle className="h-6 w-6 text-white" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Doubt Resolution Center
              </h1>
              <p className="text-xs text-slate-200 mt-1">
                Post doubts, submit tickets, get official answers, and track ticket resolutions.
              </p>
            </div>
          </div>

          {!isFacultyOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 text-xs transition-colors shadow-sm shadow-indigo-100 dark:shadow-none border-none cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Raise Doubt Ticket</span>
            </button>
          )}
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search doubts by subject or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-855 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="hidden" />
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-650 dark:text-slate-350">
              <Filter className="h-3.5 w-3.5" />
              <span>Filters</span>
            </div>

            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-650 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPage(1); }}
              className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-650 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left list panel */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-450 dark:text-slate-500 text-left">Your Doubts Feed</h3>
            
            {loading ? (
              <LoadingState message="Fetching ticket list..." />
            ) : tickets.length === 0 ? (
              <EmptyState title="No Doubt Tickets" description="You have not created or been assigned any doubt resolution tickets." />
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTicket(t.id)}
                    className={`p-4 bg-white dark:bg-slate-900 border rounded-2xl transition-all cursor-pointer text-left hover:border-indigo-400 ${
                      activeTicketId === t.id ? "ring-2 ring-indigo-500 border-indigo-400" : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getStatusColor(t.status)}`}>
                        {t.status}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getPriorityColor(t.priority)}`}>
                        {t.priority}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug break-all mt-2.5 line-clamp-1">
                      {t.subject}
                    </h4>

                    <p className="text-[11px] font-medium text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {t.description}
                    </p>

                    <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-850 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                      <span>Course: {t.course.title}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right detail view */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-455 dark:text-slate-500 text-left">Ticket Details Workspace</h3>

            {!activeTicketId ? (
              <div className="bg-slate-50/50 dark:bg-slate-900/50 border border-dashed border-slate-250 dark:border-slate-800 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
                <HelpCircle className="h-10 w-10 text-slate-350 mb-3" />
                <p className="text-xs text-slate-450 font-bold">Select a doubt ticket from the feed to view discussions, updates, and post replies.</p>
              </div>
            ) : loadingDetails || !ticketDetails ? (
              <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-indigo-650" /></div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6 text-left">
                {/* Header Ticket Details */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-100 dark:border-slate-805 pb-6">
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${getStatusColor(ticketDetails.status)}`}>
                        {ticketDetails.status}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${getPriorityColor(ticketDetails.priority)}`}>
                        {ticketDetails.priority} Priority
                      </span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-extrabold uppercase">
                        Course: {ticketDetails.course.title}
                      </span>
                    </div>

                    <h2 className="text-base font-extrabold text-slate-850 dark:text-slate-150 leading-snug">
                      {ticketDetails.subject}
                    </h2>

                    <p className="text-xs font-semibold text-slate-650 dark:text-slate-350 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-850/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      {ticketDetails.description}
                    </p>

                    {/* Attachments */}
                    {ticketDetails.attachments && ticketDetails.attachments.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Ticket Attachments</p>
                        <div className="flex flex-wrap gap-2">
                          {ticketDetails.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-semibold text-indigo-650 dark:text-indigo-400 transition-colors shadow-2xs"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[150px]">{att.fileName}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <span>Created By: {ticketDetails.creator.name} ({ticketDetails.creator.role})</span>
                      <span>Assigned To: {ticketDetails.assignee?.name || "Unassigned"}</span>
                      <span>Date: {new Date(ticketDetails.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Settings panel (Faculty/Admin controls) */}
                  {isFacultyOrAdmin && (
                    <form onSubmit={handleUpdateTicketMeta} className="w-full md:w-60 bg-slate-50 dark:bg-slate-850/50 p-4 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Update Status</label>
                        <select
                          value={updateStatus}
                          onChange={(e) => setUpdateStatus(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden"
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </div>

                      {role !== "FACULTY" && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider">Update Assignee</label>
                          <select
                            value={updateAssigneeId}
                            onChange={(e) => setUpdateAssigneeId(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-hidden"
                          >
                            <option value="">-- Unassigned --</option>
                            {facultyList.map(f => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={updatingTicket}
                        className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl border-none cursor-pointer transition-colors shadow-2xs"
                      >
                        {updatingTicket ? "Updating..." : "Save Parameters"}
                      </button>
                    </form>
                  )}
                </div>

                {/* Responses List */}
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Responses ({replies.length})</h4>
                  
                  {replies.length === 0 ? (
                    <p className="text-xs text-slate-450 dark:text-slate-500 italic">No responses posted yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {replies.map((rep) => {
                        const isOwn = rep.createdBy === userId;
                        return (
                          <div key={rep.id} className={`p-4 bg-slate-50 dark:bg-slate-850 border rounded-2xl flex gap-3 text-left ${
                            isOwn ? "border-slate-200 dark:border-slate-800" : "border-indigo-100 bg-indigo-50/5"
                          }`}>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 font-bold text-xs uppercase">
                              {rep.creator.name.charAt(0)}
                            </span>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-850 dark:text-slate-150">{rep.creator.name}</span>
                                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-650 px-1.5 py-0.5 rounded font-extrabold uppercase">{rep.creator.role}</span>
                                <span className="text-[10px] text-slate-400">{new Date(rep.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-350 leading-relaxed">
                                {rep.content}
                              </p>

                              {/* Reply Attachments */}
                              {rep.attachments && rep.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {rep.attachments.map((att, idx) => (
                                    <a
                                      key={idx}
                                      href={att.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-semibold text-indigo-650 dark:text-indigo-400 transition-colors shadow-3xs"
                                    >
                                      <FileText className="h-3 w-3" />
                                      <span className="truncate max-w-[120px]">{att.fileName}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add Response Form */}
                {ticketDetails.status !== "CLOSED" ? (
                  <form onSubmit={handlePostReply} className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                    {replyAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {replyAttachments.map((att, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-750 dark:text-slate-350">
                            <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-[120px]">{att.fileName}</span>
                            <button
                              type="button"
                              onClick={() => setReplyAttachments(replyAttachments.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-red-500 ml-1 font-bold text-sm cursor-pointer"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <input
                        type="text"
                        required
                        placeholder="Type response detail..."
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />

                      {/* File attachment inside replies */}
                      <label className="p-2.5 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl flex items-center justify-center cursor-pointer">
                        <Paperclip className="h-5 w-5 shrink-0" />
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "reply")}
                          disabled={replyUploading}
                        />
                      </label>

                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-2xs border-none cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center gap-2 text-slate-400 bg-slate-50 dark:bg-slate-850 px-4 py-3 rounded-2xl border">
                    <CheckCircle2 className="h-4 w-4 text-slate-400" />
                    <p className="text-xs font-semibold">This ticket is closed. Reopen or create a new one to continue.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs font-sans">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 dark:border-slate-805 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150 tracking-tight flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-indigo-650" />
                  <span>Raise Doubt Ticket</span>
                </h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-650 hover:bg-slate-50 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="p-6 space-y-6 text-left">
                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="Briefly state your doubt (e.g. Question 3 in Assignment 2)..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Detailed Description *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Explain what you are struggling with..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Select Course */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Course *</label>
                    <select
                      required
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Select Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Priority</label>
                    <select
                      value={priorityField}
                      onChange={(e) => setPriorityField(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Upload Attachments */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-550 uppercase tracking-wide font-sans">Upload Doubt Attachments</label>
                  
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-750 dark:text-slate-350">
                          <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate max-w-[120px]">{att.fileName}</span>
                          <button
                            type="button"
                            onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-500 ml-1 font-bold text-sm cursor-pointer"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-250 hover:border-indigo-400 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Paperclip className="h-6 w-6 text-slate-400 mb-1.5" />
                        <p className="text-xs text-slate-500 font-semibold">
                          {uploadingAttachment ? "Uploading file..." : "Click to upload file attachment"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Images, PDFs, documents up to 30MB
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, "create")}
                        disabled={uploadingAttachment}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-808">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-750 font-bold border border-slate-200 dark:border-slate-800 rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs border-none"
                  >
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardPageContainer>
    </DashboardLayout>
  );
}
