"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import { 
  Building, Users, BookOpen, 
  History, ArrowLeft, Loader2, AlertCircle, Calendar, ShieldAlert 
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

interface DetailData {
  institute: {
    id: string;
    name: string;
    logo: string | null;
    status: "ACTIVE" | "SUSPENDED" | "TRIAL" | "EXPIRED";
    createdAt: string;
    suspendedAt: string | null;
    suspendedBy: string | null;
  };
  statistics: {
    studentCount: number;
    facultyCount: number;
    courseCount: number;
    adminCount: number;
    certificateCount: number;
    storageUsageBytes: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    module: string;
    description: string;
    createdAt: string;
    user?: { name: string; email: string; role: string };
  }>;
  coursesSummary: Array<{
    id: string;
    title: string;
    courseCode: string;
    createdAt: string;
    faculty?: { name: string } | null;
  }>;
  usersSummary: {
    recentUsers: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
    counts: {
      STUDENT: number;
      FACULTY: number;
      ADMIN: number;
    };
  };
}

export default function InstituteDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, users, courses, logs

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

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/super-admin/institutes/${id}`);
      setData(res.data);
    } catch (err: any) {
      console.error("Failed to load tenant details:", err);
      setError("Failed to fetch detailed info for this institute.");
      toast.error("Error loading tenant profile.");
    } finally {
      setLoading(false);
    }
  }, [id]);

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
    fetchDetails();
  }, [fetchDetails, router]);

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex flex-col items-center justify-center p-32">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-xs text-slate-400 mt-2 font-semibold">Loading tenant profile...</p>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
            <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-rose-800">{error || "Institute not found"}</h3>
            <Link
              href="/dashboard/super-admin/institutes"
              className="mt-4 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors"
            >
              Back to Directories
            </Link>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  const inst = data.institute;
  const stats = data.statistics;

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        <div className="space-y-6 font-sans">
          {/* Breadcrumb / Back button */}
          <div className="flex items-center gap-2">
            <Link 
              href="/dashboard/super-admin/institutes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 text-xs font-bold rounded-xl transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>

          {/* Profile Header Block */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {inst.logo ? (
                <img src={inst.logo} alt="" className="h-16 w-16 rounded-2xl object-contain bg-slate-50 border border-slate-100 shrink-0" />
              ) : (
                <span className="h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-150 font-extrabold text-2xl">
                  {inst.name.charAt(0)}
                </span>
              )}
              <div className="min-w-0">
                <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                  {inst.name}
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${
                    inst.status === "ACTIVE" 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : "bg-rose-50 text-rose-600 border-rose-100"
                  }`}>
                    {inst.status}
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">Tenant ID: {inst.id}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Joined {new Date(inst.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>
            </div>

            {/* Suspend warning banner */}
            {inst.status === "SUSPENDED" && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3 max-w-md">
                <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-rose-800">Tenant Suspended</p>
                  <p className="text-[10px] text-rose-600 mt-0.5 leading-normal">
                    This institute was suspended on {inst.suspendedAt ? new Date(inst.suspendedAt).toLocaleDateString() : "unknown date"}. All users under this tenant are currently blocked from logging in.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-slate-200 flex items-center gap-6">
            {[
              { id: "overview", label: "Overview", icon: Building },
              { id: "users", label: "Users & Faculty", icon: Users },
              { id: "courses", label: "Courses", icon: BookOpen },
              { id: "logs", label: "Audit Logs", icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer focus:outline-hidden ${
                    isActive 
                      ? "border-indigo-650 text-indigo-600" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tabs Content */}
          <div className="space-y-6">
            {/* 1. OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Students</p>
                    <p className="text-2xl font-extrabold text-slate-800 mt-1">{stats.studentCount}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Faculty</p>
                    <p className="text-2xl font-extrabold text-slate-800 mt-1">{stats.facultyCount}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Courses</p>
                    <p className="text-2xl font-extrabold text-slate-800 mt-1">{stats.courseCount}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Certificates</p>
                    <p className="text-2xl font-extrabold text-slate-800 mt-1">{stats.certificateCount}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Storage Used</p>
                    <p className="text-2xl font-extrabold text-slate-800 mt-1">{formatStorage(stats.storageUsageBytes)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Recent Activity Feed */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <History className="h-4.5 w-4.5 text-indigo-500" />
                      Recent Tenant Activity
                    </h3>
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {data.recentActivity.length === 0 ? (
                          <p className="text-xs text-slate-500 py-6 text-center">No recent actions logged</p>
                        ) : (
                          data.recentActivity.map((act, idx) => (
                            <li key={act.id}>
                              <div className="relative pb-6">
                                {idx !== data.recentActivity.length - 1 ? (
                                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" />
                                ) : null}
                                <div className="relative flex space-x-3">
                                  <span className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                                    <Building className="h-4 w-4 text-slate-450" />
                                  </span>
                                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                      <p className="text-xs font-semibold text-slate-600">
                                        {act.description}
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-0.5">
                                        By {act.user?.name || "System"} • {act.module} • {act.action}
                                      </p>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium shrink-0">
                                      {new Date(act.createdAt).toLocaleDateString()}
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

                  {/* Right Column: Mini stats overview */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Users className="h-4.5 w-4.5 text-indigo-500" />
                        Membership Allocation
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-500">Students</span>
                          <span className="font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{stats.studentCount}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-500">Faculty</span>
                          <span className="font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{stats.facultyCount}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-500">Admins</span>
                          <span className="font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{stats.adminCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. USERS TAB */}
            {activeTab === "users" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/70">
                  <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-indigo-650" />
                    Registered Tenant Members
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {data.usersSummary.recentUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500 font-semibold">No registered users in this institute</td>
                        </tr>
                      ) : (
                        data.usersSummary.recentUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/30">
                            <td className="px-6 py-3.5 font-bold text-slate-800">{user.name}</td>
                            <td className="px-6 py-3.5 text-slate-600 font-medium">{user.email}</td>
                            <td className="px-6 py-3.5">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                                user.role === "ADMIN" 
                                  ? "bg-purple-50 text-purple-600 border-purple-100" 
                                  : user.role === "FACULTY"
                                  ? "bg-blue-50 text-blue-600 border-blue-100"
                                  : "bg-slate-100 text-slate-650 border-slate-200"
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-slate-500 font-medium">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. COURSES TAB */}
            {activeTab === "courses" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/70">
                  <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="h-4.5 w-4.5 text-indigo-650" />
                    Institute Course Catalog
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Faculty</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Created Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {data.coursesSummary.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500 font-semibold">No courses created yet</td>
                        </tr>
                      ) : (
                        data.coursesSummary.map((course) => (
                          <tr key={course.id} className="hover:bg-slate-50/30">
                            <td className="px-6 py-3.5 font-extrabold text-indigo-600">{course.courseCode}</td>
                            <td className="px-6 py-3.5 font-bold text-slate-800">{course.title}</td>
                            <td className="px-6 py-3.5 text-slate-650 font-semibold">
                              {course.faculty?.name || <span className="text-slate-400 font-medium">Unassigned</span>}
                            </td>
                            <td className="px-6 py-3.5 text-slate-500 font-medium">
                              {new Date(course.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. AUDIT LOGS TAB */}
            {activeTab === "logs" && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/70">
                  <h3 className="text-xs font-bold text-slate-855 uppercase tracking-wider flex items-center gap-2">
                    <History className="h-4.5 w-4.5 text-indigo-650" />
                    Institute Transactional Log History
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Module</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Performer</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {data.recentActivity.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold">No audit logs found for this tenant</td>
                        </tr>
                      ) : (
                        data.recentActivity.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/30">
                            <td className="px-6 py-3.5">
                              <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase text-[9px]">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 font-bold text-slate-650 uppercase text-[9px]">{log.module}</td>
                            <td className="px-6 py-3.5 font-medium text-slate-700">{log.description}</td>
                            <td className="px-6 py-3.5 text-slate-600 font-semibold">
                              {log.user?.name || "System"}{" "}
                              <span className="text-[10px] text-slate-400 font-medium">({log.user?.role || "SYSTEM"})</span>
                            </td>
                            <td className="px-6 py-3.5 text-slate-500 font-semibold">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardPageContainer>
    </DashboardLayout>
  );
}
