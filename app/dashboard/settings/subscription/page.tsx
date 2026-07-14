"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import { 
  Check, AlertTriangle, AlertCircle, 
  Loader2, RefreshCw, Sparkles, HelpCircle 
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface UsageData {
  planName: string;
  planCode: string;
  price: number;
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED";
  startsAt: string;
  expiresAt: string | null;
  trialEndsAt: string | null;
  autoRenew: boolean;
  trialRemainingDays: number | null;
  limits: {
    students: number | null;
    faculty: number | null;
    courses: number | null;
    admins: number | null;
    storageLimitGB: number | null;
  };
  usage: {
    students: number;
    faculty: number;
    courses: number;
    admins: number;
    storageUsedMB: number;
  };
  remaining: {
    students: number | null;
    faculty: number | null;
    courses: number | null;
    admins: number | null;
    storageRemainingMB: number | null;
  };
  percentages: {
    students: number;
    faculty: number;
    courses: number;
    admins: number;
    storage: number;
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
}

const formatInrPrice = (price: number) => {
  if (price === 0) return "₹0";
  if (price === 49) return "₹499";
  if (price === 149) return "₹1,499";
  if (price === 499) return "₹4,999";
  return `₹${(price * 10).toLocaleString()}`;
};

export default function SubscriptionSettingsPage() {
  const router = useRouter();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

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

  const fetchSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [usageRes, plansRes] = await Promise.all([
        api.get("/subscription/usage"),
        api.get("/subscriptions/plans"),
      ]);
      setUsage(usageRes.data);
      setPlans(plansRes.data);
    } catch (err: any) {
      console.error("Failed to load subscription settings:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Access denied. You do not have permissions to view this resource.");
      } else {
        setError("Failed to fetch subscription parameters.");
        toast.error("Failed to load subscription details.");
      }
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
    if (payload && payload.role) {
      setRole(payload.role);
      if (payload.role === "ADMIN") {
        fetchSubscriptionData();
      } else {
        setLoading(false);
      }
    } else {
      router.push("/login");
    }
  }, [fetchSubscriptionData, router]);

  const toggleAutoRenew = async () => {
    if (!usage) return;
    try {
      const nextRenew = !usage.autoRenew;
      await api.patch("/subscription", { autoRenew: nextRenew });
      toast.success(nextRenew ? "Auto-renew enabled." : "Auto-renew disabled.");
      fetchSubscriptionData();
    } catch (err: any) {
      console.error("Failed to toggle auto renew:", err);
      toast.error("Failed to update auto renew status.");
    }
  };

  const formatCapacity = (limit: number | null) => {
    return limit === null ? "Unlimited" : limit.toLocaleString();
  };

  const formatStorage = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex flex-col items-center justify-center p-32">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-650" />
            <p className="text-xs text-slate-400 mt-2 font-semibold">Loading subscription workspace...</p>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  if (role !== "ADMIN") {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150">Access Denied</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
              Institute subscription management is restricted to administrators. You do not have permissions to view this resource.
            </p>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  if (error || !usage) {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
            <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-rose-800">{error || "No subscription info"}</h3>
            <button
              onClick={fetchSubscriptionData}
              className="mt-4 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  // 1. Evaluate Over Quota States
  const isOverStudents = usage.limits.students !== null && usage.usage.students > usage.limits.students;
  const isOverFaculty = usage.limits.faculty !== null && usage.usage.faculty > usage.limits.faculty;
  const isOverCourses = usage.limits.courses !== null && usage.usage.courses > usage.limits.courses;
  const isOverStorage = usage.limits.storageLimitGB !== null && (usage.usage.storageUsedMB / 1024) > usage.limits.storageLimitGB;
  
  const isOverQuota = isOverStudents || isOverFaculty || isOverCourses || isOverStorage;
  const isTrialExpired = usage.status === "EXPIRED";
  const isSuspended = usage.status === "SUSPENDED";

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        <div className="space-y-8 font-sans max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                Subscription & Billing
              </h1>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Manage your workspace limits and monitor storage levels.
              </p>
            </div>
            <button
              onClick={fetchSubscriptionData}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Usage
            </button>
          </div>

          {/* Trial Expired Alert Banner */}
          {isTrialExpired && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 shadow-xs">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-rose-800">Trial Period Expired</h3>
                <p className="text-[11px] text-rose-600 mt-1 leading-relaxed">
                  Your free trial has ended. New student registrations, faculty creations, course catalogs, and file uploads are disabled until you upgrade your plan. Contact your Super Admin to reactivate your workspace.
                </p>
              </div>
            </div>
          )}

          {/* Suspended Alert Banner */}
          {isSuspended && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 shadow-xs">
              <AlertCircle className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-red-800">Workspace Suspended</h3>
                <p className="text-[11px] text-red-650 mt-1 leading-relaxed">
                  This workspace has been suspended by the System Administrator. All read-write operations are locked.
                </p>
              </div>
            </div>
          )}

          {/* Over Quota Warning Banner */}
          {!isTrialExpired && !isSuspended && isOverQuota && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 shadow-xs">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-amber-800">Workspace Over-Quota Warning</h3>
                <p className="text-[11px] text-amber-600 mt-1 leading-relaxed">
                  Your institute usage exceeds the active plan limits. Creation of additional resources is locked until usage falls below boundaries.
                </p>
              </div>
            </div>
          )}

          {/* Current Plan Overview Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Plan Info */}
            <div className="p-6 md:col-span-1 space-y-4">
              <div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase bg-indigo-50 text-indigo-600">
                  {usage.planCode} Plan
                </span>
                <h2 className="text-xl font-black text-slate-800 mt-2">{usage.planName}</h2>
                <p className="text-2xl font-black text-slate-700 mt-1">
                  {formatInrPrice(usage.price)}{" "}
                  <span className="text-xs font-bold text-slate-400">/ month</span>
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-50">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Status</span>
                  <span className={`font-extrabold uppercase ${
                    usage.status === "ACTIVE" 
                      ? "text-emerald-600" 
                      : usage.status === "TRIAL"
                      ? "text-blue-600 animate-pulse"
                      : "text-rose-600"
                  }`}>
                    {usage.status}
                  </span>
                </div>
                {usage.status === "TRIAL" && usage.trialRemainingDays !== null && (
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium">Trial Remaining</span>
                    <span className="font-extrabold text-blue-600">{usage.trialRemainingDays} days</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Renewal Date</span>
                  <span className="font-bold text-slate-700">
                    {usage.expiresAt ? new Date(usage.expiresAt).toLocaleDateString() : "No renewal date"}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={toggleAutoRenew}
                  className={`w-full py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    usage.autoRenew 
                      ? "bg-slate-50 border-slate-200 text-rose-600 hover:bg-rose-50"
                      : "bg-indigo-650 hover:bg-indigo-700 text-white border-transparent"
                  }`}
                >
                  {usage.autoRenew ? "Cancel Subscription" : "Enable Auto-Renew"}
                </button>
              </div>
            </div>

            {/* Limits Progress Bars */}
            <div className="p-6 md:col-span-2 space-y-6 bg-slate-50/40">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Workspace Capacity & Usage
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Students */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-650">
                    <span>Students</span>
                    <span className={isOverStudents ? "text-rose-600 font-black" : ""}>
                      {usage.usage.students} / {formatCapacity(usage.limits.students)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isOverStudents ? "bg-rose-600" : "bg-indigo-600"}`}
                      style={{ width: `${usage.percentages.students}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {usage.percentages.students}% consumed capacity
                  </p>
                </div>

                {/* Faculty */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-650">
                    <span>Faculty</span>
                    <span className={isOverFaculty ? "text-rose-600 font-black" : ""}>
                      {usage.usage.faculty} / {formatCapacity(usage.limits.faculty)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isOverFaculty ? "bg-rose-600" : "bg-purple-600"}`}
                      style={{ width: `${usage.percentages.faculty}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {usage.percentages.faculty}% consumed capacity
                  </p>
                </div>

                {/* Courses */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-650">
                    <span>Courses</span>
                    <span className={isOverCourses ? "text-rose-600 font-black" : ""}>
                      {usage.usage.courses} / {formatCapacity(usage.limits.courses)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isOverCourses ? "bg-rose-600" : "bg-amber-600"}`}
                      style={{ width: `${usage.percentages.courses}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {usage.percentages.courses}% consumed capacity
                  </p>
                </div>

                {/* Storage */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-650">
                    <span>Disk Storage</span>
                    <span className={isOverStorage ? "text-rose-600 font-black" : ""}>
                      {formatStorage(usage.usage.storageUsedMB)} / {formatCapacity(usage.limits.storageLimitGB)} {usage.limits.storageLimitGB !== null ? "GB" : ""}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isOverStorage ? "bg-rose-600" : "bg-emerald-600"}`}
                      style={{ width: `${usage.percentages.storage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {usage.percentages.storage}% consumed capacity
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Plans Tiers Grid */}
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                Available Workspace Plans
              </h2>
              <p className="text-xs text-slate-400 leading-normal">
                Scale your capacity dynamically as your institute grows. Contact support for plan changes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
              {plans.map((plan) => {
                const isCurrent = plan.code === usage.planCode;
                return (
                  <div 
                    key={plan.id}
                    className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between relative transition-all ${
                      isCurrent 
                        ? "border-indigo-600 ring-2 ring-indigo-600/10 scale-105 z-10" 
                        : "border-slate-200 hover:border-slate-350"
                    }`}
                  >
                    {plan.code === "professional" && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-indigo-650 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider shadow-sm">
                        <Sparkles className="h-2.5 w-2.5 fill-white" /> Popular
                      </span>
                    )}

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-black text-slate-450 uppercase tracking-wider">{plan.name}</p>
                        <p className="text-3xl font-black text-slate-800 mt-1">{formatInrPrice(plan.price)}</p>
                        <p className="text-[10px] text-slate-400 mt-1">INR billed monthly</p>
                      </div>

                      <ul className="space-y-2.5 pt-4 border-t border-slate-105 text-xs text-slate-600 font-semibold">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{formatCapacity(plan.maxStudents)} Students limit</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{formatCapacity(plan.maxFaculty)} Faculty limit</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{formatCapacity(plan.maxCourses)} Course Catalogs</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{plan.storageLimitGB === null ? "Unlimited" : `${plan.storageLimitGB} GB`} Disk Space</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-6">
                      {isCurrent ? (
                        <div className="w-full py-2.5 bg-slate-100 text-slate-450 text-xs font-bold text-center rounded-xl border border-transparent">
                          Current Plan
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toast.success("Plan change request forwarded to your Account Manager.", { icon: "📥" })}
                          className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white shadow-sm border border-transparent rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Request Upgrade
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Contact support information */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3 max-w-xl mx-auto">
              <HelpCircle className="h-5 w-5 text-slate-450 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-normal font-medium">
                Want custom resource configurations or have complex requirements? Contact our support team directly to configure a custom Enterprise quote plan.
              </p>
            </div>
          </div>
        </div>
      </DashboardPageContainer>
    </DashboardLayout>
  );
}
