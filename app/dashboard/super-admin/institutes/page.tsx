"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import { 
  Building, Search, Plus, Eye, Edit2, ShieldAlert, 
  ShieldCheck, Trash2, ChevronLeft, ChevronRight, X, Loader2 
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface Institute {
  id: string;
  name: string;
  logo: string | null;
  status: "ACTIVE" | "SUSPENDED" | "TRIAL" | "EXPIRED";
  createdAt: string;
  studentCount: number;
  facultyCount: number;
  courseCount: number;
  storageUsageBytes: number;
  suspendedAt: string | null;
  suspendedBy: string | null;
  adminName: string;
  adminEmail: string;
  adminPhone: string | null;
}

interface Plan {
  id: string;
  name: string;
  code: string;
  price: number;
  maxStudents: number | null;
  maxFaculty: number | null;
  maxCourses: number | null;
  storageLimitGB: number | null;
  trialDays: number;
  certificateLimit?: number | null;
}

export default function InstitutesListPage() {
  const router = useRouter();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  
  // Setup fields
  const [newName, setNewName] = useState("");
  const [newLogo, setNewLogo] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");

  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Edit states
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLogo, setEditLogo] = useState("");
  const [editAdminName, setEditAdminName] = useState("");
  const [editAdminEmail, setEditAdminEmail] = useState("");
  const [editAdminPhone, setEditAdminPhone] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

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

  const fetchInstitutes = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (search) params.search = search;
      if (status) params.status = status;

      const res = await api.get("/super-admin/institutes", { params });
      setInstitutes(res.data.data);
      setTotal(res.data.total);
    } catch (err: any) {
      console.error("Failed to load institutes:", err);
      toast.error("Failed to fetch institutes list.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status]);

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
    fetchInstitutes();
  }, [fetchInstitutes, router]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInstitutes();
  };


  const handleCreate = async (e: React.FormEvent, promoteConfirmed = false) => {
    e.preventDefault();
    if (
      !newName.trim() ||
      !newAdminName.trim() ||
      !newAdminEmail.trim()
    ) {
      toast.error("Please fill in all required fields marked with *.");
      return;
    }

    try {
      setSubmittingCreate(true);
      const response = await api.post("/super-admin/institutes", {
        name: newName,
        adminName: newAdminName,
        adminEmail: newAdminEmail,
        adminPhone: newPhone || null,
        logo: newLogo || null,
        promoteConfirmed,
      });

      if (response.data && response.data.promotionRequired) {
        const confirmMsg = `${response.data.message}\n\nDo you want to proceed and promote them?`;
        if (window.confirm(confirmMsg)) {
          // Re-submit with promoteConfirmed = true
          setSubmittingCreate(false);
          await handleCreate(e, true);
        }
        return;
      }

      toast.success("Institute created successfully.");
      
      // Reset form states
      setNewName("");
      setNewLogo("");
      setNewPhone("");
      setNewAdminName("");
      setNewAdminEmail("");
      
      setIsCreateOpen(false);
      fetchInstitutes();
      router.refresh();
    } catch (err: any) {
      console.error("Failed to create institute:", err);
      toast.error(err.response?.data?.message || "Failed to create institute.");
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleEdit = async (e: React.FormEvent, promoteConfirmed = false) => {
    e.preventDefault();
    if (
      !editName.trim() ||
      !editAdminName.trim() ||
      !editAdminEmail.trim()
    ) {
      toast.error("Please fill in all required fields marked with *.");
      return;
    }
    try {
      setSubmittingEdit(true);
      const response = await api.patch(`/super-admin/institutes/${editId}`, {
        name: editName,
        adminName: editAdminName,
        adminEmail: editAdminEmail,
        adminPhone: editAdminPhone || null,
        logo: editLogo || null,
        promoteConfirmed,
      });

      if (response.data && response.data.promotionRequired) {
        const confirmMsg = `${response.data.message}\n\nDo you want to proceed and promote them?`;
        if (window.confirm(confirmMsg)) {
          // Re-submit with promoteConfirmed = true
          setSubmittingEdit(false);
          await handleEdit(e, true);
        }
        return;
      }

      toast.success("Institute info updated!");
      setEditId(null);
      fetchInstitutes();
      router.refresh();
    } catch (err: any) {
      console.error("Failed to edit institute:", err);
      toast.error(err.response?.data?.message || "Failed to update institute.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const toggleStatus = async (inst: Institute) => {
    const isSuspended = inst.status === "SUSPENDED";
    const endpoint = isSuspended ? "activate" : "suspend";
    const confirmMsg = isSuspended
      ? `Are you sure you want to activate ${inst.name}?`
      : `Are you sure you want to suspend ${inst.name}? This blocks access to all users under this tenant.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.post(`/super-admin/institutes/${inst.id}/${endpoint}`);
      toast.success(isSuspended ? "Institute activated!" : "Institute suspended.");
      fetchInstitutes();
      router.refresh();
    } catch (err: any) {
      console.error("Failed to change status:", err);
      toast.error(err.response?.data?.message || "Failed to update status.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This will hide this tenant in soft-delete mode.`)) return;

    try {
      await api.delete(`/super-admin/institutes/${id}`);
      toast.success("Institute soft-deleted successfully.");
      fetchInstitutes();
      router.refresh();
    } catch (err: any) {
      console.error("Failed to delete institute:", err);
      toast.error(err.response?.data?.message || "Failed to delete institute.");
    }
  };

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        <div className="space-y-6 font-sans">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <Building className="h-6 w-6 text-indigo-600" />
                Institute Directory
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage registered institutes, monitor storage, view student/faculty capacities, and adjust status.
              </p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4" />
              New Institute
            </button>
          </div>

          {/* Search/Filters bar */}
          <div className="bg-white p-4 border border-slate-200 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
            <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by institute name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              />
            </form>
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-40 px-3 py-2 bg-white border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="TRIAL">Trial</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>

          {/* Main Directory Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="px-6 py-4">Institute Details</th>
                    <th className="px-6 py-4 text-center">Students</th>
                    <th className="px-6 py-4 text-center">Faculty</th>
                    <th className="px-6 py-4 text-center">Courses</th>
                    <th className="px-6 py-4">Storage Used</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
                      </td>
                    </tr>
                  ) : institutes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                        No registered institutes found
                      </td>
                    </tr>
                  ) : (
                    institutes.map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {inst.logo ? (
                              <img src={inst.logo} alt="" className="h-8 w-8 rounded-lg object-contain bg-slate-50 shrink-0 border border-slate-100" />
                            ) : (
                              <span className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-650 flex items-center justify-center shrink-0 border border-indigo-100 font-bold text-sm">
                                {inst.name.charAt(0)}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 truncate">{inst.name}</p>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">Joined {new Date(inst.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-bold text-slate-850">{inst.studentCount}</td>
                        <td className="px-6 py-4 text-center text-xs font-bold text-slate-850">{inst.facultyCount}</td>
                        <td className="px-6 py-4 text-center text-xs font-bold text-slate-850">{inst.courseCount}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-650 font-mono">{formatStorage(inst.storageUsageBytes)}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                            inst.status === "ACTIVE" 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                              : inst.status === "TRIAL"
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : "bg-rose-50 text-rose-600 border-rose-100"
                          }`}>
                            {inst.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/dashboard/super-admin/institutes/${inst.id}`)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-indigo-650 rounded-lg transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditId(inst.id);
                                setEditName(inst.name);
                                setEditLogo(inst.logo || "");
                                setEditAdminName(inst.adminName || "");
                                setEditAdminEmail(inst.adminEmail || "");
                                setEditAdminPhone(inst.adminPhone || "");
                              }}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-indigo-655 rounded-lg transition-colors cursor-pointer"
                              title="Edit Institute Settings"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => toggleStatus(inst)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                inst.status === "SUSPENDED" 
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-600" 
                                  : "bg-rose-50 hover:bg-rose-100 text-rose-600"
                              }`}
                              title={inst.status === "SUSPENDED" ? "Reactivate Institute" : "Suspend Institute"}
                            >
                              {inst.status === "SUSPENDED" ? (
                                <ShieldCheck className="h-3.5 w-3.5" />
                              ) : (
                                <ShieldAlert className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(inst.id, inst.name)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Institute"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {!loading && totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Total: {total} registered institutes</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 bg-white border border-slate-200 text-slate-650 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-slate-700 font-extrabold px-3 py-1">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 bg-white border border-slate-200 text-slate-650 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Create Modal */}
          {isCreateOpen && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden my-8">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Building className="h-4.5 w-4.5 text-indigo-600" />
                    New Institute Setup
                  </h3>
                  <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={(e) => handleCreate(e)} className="flex flex-col max-h-[85vh]">
                  {/* Scrollable inputs section */}
                  <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Institute Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ABC Institute"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Logo URL</label>
                      <input
                        type="url"
                        placeholder="https://example.com/logo.png"
                        value={newLogo}
                        onChange={(e) => setNewLogo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Admin Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Admin Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. admin@abcinstitute.com"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Admin Phone</label>
                      <input
                        type="text"
                        placeholder="e.g. +91 9999999999 (optional)"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Footer Action Bar */}
                  <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-650 hover:bg-slate-100 text-xs font-bold rounded-xl transition-colors cursor-pointer bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingCreate}
                      className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-55 cursor-pointer shadow-sm"
                    >
                      {submittingCreate && <Loader2 className="h-3 w-3 animate-spin" />}
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editId && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Edit Institute</h3>
                  <button onClick={() => setEditId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={(e) => handleEdit(e)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Institute Name *</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Logo URL</label>
                    <input
                      type="url"
                      value={editLogo}
                      onChange={(e) => setEditLogo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Admin Name *</label>
                    <input
                      type="text"
                      required
                      value={editAdminName}
                      onChange={(e) => setEditAdminName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Admin Email *</label>
                    <input
                      type="email"
                      required
                      value={editAdminEmail}
                      onChange={(e) => setEditAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Admin Phone</label>
                    <input
                      type="text"
                      value={editAdminPhone}
                      onChange={(e) => setEditAdminPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer bg-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingEdit}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-55 cursor-pointer"
                    >
                      {submittingEdit && <Loader2 className="h-3 w-3 animate-spin" />}
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardPageContainer>
    </DashboardLayout>
  );
}
