"use client";

import React, { useEffect, useState } from "react";
import { ClipboardList, BookOpen, UserCheck, AlertCircle, RefreshCw, ClipboardCheck, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import DeadlineCard from "./DeadlineCard";
import PerformanceCard from "./PerformanceCard";

interface CourseAnalytic {
  id: string;
  title: string;
  courseCode: string;
  studentCount: number;
  assignmentProgress: number;
  quizProgress: number;
  averageMarks: number;
}

interface SubmissionItem {
  id: string;
  submittedAt: string;
  grade: number | null;
  student: { name: string; email: string };
  assignment: { id: string; title: string; course: { title: string } };
}

interface FacultyData {
  pendingGrading: SubmissionItem[];
  upcomingAssignments: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    course: { title: string };
  }>;
  recentSubmissions: SubmissionItem[];
  courseAnalytics: CourseAnalytic[];
  studentPerformance: {
    topPerformers: Array<{
      id: string;
      name: string;
      email: string;
      avgQuizScore: number;
      submissionRate: number;
      performanceScore: number;
    }>;
    needingAttention: Array<{
      id: string;
      name: string;
      email: string;
      avgQuizScore: number;
      submissionRate: number;
      performanceScore: number;
    }>;
  };
}

export default function FacultyDashboard() {
  const [data, setData] = useState<FacultyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/dashboard/faculty");
      setData(res.data);
    } catch (err: any) {
      console.error("Failed to load faculty dashboard:", err);
      setError("Failed to fetch dashboard metrics. Verify you are logged in as a faculty instructor.");
      toast.error("Failed to load faculty analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-sm text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
        <h3 className="text-base font-bold text-rose-800 dark:text-rose-455">{error}</h3>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-slate-900 dark:bg-slate-950 p-6 rounded-3xl border border-slate-850 shadow-lg text-white text-left">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-650 text-white">
            <span className="text-xl">🍎</span>
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Faculty Hub
            </h1>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed max-w-lg">
              Manage your courses, track student performance, review recent file uploads, and complete gradings.
            </p>
          </div>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Panel</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pending Grading List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2 mb-6">
              <ClipboardCheck className="h-5 w-5 text-rose-500 animate-pulse" />
              <span>Pending Grading List</span>
            </h3>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="h-10 bg-slate-50 dark:bg-slate-800 rounded-xl"></div>
                ))}
              </div>
            ) : data?.pendingGrading.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400 dark:text-slate-500 italic text-xs">
                No submissions waiting for grading! Good job.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="pb-3 font-bold text-slate-400 uppercase tracking-wider">Student</th>
                      <th className="pb-3 font-bold text-slate-400 uppercase tracking-wider">Assignment</th>
                      <th className="pb-3 font-bold text-slate-400 uppercase tracking-wider">Date Submitted</th>
                      <th className="pb-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.pendingGrading.map((sub) => (
                      <tr key={sub.id} className="border-b border-slate-100/50 dark:border-slate-850/50 hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-bold text-slate-800 dark:text-slate-150">{sub.student.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-0.5">{sub.student.email}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">{sub.assignment.title}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{sub.assignment.course.title}</p>
                        </td>
                        <td className="py-3 text-slate-500 dark:text-slate-450 font-medium">
                          {new Date(sub.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3 text-right">
                          <a
                            href={`/dashboard/submissions?id=${sub.id}`}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold text-indigo-650 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                          >
                            <span>Grade</span>
                            <ArrowRight className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Courses List & Analytics */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2 mb-6">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <span>Assigned Courses Analytics</span>
            </h3>
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(2)].map((_, idx) => (
                  <div key={idx} className="h-12 bg-slate-55 dark:bg-slate-850 rounded-xl"></div>
                ))}
              </div>
            ) : data?.courseAnalytics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400 dark:text-slate-500 italic text-xs">
                You are not currently assigned to teach any active courses.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-150 dark:border-slate-800">
                      <th className="pb-3 font-bold text-slate-400 uppercase tracking-wider">Course</th>
                      <th className="pb-3 font-bold text-slate-400 uppercase tracking-wider">Students</th>
                      <th className="pb-3 font-bold text-slate-400 uppercase tracking-wider">Assignments Progress</th>
                      <th className="pb-3 font-bold text-slate-400 uppercase tracking-wider">Quizzes Progress</th>
                      <th className="pb-3 font-bold text-slate-400 uppercase tracking-wider">Avg Quiz Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.courseAnalytics.map((course) => (
                      <tr key={course.id} className="border-b border-slate-100/50 dark:border-slate-850/50 hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors">
                        <td className="py-4 pr-4">
                          <p className="font-extrabold text-slate-800 dark:text-slate-200 leading-snug">{course.title}</p>
                          <span className="inline-flex text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 px-2 py-0.5 rounded-md mt-1">
                            {course.courseCode}
                          </span>
                        </td>
                        <td className="py-4 font-semibold text-slate-700 dark:text-slate-350">{course.studentCount} students</td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-indigo-650 h-1.5 rounded-full" style={{ width: `${course.assignmentProgress}%` }}></div>
                            </div>
                            <span className="font-extrabold text-[10px] text-slate-600 dark:text-slate-400">{course.assignmentProgress}%</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${course.quizProgress}%` }}></div>
                            </div>
                            <span className="font-extrabold text-[10px] text-slate-600 dark:text-slate-400">{course.quizProgress}%</span>
                          </div>
                        </td>
                        <td className="py-4 font-extrabold text-slate-800 dark:text-slate-150">
                          {course.averageMarks}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column */}
        <div className="lg:col-span-1 space-y-8">
          {/* Upcoming Assignment Deadlines */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2 mb-6">
              <ClipboardList className="h-5 w-5 text-indigo-650" />
              <span>Upcoming Assignment Tasks</span>
            </h3>
            <DeadlineCard deadlines={data?.upcomingAssignments ?? []} loading={loading} />
          </div>

          {/* Student Standing Reports */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2 mb-6">
              <UserCheck className="h-5 w-5 text-emerald-605" />
              <span>Student Standing</span>
            </h3>
            <PerformanceCard
              topPerformers={data?.studentPerformance.topPerformers ?? []}
              needingAttention={data?.studentPerformance.needingAttention ?? []}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
