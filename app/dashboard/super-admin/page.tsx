"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import StatCard from "@/components/dashboard/StatCard";
import { 
  Building, Users, UserCheck, BookOpen, Database, CreditCard,
  History, LogIn, Activity, RefreshCw, AlertCircle, Loader2,
  Eye, Edit2, ShieldAlert, ShieldCheck, Trash2
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface InstituteStatRow {
  id: string;
  name: string;
  logo: string | null;
  students: number;
  faculty: number;
  courses: number;
  storageGB: number;
  planName: string;
  status: "ACTIVE" | "SUSPENDED" | "TRIAL" | "EXPIRED";
  subscriptionId: string | null;
}

interface DashboardData {
  summary: {
    totalInstitutes: number;
    activeInstitutes: number;
    suspendedInstitutes: number;
    totalStudents: number;
    totalFaculty: number;
    totalCourses: number;
    storageUsageBytes: number;
    activePlans: number;
    expiredPlans: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    module: string;
    description: string;
    createdAt: string;
    user?: { name: string; email: string; role: string };
    institute?: { name: string };
  }>;
  newestInstitutes: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
  }>;
  latestLogins: Array<{
    id: string;
    createdAt: string;
    user?: { name: string; email: string };
    institute?: { name: string };
  }>;
  mostActiveInstitutes: Array<{
    id: string;
    name: string;
    status: string;
    activityCount: number;
  }>;
  instituteStats: InstituteStatRow[];
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit/Change Plan Modal states
  const [editingInst, setEditingInst] = useState<InstituteStatRow | null>(null);
  const [editName, setEditName] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const [subscribingInst, setSubscribingInst] = useState<InstituteStatRow | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [submittingPlan, setSubmittingPlan] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/super-admin/dashboard");
      setData(res.data);
    } catch (err: any) {
      console.error("Failed to load Super Admin dashboard:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Access denied. Directing to main dashboard.");
        router.push("/dashboard");
      } else {
        setError("Failed to fetch global SaaS metrics.");
        toast.error("Failed to load dashboard data.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchPlans = async () => {
    try {
      const res = await api.get("/subscriptions/plans");
      setPlans(res.data);
    } catch (err) {
      console.error("Failed to load plans:", err);
    }
  };

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
    if (!token) {
      router.push("/login");
      return;
    }
    const payload = parseJwt(token);
    if (!payload || payload.role !== "SUPER_ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchDashboardData();
    fetchPlans();
  }, [fetchDashboardData, router]);

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Actions
  const handleEditOpen = (inst: InstituteStatRow) => {
    setEditingInst(inst);
    setEditName(inst.name);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInst) return;
    try {
      setSubmittingEdit(true);
      await api.patch(`/super-admin/institutes/${editingInst.id}`, { name: editName });
      toast.success("Institute profile updated!");
      setEditingInst(null);
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update institute.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleChangePlanOpen = (inst: InstituteStatRow) => {
    setSubscribingInst(inst);
    setSelectedPlanId("");
  };

  const handleChangePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribingInst || !subscribingInst.subscriptionId) {
      toast.error("No active subscription found to modify. Please manage from Subscriptions list.");
      setSubscribingInst(null);
      return;
    }
    try {
      setSubmittingPlan(true);
      await api.patch(`/super-admin/subscriptions/${subscribingInst.subscriptionId}`, {
        planId: selectedPlanId,
      });
      toast.success("Subscription plan updated successfully!");
      setSubscribingInst(null);
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change subscription plan.");
    } finally {
      setSubmittingPlan(false);
    }
  };

  const toggleSuspend = async (inst: InstituteStatRow) => {
    const isSuspended = inst.status === "SUSPENDED";
    const endpoint = isSuspended ? "activate" : "suspend";
    const confirmMsg = isSuspended 
      ? `Are you sure you want to activate ${inst.name}?`
      : `Are you sure you want to suspend ${inst.name}? This blocks access to all users under this tenant.`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.post(`/super-admin/institutes/${inst.id}/${endpoint}`);
      toast.success(isSuspended ? "Institute activated!" : "Institute suspended.");
      fetchDashboardData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update tenant status.");
    }
  };

  const handleDelete = async (inst: InstituteStatRow) => {
    if (!window.confirm(`Are you sure you want to delete ${inst.name}? This is a soft delete and will hide this tenant.`)) return;

    try {
      await api.delete(`/super-admin/institutes/${inst.id}`);
      toast.success("Institute deleted.");
      fetchDashboardData();
    } catch {
      toast.error("Failed to delete institute.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex flex-col items-center justify-center p-32">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-xs text-slate-400 mt-2 font-semibold">
              Loading global SaaS dashboard...
            </p>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
            <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-rose-800">{error}</h3>
            <button
              onClick={fetchDashboardData}
              className="mt-4 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  const s = data?.summary;

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        <div className="space-y-8 font-sans">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                Super Admin Console 👑
              </h1>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Global SaaS administration, tenant control, system resource monitoring, and multi-tenant isolation.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/dashboard/super-admin/institutes")}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Building className="h-4 w-4" />
                Manage Directories
              </button>
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <StatCard
              title="Total Institutes"
              value={s?.totalInstitutes || 0}
              icon={Building}
              color="indigo"
              description="Total registered institutes"
            />
            <StatCard
              title="Active Institutes"
              value={s?.activeInstitutes || 0}
              icon={Building}
              color="emerald"
              description="Active billing accounts"
            />
            <StatCard
              title="Suspended Institutes"
              value={s?.suspendedInstitutes || 0}
              icon={Building}
              color="rose"
              description="Temporarily blocked"
            />
            <StatCard
              title="Total Students"
              value={s?.totalStudents || 0}
              icon={Users}
              color="blue"
              description="Registered students"
            />
            <StatCard
              title="Total Faculty"
              value={s?.totalFaculty || 0}
              icon={UserCheck}
              color="purple"
              description="Teaching faculty members"
            />
            <StatCard
              title="Total Courses"
              value={s?.totalCourses || 0}
              icon={BookOpen}
              color="amber"
              description="Curriculum catalog"
            />
            <StatCard
              title="Active Subscriptions"
              value={s?.activePlans || 0}
              icon={CreditCard}
              color="emerald"
              description="Active and trial plans"
            />
            <StatCard
              title="Expired Subscriptions"
              value={s?.expiredPlans || 0}
              icon={CreditCard}
              color="rose"
              description="Plans needing renewal"
            />
            <div className="sm:col-span-2 lg:col-span-4">
              <StatCard
                title="Total Storage Used"
                value={formatStorage(s?.storageUsageBytes || 0)}
                icon={Database}
                color="slate"
                description="Aggregate disk space"
              />
            </div>
          </div>

          {/* New Section: Institute-wise Statistics */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building className="h-4.5 w-4.5 text-indigo-500" />
              Institute-wise Statistics & Capacity Usage
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="px-6 py-4">Institute</th>
                    <th className="px-6 py-4 text-center">Students</th>
                    <th className="px-6 py-4 text-center">Faculty</th>
                    <th className="px-6 py-4 text-center">Courses</th>
                    <th className="px-6 py-4 text-center">Storage</th>
                    <th className="px-6 py-4 text-center">Plan</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                  {data?.instituteStats.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">No institutes registered</td>
                    </tr>
                  ) : (
                    data?.instituteStats.map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-slate-800">{inst.name}</td>
                        <td className="px-6 py-3.5 text-center font-mono font-bold text-slate-800">{inst.students}</td>
                        <td className="px-6 py-3.5 text-center font-mono font-bold text-slate-800">{inst.faculty}</td>
                        <td className="px-6 py-3.5 text-center font-mono font-bold text-slate-800">{inst.courses}</td>
                        <td className="px-6 py-3.5 text-center font-mono font-bold text-slate-800">{inst.storageGB} GB</td>
                        <td className="px-6 py-3.5 text-center uppercase tracking-wide font-extrabold text-indigo-650">{inst.planName}</td>
                        <td className="px-6 py-3.5 text-center">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                            inst.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : inst.status === "SUSPENDED"
                              ? "bg-rose-50 text-rose-600 border-rose-100"
                              : "bg-amber-50 text-amber-600 border-amber-100"
                          }`}>
                            {inst.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/dashboard/super-admin/institutes/${inst.id}`)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleEditOpen(inst)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                              title="Edit Profile"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleChangePlanOpen(inst)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-indigo-650 rounded-lg transition-colors cursor-pointer"
                              title="Change Plan"
                              disabled={!inst.subscriptionId}
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => toggleSuspend(inst)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                inst.status === "SUSPENDED"
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                                  : "bg-rose-50 hover:bg-rose-100 text-rose-600"
                              }`}
                              title={inst.status === "SUSPENDED" ? "Activate Tenant" : "Suspend Tenant"}
                            >
                              {inst.status === "SUSPENDED" ? (
                                <ShieldCheck className="h-3.5 w-3.5" />
                              ) : (
                                <ShieldAlert className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(inst)}
                              className="p-1.5 bg-slate-50 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Tenant"
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
          </div>

          {/* Row 2: Tenants and activity lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Newest Institutes list */}
            <div className="lg:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building className="h-4 w-4 text-indigo-500" />
                Newest Tenants
              </h2>
              <div className="space-y-4">
                {data?.newestInstitutes.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No tenants found</p>
                ) : (
                  data?.newestInstitutes.map((inst) => (
                    <div 
                      key={inst.id} 
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/super-admin/institutes/${inst.id}`)}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-xs font-bold text-slate-700 truncate">{inst.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Created {new Date(inst.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        inst.status === "ACTIVE" 
                          ? "bg-emerald-50 text-emerald-600" 
                          : "bg-rose-50 text-rose-600"
                      }`}>
                        {inst.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Most Active Tenants & Latest Logins */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  Most Active Tenants
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tenant</th>
                        <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                        <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Event Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.mostActiveInstitutes.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-xs text-slate-500">No events logged</td>
                        </tr>
                      ) : (
                        data?.mostActiveInstitutes.map((inst) => (
                          <tr 
                            key={inst.id} 
                            className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/dashboard/super-admin/institutes/${inst.id}`)}
                          >
                            <td className="py-3 text-xs font-bold text-slate-700">{inst.name}</td>
                            <td className="py-3 text-center">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                inst.status === "ACTIVE" 
                                  ? "bg-emerald-50 text-emerald-600" 
                                  : "bg-rose-50 text-rose-600"
                              }`}>
                                {inst.status}
                              </span>
                            </td>
                            <td className="py-3 text-xs font-bold text-slate-600 text-right">{inst.activityCount} actions</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Latest Logins */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <LogIn className="h-4 w-4 text-indigo-500" />
                  Latest User Logins
                </h2>
                <div className="space-y-3">
                  {data?.latestLogins.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No logins logged</p>
                  ) : (
                    data?.latestLogins.map((login) => (
                      <div key={login.id} className="flex items-center justify-between text-xs p-3 rounded-xl border border-slate-50">
                        <div className="min-w-0 pr-3">
                          <p className="font-bold text-slate-700 truncate">{login.user?.name || "System"}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{login.user?.email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-slate-600 truncate">{login.institute?.name || "Global / SaaS"}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {new Date(login.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Global System Logs */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-500" />
              Recent SaaS System Logs (Audit Log)
            </h2>
            <div className="flow-root">
              <ul className="-mb-8">
                {data?.recentActivity.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No system actions registered</p>
                ) : (
                  data?.recentActivity.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== data.recentActivity.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center ring-8 ring-white">
                              <Activity className="h-4 w-4 text-slate-650" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-xs font-semibold text-slate-600">
                                {activity.description}{" "}
                                <span className="font-normal text-slate-400">
                                  by {activity.user?.name || "System"} ({activity.user?.role || "SYSTEM"})
                                </span>
                              </p>
                              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-1">
                                {activity.module} • {activity.action} • {activity.institute?.name || "Global / System"}
                              </p>
                            </div>
                            <div className="text-right text-[10px] whitespace-nowrap text-slate-400 font-medium">
                              {new Date(activity.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at{" "}
                              {new Date(activity.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </DashboardPageContainer>

      {/* Edit Profile Modal */}
      {editingInst && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Edit2 className="h-4.5 w-4.5 text-amber-600" />
                Edit Tenant Profile
              </h3>
              <button onClick={() => setEditingInst(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Institute Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingInst(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl disabled:opacity-55 cursor-pointer"
                >
                  {submittingEdit && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {subscribingInst && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-indigo-650" />
                Modify Subscription Plan
              </h3>
              <button onClick={() => setSubscribingInst(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleChangePlanSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-2">Select new pricing tier for <b>{subscribingInst.name}</b>:</p>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="">-- Choose Plan --</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (₹{p.price}/mo)</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubscribingInst(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-650 hover:bg-slate-50 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPlan || !selectedPlanId}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl disabled:opacity-55 cursor-pointer"
                >
                  {submittingPlan && <Loader2 className="h-3 w-3 animate-spin" />}
                  Change Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
