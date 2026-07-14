"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import { 
  CreditCard, Search, Edit3, ShieldAlert, ShieldCheck, 
  X, Loader2, Trash2 
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface Subscription {
  id: string;
  instituteId: string;
  planId: string;
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED";
  startsAt: string;
  expiresAt: string | null;
  trialEndsAt: string | null;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  plan: {
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
  };
  institute: {
    name: string;
    logo: string | null;
  };
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

const formatInrPrice = (price: number) => {
  if (price === 0) return "₹0";
  if (price === 49) return "₹499";
  if (price === 149) return "₹1,499";
  if (price === 499) return "₹4,999";
  return `₹${(price * 10).toLocaleString()}`;
};

export default function SuperAdminSubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  // Edit Modal State
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [editPlanId, setEditPlanId] = useState("");
  const [editStatus, setEditStatus] = useState<"TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED">("ACTIVE");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editTrialEndsAt, setEditTrialEndsAt] = useState("");
  
  // Custom limit overrides states
  const [editMaxStudents, setEditMaxStudents] = useState("");
  const [editMaxFaculty, setEditMaxFaculty] = useState("");
  const [editMaxCourses, setEditMaxCourses] = useState("");
  const [editStorageLimitGB, setEditStorageLimitGB] = useState("");
  const [editTrialDays, setEditTrialDays] = useState("");
  const [editCertificateLimit, setEditCertificateLimit] = useState("");

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

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (planFilter) params.planCode = planFilter;

      const [subRes, plansRes] = await Promise.all([
        api.get("/super-admin/subscriptions", { params }),
        api.get("/subscriptions/plans"),
      ]);

      setSubscriptions(subRes.data);
      setPlans(plansRes.data);
    } catch (err: any) {
      console.error("Failed to load subscription data:", err);
      toast.error("Failed to retrieve subscription records.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, planFilter]);

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
    fetchSubscriptions();
  }, [fetchSubscriptions, router]);

  const handleEditOpen = (sub: Subscription) => {
    setEditingSub(sub);
    setEditPlanId(sub.planId);
    setEditStatus(sub.status);
    setEditExpiresAt(sub.expiresAt ? new Date(sub.expiresAt).toISOString().split("T")[0] : "");
    setEditTrialEndsAt(sub.trialEndsAt ? new Date(sub.trialEndsAt).toISOString().split("T")[0] : "");
    setEditMaxStudents(sub.plan.maxStudents !== null ? String(sub.plan.maxStudents) : "");
    setEditMaxFaculty(sub.plan.maxFaculty !== null ? String(sub.plan.maxFaculty) : "");
    setEditMaxCourses(sub.plan.maxCourses !== null ? String(sub.plan.maxCourses) : "");
    setEditStorageLimitGB(sub.plan.storageLimitGB !== null ? String(sub.plan.storageLimitGB) : "");
    setEditTrialDays(String(sub.plan.trialDays));
    setEditCertificateLimit(
      sub.plan.certificateLimit !== null && sub.plan.certificateLimit !== undefined 
        ? String(sub.plan.certificateLimit) 
        : ""
    );
  };

  const handlePlanChange = (planId: string) => {
    setEditPlanId(planId);
    const chosenPlan = plans.find((p) => p.id === planId);
    if (chosenPlan) {
      setEditMaxStudents(chosenPlan.maxStudents !== null ? String(chosenPlan.maxStudents) : "");
      setEditMaxFaculty(chosenPlan.maxFaculty !== null ? String(chosenPlan.maxFaculty) : "");
      setEditMaxCourses(chosenPlan.maxCourses !== null ? String(chosenPlan.maxCourses) : "");
      setEditStorageLimitGB(chosenPlan.storageLimitGB !== null ? String(chosenPlan.storageLimitGB) : "");
      setEditTrialDays(String(chosenPlan.trialDays));
      setEditCertificateLimit(
        chosenPlan.certificateLimit !== null && chosenPlan.certificateLimit !== undefined 
          ? String(chosenPlan.certificateLimit) 
          : ""
      );
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    try {
      setSubmittingEdit(true);

      const maxStudents = editMaxStudents.trim() === "" ? null : parseInt(editMaxStudents, 10);
      const maxFaculty = editMaxFaculty.trim() === "" ? null : parseInt(editMaxFaculty, 10);
      const maxCourses = editMaxCourses.trim() === "" ? null : parseInt(editMaxCourses, 10);
      const storageLimitGB = editStorageLimitGB.trim() === "" ? null : parseFloat(editStorageLimitGB);
      const trialDays = editTrialDays.trim() === "" ? 14 : parseInt(editTrialDays, 10);
      const certificateLimit = editCertificateLimit.trim() === "" ? null : parseInt(editCertificateLimit, 10);

      await api.patch(`/super-admin/subscriptions/${editingSub.id}`, {
        planId: editPlanId,
        status: editStatus,
        expiresAt: editExpiresAt || null,
        trialEndsAt: editTrialEndsAt || null,
        maxStudents,
        maxFaculty,
        maxCourses,
        storageLimitGB,
        trialDays,
        certificateLimit,
      });

      toast.success("Subscription updated successfully.");
      setEditingSub(null);
      
      // Immediately refresh React state and route views without full reload
      fetchSubscriptions();
      router.refresh();

    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update subscription.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("CRITICAL WARNING: Are you sure you want to delete this subscription? This completely removes the billing record for this tenant.")) return;
    try {
      setSubmittingEdit(true);
      await api.delete(`/super-admin/subscriptions/${id}`);
      toast.success("Subscription deleted successfully.");
      setEditingSub(null);
      fetchSubscriptions();
      router.refresh();
    } catch {
      toast.error("Failed to delete subscription.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const toggleSuspend = async (sub: Subscription) => {
    const isSuspended = sub.status === "SUSPENDED";
    const newStatus = isSuspended ? "ACTIVE" : "SUSPENDED";
    const confirmMsg = isSuspended 
      ? `Reactivate subscription for ${sub.institute.name}?` 
      : `Suspend subscription for ${sub.institute.name}?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`/super-admin/subscriptions/${sub.id}`, { status: newStatus });
      toast.success(isSuspended ? "Subscription reactivated!" : "Subscription suspended.");
      fetchSubscriptions();
      router.refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update subscription status.");
    }
  };

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        <div className="space-y-6 font-sans">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-indigo-655" />
                Subscription Dashboard
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Administer global subscription plans, override resource capacity limits, or suspend/delete records.
              </p>
            </div>
          </div>

          {/* Search/Filters bar */}
          <div className="bg-white p-4 border border-slate-200 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by institute name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchSubscriptions()}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-40 px-3 py-2 bg-white border border-slate-200 text-xs font-semibold rounded-xl text-slate-700"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="TRIAL">TRIAL</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="w-full md:w-40 px-3 py-2 bg-white border border-slate-200 text-xs font-semibold rounded-xl text-slate-700"
              >
                <option value="">All Tiers</option>
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <button
                onClick={fetchSubscriptions}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-650 mx-auto" />
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 italic">No billing records found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="px-6 py-4">Institute</th>
                      <th className="px-6 py-4">Plan</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4">Expires At</th>
                      <th className="px-6 py-4">Trial Ends</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {sub.institute.logo ? (
                              <img src={sub.institute.logo} alt="" className="h-8 w-8 rounded-lg object-contain bg-slate-50 shrink-0 border border-slate-100" />
                            ) : (
                              <span className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 font-bold text-sm">
                                {sub.institute.name.charAt(0)}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{sub.institute.name}</p>
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">{sub.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-700">
                          {sub.plan.name} ({formatInrPrice(sub.plan.price)}/mo)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                            sub.status === "ACTIVE" 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                              : sub.status === "TRIAL"
                              ? "bg-blue-50 text-blue-600 border-blue-100"
                              : "bg-rose-50 text-rose-600 border-rose-100"
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-650 font-semibold font-mono">
                          {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : <span className="text-slate-400">Never</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-650 font-semibold font-mono">
                          {sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString() : <span className="text-slate-400">N/A</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditOpen(sub)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-indigo-655 rounded-lg transition-colors cursor-pointer"
                              title="Modify Billing Parameters"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => toggleSuspend(sub)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                sub.status === "SUSPENDED" 
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-600" 
                                  : "bg-rose-50 hover:bg-rose-100 text-rose-600"
                              }`}
                              title={sub.status === "SUSPENDED" ? "Reactivate Subscription" : "Suspend Subscription"}
                            >
                              {sub.status === "SUSPENDED" ? (
                                <ShieldCheck className="h-3.5 w-3.5" />
                              ) : (
                                <ShieldAlert className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Edit Modal */}
          {editingSub && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden my-8">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 font-sans">
                      <CreditCard className="h-4.5 w-4.5 text-indigo-655" />
                      Manage Subscription
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold truncate">Institute: {editingSub.institute.name}</p>
                    <p className="text-[10px] text-indigo-650 mt-0.5 font-bold">Current Plan: {editingSub.plan.name}</p>
                  </div>
                  <button onClick={() => setEditingSub(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleEditSubmit} className="flex flex-col max-h-[80vh] font-sans">
                  {/* Scrollable Fields area */}
                  <div className="p-6 space-y-4 overflow-y-auto flex-1 max-h-[55vh]">
                    {/* Basic Subscription Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Select Plan</label>
                        <select
                          value={editPlanId}
                          onChange={(e) => handlePlanChange(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
                        >
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} ({formatInrPrice(p.price)}/mo)</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Billing Status</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="SUSPENDED">Suspended</option>
                          <option value="EXPIRED">Expired</option>
                          <option value="TRIAL">Trial</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Expires At</label>
                        <input
                          type="date"
                          value={editExpiresAt}
                          onChange={(e) => setEditExpiresAt(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Trial Ends At</label>
                        <input
                          type="date"
                          value={editTrialEndsAt}
                          onChange={(e) => setEditTrialEndsAt(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700 font-mono"
                        />
                      </div>
                    </div>

                    {/* Overrides Fields Section */}
                    <div className="pt-2 border-t border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Custom Limits (optional)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Student Limit</label>
                          <input
                            type="number"
                            placeholder="e.g. 500"
                            value={editMaxStudents}
                            onChange={(e) => setEditMaxStudents(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Faculty Limit</label>
                          <input
                            type="number"
                            placeholder="e.g. 30"
                            value={editMaxFaculty}
                            onChange={(e) => setEditMaxFaculty(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Course Limit</label>
                          <input
                            type="number"
                            placeholder="e.g. 100"
                            value={editMaxCourses}
                            onChange={(e) => setEditMaxCourses(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Storage Limit (GB)</label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="e.g. 50.0"
                            value={editStorageLimitGB}
                            onChange={(e) => setEditStorageLimitGB(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Certificate Limit</label>
                          <input
                            type="number"
                            placeholder="e.g. 1000"
                            value={editCertificateLimit}
                            onChange={(e) => setEditCertificateLimit(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2">Trial Period (Days)</label>
                          <input
                            type="number"
                            placeholder="e.g. 14"
                            value={editTrialDays}
                            onChange={(e) => setEditTrialDays(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sticky Footer Action Bar */}
                  <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(editingSub.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                      title="Delete subscription completely"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Subscription
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingSub(null)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl transition-colors cursor-pointer bg-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingEdit}
                        className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-55 cursor-pointer shadow-sm"
                      >
                        {submittingEdit && <Loader2 className="h-3 w-3 animate-spin" />}
                        Apply
                      </button>
                    </div>
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
