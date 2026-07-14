"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import AdminStatsCard from "@/components/reports/AdminStatsCard";
import AnalyticsGrid from "@/components/reports/AnalyticsGrid";
import RecentActivityTable from "@/components/reports/RecentActivityTable";
import CourseAnalyticsTable from "@/components/reports/CourseAnalyticsTable";
import StudentSummaryCard from "@/components/reports/StudentSummaryCard";
import QuizSummaryCard from "@/components/reports/QuizSummaryCard";
import {
  BarChart3,
  Users,
  Award,
  ClipboardCheck,
  Medal,
  BookOpen,
  Users2,
  RefreshCw,
  AlertCircle,
  Loader2,
  X,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

interface DashboardData {
  statistics: {
    students: { total: number; active: number; new: number };
    faculty: { total: number };
    courses: { total: number; published: number; draft: number; completed: number };
    quizzes: { total: number; attempts: number; averageScore: number };
    assignments: { total: number; submissions: number; pendingReviews: number };
    certificates: { total: number; active: number; revoked: number };
    platform: { completionRate: number; studentEngagement: number; averageProgress: number };
  };
  recentActivity: {
    enrollments: Array<{ id: string; studentName: string; courseTitle: string; date: string }>;
    quizAttempts: Array<{
      id: string;
      studentName: string;
      quizTitle: string;
      score: number;
      percentage: number;
      passed: boolean;
      date: string;
    }>;
    submissions: Array<{ id: string; studentName: string; assignmentTitle: string; grade: number | null; date: string }>;
    certificates: Array<{ id: string; studentName: string; courseTitle: string; certificateNumber: string; date: string }>;
  };
}

interface CourseDetailData {
  course: {
    id: string;
    courseCode: string;
    title: string;
    faculty: { name: string; email: string } | null;
  };
  stats: {
    totalStudents: number;
    completedStudents: number;
    completionRate: number;
    averageProgress: number;
    quizzesCount: number;
    quizAttempts: number;
    quizAverage: number;
    assignmentsCount: number;
    assignmentSubmissions: number;
    assignmentsGraded: number;
    averageAssignmentGrade: number;
    certificatesCount: number;
  };
  students: Array<{
    studentId: string;
    studentName: string;
    studentEmail: string;
    progress: number;
    quizzesAttempted: number;
    averageQuizScore: number;
    assignmentsSubmitted: number;
    certificateStatus: string;
  }>;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drill-down Modal State
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseDetail, setCourseDetail] = useState<CourseDetailData | null>(null);
  const [loadingCourseDetail, setLoadingCourseDetail] = useState(false);
  const [courseDetailError, setCourseDetailError] = useState<string | null>(null);

  const fetchDashboardReports = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [dashboardRes, adminCoursesRes] = await Promise.all([
        api.get("/reports/dashboard"),
        api.get("/reports/admin"),
      ]);

      setDashboardData(dashboardRes.data);
      setCoursesList(adminCoursesRes.data || []);
    } catch (err: any) {
      console.error("Failed to load admin analytics reports dashboard data:", err);
      const status = err.response?.status;
      if (status === 401) {
        localStorage.removeItem("token");
        toast.error("Session expired. Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else if (status === 403) {
        setError("Access forbidden: Administrator permissions are required.");
        toast.error("Access forbidden.");
      } else {
        setError("Failed to fetch administrator reports database records.");
        toast.error("Failed to load analytics data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetail = async (courseId: string) => {
    try {
      setLoadingCourseDetail(true);
      setCourseDetailError(null);
      setCourseDetail(null);
      const res = await api.get(`/reports/course/${courseId}`);
      setCourseDetail(res.data);
    } catch (err: any) {
      console.error("Failed to fetch course details report:", err);
      setCourseDetailError("Failed to load course details metrics.");
      toast.error("Failed to load course details.");
    } finally {
      setLoadingCourseDetail(false);
    }
  };

  useEffect(() => {
    fetchDashboardReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenDrilldown = (courseId: string) => {
    setSelectedCourseId(courseId);
    fetchCourseDetail(courseId);
  };

  const handleCloseDrilldown = () => {
    setSelectedCourseId(null);
    setCourseDetail(null);
    setCourseDetailError(null);
  };

  return (
    <DashboardLayout>
      <DashboardPageContainer>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
                <BarChart3 className="h-8 w-8 text-indigo-650" />
                <span>Admin Analytics Dashboard</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Monitor institute enrollment stats, platform completion metrics, coursework activities, and course analytics
              </p>
            </div>
            <button
              onClick={fetchDashboardReports}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Refresh Analytics</span>
            </button>
          </div>

          {error ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
              <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
              <h3 className="text-base font-bold text-rose-800">{error}</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Ensure you are logged in with an administrator account belonging to a valid academy tenant.
              </p>
            </div>
          ) : loading ? (
            // Page skeleton load
            <div className="space-y-8">
              {/* Summary stats loading skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 animate-pulse">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 shrink-0"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-16 bg-slate-100 rounded"></div>
                      <div className="h-7 w-12 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Overview skeleton */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
                <div className="space-y-3 flex-1">
                  <div className="h-4 w-40 bg-slate-100 rounded"></div>
                  <div className="h-3 w-80 bg-slate-100 rounded"></div>
                </div>
                <div className="h-28 w-28 rounded-full border-8 border-slate-100 shrink-0"></div>
              </div>
            </div>
          ) : (
            // Loaded content
            <>
              {/* Overview Statistics Cards */}
              {dashboardData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
                  <AdminStatsCard
                    title="Total Students"
                    value={dashboardData.statistics.students.total}
                    icon={Users}
                    color="blue"
                    subMetrics={[
                      { label: "Active", value: dashboardData.statistics.students.active },
                      { label: "New (30d)", value: `+${dashboardData.statistics.students.new}` },
                    ]}
                  />
                  <AdminStatsCard
                    title="Faculty Members"
                    value={dashboardData.statistics.faculty.total}
                    icon={Users2}
                    color="violet"
                  />
                  <AdminStatsCard
                    title="Curriculum Courses"
                    value={dashboardData.statistics.courses.total}
                    icon={BookOpen}
                    color="indigo"
                    subMetrics={[
                      { label: "Published", value: dashboardData.statistics.courses.published },
                      { label: "Drafts", value: dashboardData.statistics.courses.draft },
                    ]}
                  />
                  <AdminStatsCard
                    title="Assessments Quizzes"
                    value={dashboardData.statistics.quizzes.total}
                    icon={Award}
                    color="orange"
                    subMetrics={[
                      { label: "Attempts", value: dashboardData.statistics.quizzes.attempts },
                      { label: "Average Score", value: `${dashboardData.statistics.quizzes.averageScore}%` },
                    ]}
                  />
                  <AdminStatsCard
                    title="Coursework Assignments"
                    value={dashboardData.statistics.assignments.total}
                    icon={ClipboardCheck}
                    color="rose"
                    subMetrics={[
                      { label: "Submissions", value: dashboardData.statistics.assignments.submissions },
                      { label: "Pending Reviews", value: dashboardData.statistics.assignments.pendingReviews },
                    ]}
                  />
                  <AdminStatsCard
                    title="Issued Certificates"
                    value={dashboardData.statistics.certificates.total}
                    icon={Medal}
                    color="emerald"
                    subMetrics={[
                      { label: "Active", value: dashboardData.statistics.certificates.active },
                      { label: "Revoked", value: dashboardData.statistics.certificates.revoked },
                    ]}
                  />
                </div>
              )}

              {/* Platform Performance Summary ring gauges */}
              {dashboardData && (
                <AnalyticsGrid stats={dashboardData.statistics.platform} />
              )}

              {/* Side-by-side break-down cards and activity timeline */}
              {dashboardData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <StudentSummaryCard students={dashboardData.statistics.students} />
                    <QuizSummaryCard quizzes={dashboardData.statistics.quizzes} />
                  </div>
                  <div className="lg:col-span-2">
                    <RecentActivityTable activity={dashboardData.recentActivity} />
                  </div>
                </div>
              )}

              {/* Course Performance analytics table */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-indigo-650" />
                  <span>Course Performance Analytics</span>
                </h3>
                <CourseAnalyticsTable courses={coursesList} onViewDetails={handleOpenDrilldown} />
              </div>
            </>
          )}
      </DashboardPageContainer>

      {/* Course Detailed Drill-down Drawer Modal */}
      {selectedCourseId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50">
          <div className="w-full max-w-4xl bg-slate-50 h-full shadow-2xl flex flex-col animate-slide-in overflow-hidden border-l border-slate-200">
            {/* Modal Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="min-w-0">
                {courseDetail ? (
                  <>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">
                      {courseDetail.course.courseCode}
                    </span>
                    <h2 className="text-lg font-black text-slate-900 truncate mt-1.5">
                      {courseDetail.course.title}
                    </h2>
                  </>
                ) : (
                  <h2 className="text-lg font-black text-slate-900">Course Drill-down Metrics</h2>
                )}
              </div>
              <button
                onClick={handleCloseDrilldown}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-450 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingCourseDetail ? (
                <div className="h-96 flex flex-col items-center justify-center text-center">
                  <Loader2 className="h-10 w-10 text-indigo-650 animate-spin mb-3" />
                  <p className="text-sm text-slate-500 font-medium">Fetching detailed course metrics...</p>
                </div>
              ) : courseDetailError ? (
                <div className="text-center p-8 bg-white border border-rose-100 rounded-2xl shadow-xs">
                  <AlertCircle className="mx-auto h-12 w-12 text-rose-500 mb-3" />
                  <p className="text-sm font-bold text-slate-800">{courseDetailError}</p>
                </div>
              ) : courseDetail ? (
                <>
                  {/* Faculty Banner */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Instructor</p>
                      <h4 className="font-extrabold text-slate-800 text-sm mt-0.5">
                        {courseDetail.course.faculty?.name || "Unassigned Faculty"}
                      </h4>
                      {courseDetail.course.faculty?.email && (
                        <p className="text-xs text-slate-500 mt-0.5">{courseDetail.course.faculty.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Course metrics cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Students */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enrolled Students</span>
                      <h5 className="text-2xl font-black text-slate-800 mt-1 font-mono">{courseDetail.stats.totalStudents}</h5>
                      <span className="text-[9px] text-slate-450 font-bold block mt-0.5 uppercase tracking-wide font-mono">
                        {courseDetail.stats.completedStudents} Completed
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Progress</span>
                      <h5 className="text-2xl font-black text-slate-800 mt-1 font-mono">{courseDetail.stats.averageProgress}%</h5>
                      <span className="text-[9px] text-slate-450 font-bold block mt-0.5 uppercase tracking-wide font-mono">
                        {courseDetail.stats.completionRate}% Graduation
                      </span>
                    </div>

                    {/* Quizzes */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quiz Averages</span>
                      <h5 className="text-2xl font-black text-slate-800 mt-1 font-mono">{courseDetail.stats.quizAverage}%</h5>
                      <span className="text-[9px] text-slate-450 font-bold block mt-0.5 uppercase tracking-wide font-mono">
                        {courseDetail.stats.quizAttempts} Attempts submitted
                      </span>
                    </div>

                    {/* Assignments */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignments Avg</span>
                      <h5 className="text-2xl font-black text-slate-800 mt-1 font-mono">{courseDetail.stats.averageAssignmentGrade}%</h5>
                      <span className="text-[9px] text-slate-450 font-bold block mt-0.5 uppercase tracking-wide font-mono">
                        {courseDetail.stats.assignmentSubmissions} Submissions
                      </span>
                    </div>
                  </div>

                  {/* Student list section */}
                  <div className="space-y-3">
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <Users className="h-4.5 w-4.5 text-indigo-600" />
                      <span>Class Enrollment Listing ({courseDetail.students.length})</span>
                    </h3>

                    {courseDetail.students.length === 0 ? (
                      <div className="text-center p-10 bg-white border border-slate-200 rounded-xl text-slate-400 italic text-xs">
                        No students are currently enrolled in this course batch.
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-left text-xs text-slate-650">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-500">
                              <tr>
                                <th className="px-5 py-3">Student</th>
                                <th className="px-5 py-3 text-center">Progress</th>
                                <th className="px-5 py-3 text-center">Quizzes Taken</th>
                                <th className="px-5 py-3 text-center">Quiz Avg</th>
                                <th className="px-5 py-3 text-center">Assignments Done</th>
                                <th className="px-5 py-3 text-right">Certificate</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 font-medium text-slate-700 bg-white">
                              {courseDetail.students.map((student) => (
                                <tr key={student.studentId} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-5 py-3.5">
                                    <p className="font-bold text-slate-900">{student.studentName}</p>
                                    <p className="text-[10px] text-slate-450 mt-0.5 truncate max-w-[200px]" title={student.studentEmail}>
                                      {student.studentEmail}
                                    </p>
                                  </td>
                                  <td className="px-5 py-3.5 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="font-mono font-bold text-slate-800">{student.progress}%</span>
                                      <div className="w-12 bg-slate-100 rounded-full h-1 overflow-hidden">
                                        <div
                                          className={`h-1 rounded-full ${student.progress === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                                          style={{ width: `${student.progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-700">
                                    {student.quizzesAttempted}
                                  </td>
                                  <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-850">
                                    {student.averageQuizScore > 0 ? `${student.averageQuizScore}%` : "—"}
                                  </td>
                                  <td className="px-5 py-3.5 text-center font-mono font-bold text-slate-700">
                                    {student.assignmentsSubmitted}
                                  </td>
                                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                      student.certificateStatus === "Earned"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-150"
                                        : student.certificateStatus === "Revoked"
                                          ? "bg-rose-50 text-rose-700 border border-rose-150"
                                          : "bg-slate-50 text-slate-450 border border-slate-200"
                                    }`}>
                                      {student.certificateStatus}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
