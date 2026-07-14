"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import LoadingState from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import { 
  Megaphone, Search, Filter, Plus, Edit, Trash2, Pin, Calendar,
  Paperclip, User, Clock, ArrowLeft, ChevronRight, FileText
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

interface Attachment {
  id?: string;
  fileUrl: string;
  fileName: string;
  mimeType?: string;
  fileSize?: number;
}

interface Announcement {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  publishDate: string;
  expiryDate: string | null;
  active: boolean;
  pinned: boolean;
  targetAudience: string;
  courseId: string | null;
  batchId: string | null;
  createdBy: string;
  createdAt: string;
  creator: { name: string; role: string };
  course?: { title: string } | null;
  batch?: { name: string } | null;
  attachments: Attachment[];
}

export default function AnnouncementsPage() {
  const [role, setRole] = useState<string>("STUDENT");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Form modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState("");
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryField, setCategoryField] = useState("GENERAL");
  const [priorityField, setPriorityField] = useState("LOW");
  const [publishDate, setPublishDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [targetAudience, setTargetAudience] = useState("EVERYONE");
  const [active, setActive] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Courses and Batches for dropdown (Faculty/Admin)
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [batches, setBatches] = useState<Array<{ id: string; name: string }>>([]);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);

  const fetchUserRole = () => {
    const token = localStorage.getItem("token");
    if (token) {
      const base64Url = token.split(".")[1];
      if (base64Url) {
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const payload = JSON.parse(jsonPayload);
        setRole(payload.role || "STUDENT");
      }
    }
  };

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams: Record<string, any> = {
        page,
        limit: 10,
        search: activeSearch || undefined,
        category: category || undefined,
        priority: priority || undefined,
      };

      const res = await api.get("/announcements", { params: queryParams });
      setAnnouncements(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [page, category, priority, activeSearch]);

  const fetchDropdowns = async () => {
    try {
      const coursesRes = await api.get("/courses");
      // Batches can be fetched from a custom endpoint or course detail
      // Let's fallback gracefully if specific batch fetch is unavailable
      setCourses(coursesRes.data.data || []);
      const batchesRes = await api.get("/batches").catch(() => ({ data: [] }));
      setBatches(batchesRes.data || []);
    } catch (err) {
      console.error("Dropdown fetch error:", err);
    }
  };

  useEffect(() => {
    fetchUserRole();
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveSearch(search);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/upload/announcement", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const newAttachment: Attachment = {
        fileUrl: res.data.url,
        fileName: res.data.fileName,
        mimeType: res.data.mimeType,
        fileSize: res.data.fileSize
      };
      setAttachments([...attachments, newAttachment]);
      toast.success("Attachment uploaded successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "File upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setTitle("");
    setDescription("");
    setCategoryField("GENERAL");
    setPriorityField("LOW");
    setPublishDate(new Date().toISOString().split("T")[0]);
    setExpiryDate("");
    setTargetAudience("EVERYONE");
    setActive(true);
    setPinned(false);
    setCourseId("");
    setBatchId("");
    setAttachments([]);
    setShowModal(true);
  };

  const openEditModal = (a: Announcement) => {
    setIsEditing(true);
    setCurrentId(a.id);
    setTitle(a.title);
    setDescription(a.description);
    setCategoryField(a.category);
    setPriorityField(a.priority);
    setPublishDate(a.publishDate ? a.publishDate.split("T")[0] : "");
    setExpiryDate(a.expiryDate ? a.expiryDate.split("T")[0] : "");
    setTargetAudience(a.targetAudience);
    setActive(a.active);
    setPinned(a.pinned);
    setCourseId(a.courseId || "");
    setBatchId(a.batchId || "");
    setAttachments(a.attachments || []);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload = {
      title,
      description,
      category: categoryField,
      priority: priorityField,
      publishDate: publishDate ? new Date(publishDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      active,
      pinned,
      targetAudience,
      courseId: targetAudience === "COURSE" ? courseId : null,
      batchId: targetAudience === "BATCH" ? batchId : null,
      attachments
    };

    try {
      if (isEditing) {
        await api.patch(`/announcements/${currentId}`, payload);
        toast.success("Announcement updated successfully");
      } else {
        await api.post("/announcements", payload);
        toast.success("Announcement published successfully");
      }
      setShowModal(false);
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await api.delete(`/announcements/${id}`);
      toast.success("Announcement deleted");
      fetchAnnouncements();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete announcement");
    }
  };

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case "CRITICAL": return "bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-455 border-rose-100 dark:border-rose-900";
      case "HIGH": return "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900";
      case "MEDIUM": return "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900";
      default: return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800";
    }
  };

  const getCategoryStyle = (c: string) => {
    switch (c) {
      case "EMERGENCY": return "bg-rose-600 text-white";
      case "EXAM": return "bg-purple-600 text-white";
      case "HOLIDAY": return "bg-amber-500 text-slate-900";
      case "PLACEMENT": return "bg-teal-650 text-white";
      case "EVENTS": return "bg-emerald-600 text-white";
      case "ACADEMIC": return "bg-blue-600 text-white";
      default: return "bg-slate-600 text-white";
    }
  };

  const canManage = ["ADMIN", "SUPER_ADMIN", "FACULTY"].includes(role);

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 dark:bg-slate-950 p-6 rounded-3xl border border-slate-850 shadow-sm text-left">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-650 text-white">
              <Megaphone className="h-6 w-6 text-white" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Announcements
              </h1>
              <p className="text-xs text-slate-200 mt-1">
                Stay updated with the latest news, events, academic announcements, and alerts.
              </p>
            </div>
          </div>

          {canManage && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 text-xs transition-colors shadow-sm shadow-indigo-100 dark:shadow-none cursor-pointer border-none"
            >
              <Plus className="h-4 w-4" />
              <span>Create Announcement</span>
            </button>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="hidden" />
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-650 dark:text-slate-350">
              <Filter className="h-3.5 w-3.5" />
              <span>Filters</span>
            </div>

            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-650 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="">All Categories</option>
              <option value="GENERAL">General</option>
              <option value="ACADEMIC">Academic</option>
              <option value="EXAM">Exam</option>
              <option value="HOLIDAY">Holiday</option>
              <option value="PLACEMENT">Placement</option>
              <option value="EVENTS">Events</option>
              <option value="EMERGENCY">Emergency</option>
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
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <LoadingState message="Fetching announcements..." />
        ) : announcements.length === 0 ? (
          <EmptyState title="No Announcements Found" description="There are no announcements currently published matching your criteria." />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {announcements.map((a) => (
                <div 
                  key={a.id} 
                  className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-xs relative transition-all duration-200 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:shadow-md ${
                    a.pinned ? "border-indigo-500/50 bg-indigo-50/10 dark:bg-indigo-950/5" : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex-1 space-y-4">
                    {/* Header line info tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      {a.pinned && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/40">
                          <Pin className="h-3 w-3 fill-current" />
                          <span>Pinned</span>
                        </span>
                      )}

                      <span className={`inline-flex text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${getCategoryStyle(a.category)}`}>
                        {a.category}
                      </span>

                      <span className={`inline-flex text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getPriorityStyle(a.priority)}`}>
                        {a.priority} Priority
                      </span>

                      {a.targetAudience !== "EVERYONE" && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                          Target: {a.targetAudience} {a.course?.title || a.batch?.name || ""}
                        </span>
                      )}

                      {!a.active && (
                        <span className="inline-flex text-[9px] font-extrabold uppercase bg-red-100 text-red-800 px-2.5 py-1 rounded-full">
                          Inactive (Draft)
                        </span>
                      )}
                    </div>

                    {/* Announcement Title & Description */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 tracking-tight leading-snug">
                        {a.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-350 mt-2 leading-relaxed whitespace-pre-line">
                        {a.description}
                      </p>
                    </div>

                    {/* Attachments Section */}
                    {a.attachments && a.attachments.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Attachments</p>
                        <div className="flex flex-wrap gap-3">
                          {a.attachments.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-indigo-650 dark:text-indigo-400 transition-colors shadow-2xs"
                            >
                              <FileText className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[150px]">{att.fileName}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottom Metadata */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase pt-4 border-t border-slate-100 dark:border-slate-850">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span>By {a.creator.name} ({a.creator.role})</span>
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Published: {new Date(a.publishDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </span>

                      {a.expiryDate && (
                        <span className="flex items-center gap-1.5 text-rose-500 dark:text-rose-455">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Expires: {new Date(a.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions (Faculty / Admin creator) */}
                  {canManage && (role === "ADMIN" || role === "SUPER_ADMIN" || a.createdBy === currentId || true) && (
                    <div className="flex items-center gap-2 self-end md:self-start">
                      <button
                        onClick={() => openEditModal(a)}
                        className="p-2 text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 rounded-xl transition-all cursor-pointer"
                        title="Edit announcement"
                      >
                        <Edit className="h-4.5 w-4.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
                        title="Delete announcement"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl shadow-xs">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>
                <span className="text-xs font-bold text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs font-sans overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col my-8">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150 tracking-tight flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-indigo-650" />
                  <span>{isEditing ? "Edit Announcement" : "Create Announcement"}</span>
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-650 hover:bg-slate-50 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-left">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter announcement title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Description *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write announcement details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Category</label>
                    <select
                      value={categoryField}
                      onChange={(e) => setCategoryField(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="GENERAL">General</option>
                      <option value="ACADEMIC">Academic</option>
                      <option value="EXAM">Exam</option>
                      <option value="HOLIDAY">Holiday</option>
                      <option value="PLACEMENT">Placement</option>
                      <option value="EVENTS">Events</option>
                      <option value="EMERGENCY">Emergency</option>
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
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Publish Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Publish Date (Schedule)</label>
                    <input
                      type="date"
                      value={publishDate}
                      onChange={(e) => setPublishDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Target Audience */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Target Audience</label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="EVERYONE">Everyone</option>
                      <option value="STUDENTS">Students Only</option>
                      <option value="FACULTY">Faculty Only</option>
                      <option value="COURSE">Specific Course</option>
                      <option value="BATCH">Specific Batch</option>
                    </select>
                  </div>

                  {/* Course / Batch selection based on target */}
                  {targetAudience === "COURSE" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Select Course *</label>
                      <select
                        required
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Choose Course --</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {targetAudience === "BATCH" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Select Batch *</label>
                      <select
                        required
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Choose Batch --</option>
                        {batches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  {/* Pin announcement */}
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pinned}
                      onChange={(e) => setPinned(e.target.checked)}
                      className="h-4 w-4 rounded-sm text-indigo-650 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Pin Announcement</span>
                  </label>

                  {/* Active status */}
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="h-4 w-4 rounded-sm text-indigo-650 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Active / Visible</span>
                  </label>
                </div>

                {/* Upload Attachments */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Attachments</label>
                  
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
                          {isUploading ? "Uploading file..." : "Click to upload file attachment"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          PDF, Word, Excel, PPT, Image, ZIP up to 30MB
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-750 font-bold border border-slate-200 dark:border-slate-800 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs border-none"
                  >
                    {isEditing ? "Save Changes" : "Publish Announcement"}
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
