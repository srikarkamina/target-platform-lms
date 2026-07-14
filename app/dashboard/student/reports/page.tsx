"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import StudentStatsCard from "@/components/reports/StudentStatsCard";
import ProgressCard from "@/components/reports/ProgressCard";
import QuizPerformanceTable from "@/components/reports/QuizPerformanceTable";
import AssignmentTable from "@/components/reports/AssignmentTable";
import CertificateTable from "@/components/reports/CertificateTable";
import ProgressOverview from "@/components/reports/ProgressOverview";
import {
  BarChart3,
  BookOpen,
  Award,
  Medal,
  ClipboardCheck,
  RefreshCw,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface SummaryData {
  totalCoursesEnrolled: number;
  completedCourses: number;
  inProgressCourses: number;
  totalQuizzesAttempted: number;
  averageQuizScore: number;
  highestQuizScore: number;
  lowestQuizScore: number;
  totalAssignments: number;
  assignmentsSubmitted: number;
  pendingAssignments: number;
  certificatesEarned: number;
}

export default function StudentReportsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        summaryRes,
        progressRes,
        quizRes,
        assignmentsRes,
        certificatesRes,
      ] = await Promise.all([
        api.get("/reports/student"),
        api.get("/reports/student/progress"),
        api.get("/reports/student/quiz"),
        api.get("/reports/student/assignments"),
        api.get("/reports/student/certificates"),
      ]);

      setSummary(summaryRes.data);
      setProgress(progressRes.data || []);
      setQuizzes(quizRes.data || []);
      setAssignments(assignmentsRes.data || []);
      setCertificates(certificatesRes.data || []);

    } catch (err: any) {
      console.error("Failed to load student reports dashboard data:", err);
      const status = err.response?.status;
      if (status === 401) {
        localStorage.removeItem("token");
        toast.error("Session expired. Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else if (status === 403) {
        setError("Access forbidden: You do not have permissions to view these student reports.");
        toast.error("Access forbidden.");
      } else {
        setError("Failed to fetch reports database records.");
        toast.error("Failed to load reports data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout>
      <DashboardPageContainer>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
                <span>My Performance Reports</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Monitor your personal course progresses, quiz scoring records, assignment metrics, and earned certificates
              </p>
            </div>
            <button
              onClick={fetchAllData}
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
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-rose-200 shadow-xs text-center">
              <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
              <h3 className="text-base font-bold text-rose-800">{error}</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Try refreshing the reports, or verify you are signed in with a valid Student account.
              </p>
            </div>
          ) : loading ? (
            // Page skeleton load
            <div className="space-y-8">
              {/* Summary stats loading skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 animate-pulse">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 shrink-0"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-3 w-16 bg-slate-100 rounded"></div>
                      <div className="h-7 w-12 bg-slate-100 rounded"></div>
                      <div className="h-3 w-20 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Overview skeleton */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
                <div className="space-y-3 flex-1">
                  <div className="h-4 w-40 bg-slate-100 rounded"></div>
                  <div className="h-3 w-80 bg-slate-100 rounded"></div>
                  <div className="flex gap-4 pt-2">
                    <div className="h-8 w-28 bg-slate-100 rounded-xl"></div>
                    <div className="h-8 w-28 bg-slate-100 rounded-xl"></div>
                  </div>
                </div>
                <div className="h-32 w-32 rounded-full border-8 border-slate-100 shrink-0"></div>
              </div>

              {/* Course Progress Card list skeleton */}
              <div className="space-y-4">
                <div className="h-5 w-40 bg-slate-100 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 animate-pulse">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="h-4 w-16 bg-slate-100 rounded"></div>
                          <div className="h-5 w-36 bg-slate-100 rounded"></div>
                        </div>
                        <div className="h-6 w-6 rounded-full bg-slate-100"></div>
                      </div>
                      <div className="h-12 w-full bg-slate-50 rounded-xl border border-slate-100"></div>
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex justify-between">
                          <div className="h-3 w-16 bg-slate-100 rounded"></div>
                          <div className="h-3 w-8 bg-slate-100 rounded"></div>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Loaded content
            <>
              {/* Overall Statistics cards grid */}
              {summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  <StudentStatsCard
                    title="Courses Enrolled"
                    value={summary.totalCoursesEnrolled}
                    subtitle="Total Enrolls"
                    icon={BookOpen}
                    color="blue"
                  />
                  <StudentStatsCard
                    title="Completion %"
                    value={
                      summary.totalCoursesEnrolled > 0
                        ? `${Math.round((summary.completedCourses / summary.totalCoursesEnrolled) * 100)}%`
                        : "0%"
                    }
                    subtitle={`${summary.completedCourses} / ${summary.totalCoursesEnrolled} Finished`}
                    icon={Clock}
                    color="violet"
                  />
                  <StudentStatsCard
                    title="Quiz Average"
                    value={`${summary.averageQuizScore}%`}
                    subtitle={`Highest score: ${summary.highestQuizScore}%`}
                    icon={Award}
                    color="indigo"
                  />
                  <StudentStatsCard
                    title="Certificates"
                    value={summary.certificatesEarned}
                    subtitle="Earned Credentials"
                    icon={Medal}
                    color="emerald"
                  />
                  <StudentStatsCard
                    title="Assignments Pending"
                    value={summary.pendingAssignments}
                    subtitle={`${summary.assignmentsSubmitted} Submissions`}
                    icon={ClipboardCheck}
                    color="orange"
                  />
                </div>
              )}

              {/* Progress Overview RING component */}
              {summary && (
                <ProgressOverview
                  completedCourses={summary.completedCourses}
                  totalCourses={summary.totalCoursesEnrolled}
                />
              )}

              {/* Course Progress Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-650" />
                  <span>Course Learning Progress</span>
                </h3>
                {progress.length === 0 ? (
                  <div className="text-center p-12 bg-white border border-slate-200 rounded-2xl shadow-xs">
                    <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="text-sm font-bold text-slate-800">No active course enrollments</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      You are not enrolled in any academic courses. Get enrolled to view learning metrics here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {progress.map((prog) => (
                      <ProgressCard key={prog.courseId} progress={prog} />
                    ))}
                  </div>
                )}
              </div>

              {/* Detailed tables section split */}
              <div className="grid grid-cols-1 gap-8">
                {/* Quiz attempts table */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Award className="h-5 w-5 text-indigo-650" />
                    <span>Quiz Analytics & Attempts</span>
                  </h3>
                  <QuizPerformanceTable quizzes={quizzes} />
                </div>

                {/* Coursework assignments table */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-emerald-650" />
                    <span>Assignments Submission Records</span>
                  </h3>
                  <AssignmentTable assignments={assignments} />
                </div>

                {/* Earned certificates table */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Medal className="h-5 w-5 text-violet-600" />
                    <span>Earned Completion Certificates</span>
                  </h3>
                  <CertificateTable certificates={certificates} />
                </div>
              </div>
            </>
          )}
        </DashboardPageContainer>
    </DashboardLayout>
  );
}
