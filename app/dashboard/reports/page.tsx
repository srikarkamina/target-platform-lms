"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import StatsCards from "@/components/reports/StatsCards";
import StudentChart from "@/components/reports/StudentChart";
import CertificateChart from "@/components/reports/CertificateChart";
import CourseTable from "@/components/reports/CourseTable";
import StudentTable from "@/components/reports/StudentTable";
import RecentActivityTable from "@/components/reports/RecentActivityTable";
import { BarChart3, Loader2, AlertCircle, RefreshCw, TrendingUp, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface Statistics {
  totalStudents: number;
  totalFaculty: number;
  totalCourses: number;
  totalEnrollments: number;
  totalCertificates: number;
  activeCertificates: number;
  revokedCertificates: number;
  totalQuizAttempts: number;
  averageQuizScore: number;
  // Faculty metrics
  assignedCourses?: number;
  assignments?: number;
  pendingAssignments?: number;
  completedAssignments?: number;
  certificatesIssued?: number;
}

interface GrowthData {
  month: string;
  count: number;
}

interface CourseAnalytic {
  id: string;
  courseCode: string;
  courseName: string;
  studentsEnrolled: number;
  certificatesIssued: number;
  averageQuizScore: number;
  completionPercentage: number;
}

interface StudentPerformance {
  studentName: string;
  email: string;
  course: string;
  quizAverage: number;
  certificatesEarned: number;
  progressPercentage: number;
}

interface ReportsDashboardData {
  statistics: Statistics;
  studentGrowth: GrowthData[];
  certificateGrowth: GrowthData[];
  quizGrowth: GrowthData[];
  courseAnalytics: CourseAnalytic[];
  certificateAnalytics: {
    certificatesIssued: number;
    certificatesRevoked: number;
    activeCertificates: number;
    certificatesPerCourse: any[];
  };
  studentPerformance: StudentPerformance[];
  recentActivity: any;
}

export default function AdminReportsDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string>("");

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

  const fetchReportsData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/reports");
      setData(res.data);
    } catch (err: any) {
      console.error("Failed to load reports:", err);
      const status = err.response?.status;
      if (status === 401) {
        localStorage.removeItem("token");
        toast.error("Session expired. Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else if (status === 403) {
        setError("Access forbidden: Administrator or Faculty permissions are required to access this dashboard.");
        toast.error("Access forbidden.");
      } else {
        setError("Failed to fetch reports and analytics from database records.");
        toast.error("Failed to load analytics data.");
      }
    } finally {
      setLoading(false);
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
    fetchReportsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topPerforming = data
    ? data.studentPerformance
        .filter((s) => s.progressPercentage >= 80 || s.quizAverage >= 80)
        .slice(0, 5)
    : [];

  const needsAttention = data
    ? data.studentPerformance
        .filter((s) => s.progressPercentage < 50 || s.quizAverage < 60)
        .slice(0, 5)
    : [];

  return (
    <DashboardLayout>
      <DashboardPageContainer>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
                <BarChart3 className="h-8 w-8 text-indigo-650" />
                <span>{role === "FACULTY" ? "Faculty Reports & Analytics" : "Reports & Analytics Dashboard"}</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {role === "FACULTY" 
                  ? "Monitor student progress, quiz performance, coursework submissions, and certificates for courses assigned to you."
                  : "Monitor institute-wide metrics, learning completion rates, student standing, and credential issues."}
              </p>
            </div>
            <button
              onClick={fetchReportsData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Refresh Reports</span>
            </button>
          </div>

          {error ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
              <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
              <h3 className="text-base font-bold text-rose-800">{error}</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Ensure you are logged in with an administrator or faculty account associated with a valid institute tenant.
              </p>
            </div>
          ) : loading ? (
            // Loading Skeletons
            <div className="space-y-8 animate-pulse">
              {/* Stats Cards Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 shrink-0"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-16 bg-slate-100 rounded"></div>
                      <div className="h-7 w-12 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Charts Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 h-64"></div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 h-64"></div>
              </div>
              {/* Tables Skeleton */}
              <div className="bg-white rounded-2xl border border-slate-200 h-96"></div>
            </div>
          ) : data ? (
            // Dashboard Content
            <>
              {/* Phase 1: Statistics Cards */}
              <StatsCards statistics={data.statistics} role={role} />

              {/* Phase 2: Monthly Analytics (Charts Section) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <StudentChart data={data.studentGrowth} />
                <CertificateChart data={data.certificateGrowth} />
              </div>

              {/* Faculty Special Sections: Top Performing and Needs Attention */}
              {role === "FACULTY" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Top Performing */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Top Performing Students</h3>
                    </div>
                    <div className="flex-1 space-y-4">
                      {topPerforming.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-6 text-center">No students meeting criteria.</p>
                      ) : (
                        topPerforming.map((s, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-3 rounded-xl border border-slate-50 hover:bg-slate-50/50">
                            <div>
                              <p className="font-extrabold text-slate-800">{s.studentName}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.course}</p>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-100">
                                Progress: {s.progressPercentage}%
                              </span>
                              <p className="text-[9px] font-bold text-slate-500 mt-1 font-mono">Quiz Avg: {s.quizAverage}%</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Needs Attention */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-rose-500" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Students Needing Attention</h3>
                    </div>
                    <div className="flex-1 space-y-4">
                      {needsAttention.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-6 text-center">All students are on track!</p>
                      ) : (
                        needsAttention.map((s, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs p-3 rounded-xl border border-rose-50 hover:bg-rose-50/50">
                            <div>
                              <p className="font-extrabold text-slate-800">{s.studentName}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.course}</p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold font-mono ${
                                s.progressPercentage < 35 
                                  ? "bg-rose-50 text-rose-700 border border-rose-100"
                                  : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}>
                                Progress: {s.progressPercentage}%
                              </span>
                              <p className="text-[9px] font-bold text-slate-500 mt-1 font-mono">Quiz Avg: {s.quizAverage}%</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity Section */}
              <div className="grid grid-cols-1 gap-8">
                <RecentActivityTable activity={data.recentActivity} />
              </div>

              {/* Phase 3 & 4: Course Performance Analytics */}
              <CourseTable courses={data.courseAnalytics} />

              {/* Phase 5: Student Performance Ranking Report */}
              <StudentTable students={data.studentPerformance} />
            </>
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
              <BarChart3 className="h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Analytics Data</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                No students or courses are registered in this institute yet. Add data to begin generating reports.
              </p>
            </div>
          )}
        </DashboardPageContainer>
    </DashboardLayout>
  );
}
