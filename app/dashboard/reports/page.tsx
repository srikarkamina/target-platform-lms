"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  BookOpen, 
  Users, 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HelpCircle,
  Loader2, 
  AlertCircle,
  FileText
} from "lucide-react";
import toast from "react-hot-toast";

interface ManagementReportData {
  role: "ADMIN" | "SUPER_ADMIN" | "FACULTY";
  summary: {
    totalStudents: number;
    totalCourses: number;
    quizAttemptsCount: number;
    submissionCount: number;
    averageQuizPercentage: number;
    quizPassRate: number;
    averageAssignmentGrade: number;
    gradedSubmissionsRate: number;
  };
  quizzes: Array<{
    id: string;
    title: string;
    courseCode: string;
    courseTitle: string;
    attemptsCount: number;
    averagePercentage: number;
    passRate: number;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    courseCode: string;
    courseTitle: string;
    submissionsCount: number;
    gradedCount: number;
    averageGrade: number;
  }>;
}

interface StudentReportData {
  role: "STUDENT";
  summary: {
    enrolledCoursesCount: number;
    quizAttemptsCount: number;
    passedQuizAttemptsCount: number;
    quizPassRate: number;
    averageQuizPercentage: number;
    submissionsCount: number;
    gradedSubmissionsCount: number;
    averageAssignmentGrade: number;
  };
  attempts: Array<{
    id: string;
    quizTitle: string;
    courseCode: string;
    score: number;
    percentage: number;
    passed: boolean;
    submittedAt: string;
  }>;
  submissions: Array<{
    id: string;
    assignmentTitle: string;
    courseCode: string;
    grade: number | null;
    feedback: string | null;
    submittedAt: string;
  }>;
}

export default function ReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<ManagementReportData | StudentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"quizzes" | "assignments">("quizzes");

  const fetchReports = async () => {
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
        setError("Access forbidden: You do not have permissions to access reports.");
        toast.error("Access forbidden.");
      } else {
        setError("Failed to load reports.");
        toast.error("Failed to load analytics.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 space-y-6 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 text-indigo-650 animate-spin mb-3" />
            <p className="text-sm text-slate-550 font-medium animate-pulse">Analyzing academy statistics & metrics...</p>
          </main>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Analytics Error</h3>
            <p className="text-sm text-slate-500 mt-1">{error || "Failed to fetch dashboard reports."}</p>
          </main>
        </div>
      </div>
    );
  }

  const isManagement = data.role !== "STUDENT";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-8">
          {/* Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
                <span>Reports & Analytics</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isManagement 
                  ? "Track overall student performance, assignment metrics, and quiz success statistics"
                  : "Monitor your personal quiz attempts, grade milestones, and assignment progress"}
              </p>
            </div>
          </div>

          {/* RENDER MANAGEMENT VIEW */}
          {isManagement && (
            <>
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Students */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Users className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Enrolled</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-0.5">{(data as ManagementReportData).summary.totalStudents}</h3>
                    <p className="text-[10px] text-slate-450 font-semibold mt-0.5 uppercase tracking-wider font-mono">Active Students</p>
                  </div>
                </div>

                {/* Courses */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <BookOpen className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Courses</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-0.5">{(data as ManagementReportData).summary.totalCourses}</h3>
                    <p className="text-[10px] text-slate-450 font-semibold mt-0.5 uppercase tracking-wider font-mono">Published Curriculum</p>
                  </div>
                </div>

                {/* Quiz attempts */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Award className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quiz Averages</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-0.5">{(data as ManagementReportData).summary.averageQuizPercentage}%</h3>
                    <p className="text-[10px] text-emerald-600 font-extrabold mt-0.5 uppercase tracking-wider font-mono">{(data as ManagementReportData).summary.quizPassRate}% Pass Rate</p>
                  </div>
                </div>

                {/* Assignments */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <ClipboardList className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Grade</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-0.5">{(data as ManagementReportData).summary.averageAssignmentGrade} / 100</h3>
                    <p className="text-[10px] text-indigo-600 font-extrabold mt-0.5 uppercase tracking-wider font-mono">{(data as ManagementReportData).summary.gradedSubmissionsRate}% Graded</p>
                  </div>
                </div>
              </div>

              {/* visual chart section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quiz Scores Visual chart */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Award className="h-5 w-5 text-indigo-650" />
                      <span>Quiz Success Distribution</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Top quizzes mapped by student average percentage scoring</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    {(data as ManagementReportData).quizzes.length === 0 ? (
                      <p className="text-slate-400 italic text-xs py-10 text-center">No quiz data available.</p>
                    ) : (
                      (data as ManagementReportData).quizzes.slice(0, 5).map((q) => (
                        <div key={q.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="truncate max-w-[70%]" title={`${q.courseCode}: ${q.title}`}>{q.courseCode} — {q.title}</span>
                            <span className="font-mono text-indigo-650">{q.averagePercentage}% Avg ({q.attemptsCount} attempts)</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.max(q.averagePercentage, 2)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Assignment Submissions visual metrics */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-600" />
                      <span>Assignment Average Grades</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Top assignment submissions mapped by grading performance</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    {(data as ManagementReportData).assignments.length === 0 ? (
                      <p className="text-slate-400 italic text-xs py-10 text-center">No assignment data available.</p>
                    ) : (
                      (data as ManagementReportData).assignments.slice(0, 5).map((a) => (
                        <div key={a.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="truncate max-w-[70%]" title={`${a.courseCode}: ${a.title}`}>{a.courseCode} — {a.title}</span>
                            <span className="font-mono text-emerald-700">{a.averageGrade} / 100 ({a.submissionsCount} submitted)</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.max(a.averageGrade, 2)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed lists tabs */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* tab selector */}
                <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-3 gap-6">
                  <button
                    onClick={() => setActiveTab("quizzes")}
                    className={`pb-3.5 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
                      activeTab === "quizzes" 
                        ? "border-indigo-650 text-indigo-650 font-extrabold" 
                        : "border-transparent text-slate-450 hover:text-slate-700"
                    }`}
                  >
                    Quizzes Stats ({(data as ManagementReportData).quizzes.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("assignments")}
                    className={`pb-3.5 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
                      activeTab === "assignments" 
                        ? "border-indigo-650 text-indigo-650 font-extrabold" 
                        : "border-transparent text-slate-450 hover:text-slate-700"
                    }`}
                  >
                    Assignments Stats ({(data as ManagementReportData).assignments.length})
                  </button>
                </div>

                {/* table contents */}
                <div className="p-4">
                  {activeTab === "quizzes" ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                          <tr>
                            <th className="px-6 py-3.5">Quiz Title</th>
                            <th className="px-6 py-3.5">Course</th>
                            <th className="px-6 py-3.5 text-center">Attempts</th>
                            <th className="px-6 py-3.5 text-center">Avg Score</th>
                            <th className="px-6 py-3.5 text-right">Pass Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                          {(data as ManagementReportData).quizzes.map((q) => (
                            <tr key={q.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-900">{q.title}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-indigo-650 font-bold">
                                [{q.courseCode}] {q.courseTitle}
                              </td>
                              <td className="px-6 py-4 text-center whitespace-nowrap font-mono">{q.attemptsCount}</td>
                              <td className="px-6 py-4 text-center whitespace-nowrap font-bold text-slate-800">{q.averagePercentage}%</td>
                              <td className="px-6 py-4 text-right whitespace-nowrap">
                                <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold ${
                                  q.passRate >= 70 
                                    ? "bg-emerald-50 text-emerald-700" 
                                    : q.passRate >= 40 
                                      ? "bg-amber-50 text-amber-700" 
                                      : "bg-rose-50 text-rose-700"
                                }`}>
                                  {q.passRate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                          <tr>
                            <th className="px-6 py-3.5">Assignment Title</th>
                            <th className="px-6 py-3.5">Course</th>
                            <th className="px-6 py-3.5 text-center">Submissions</th>
                            <th className="px-6 py-3.5 text-center">Graded</th>
                            <th className="px-6 py-3.5 text-right">Avg Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                          {(data as ManagementReportData).assignments.map((a) => (
                            <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-900">{a.title}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-indigo-650 font-bold">
                                [{a.courseCode}] {a.courseTitle}
                              </td>
                              <td className="px-6 py-4 text-center whitespace-nowrap font-mono">{a.submissionsCount}</td>
                              <td className="px-6 py-4 text-center whitespace-nowrap font-mono">{a.gradedCount}</td>
                              <td className="px-6 py-4 text-right whitespace-nowrap font-bold text-emerald-750">
                                {a.averageGrade > 0 ? `${a.averageGrade} / 100` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* RENDER STUDENT VIEW */}
          {!isManagement && (
            <>
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Enrolled courses count */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <BookOpen className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enrolled Courses</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-0.5">{(data as StudentReportData).summary.enrolledCoursesCount}</h3>
                    <p className="text-[10px] text-slate-450 font-semibold mt-0.5 uppercase tracking-wider font-mono">Academic Enrollment</p>
                  </div>
                </div>

                {/* Quiz average score */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Award className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quiz Performance</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-0.5">{(data as StudentReportData).summary.averageQuizPercentage}%</h3>
                    <p className="text-[10px] text-emerald-600 font-extrabold mt-0.5 uppercase tracking-wider font-mono">{(data as StudentReportData).summary.quizPassRate}% Success Rate</p>
                  </div>
                </div>

                {/* Submissions count */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <ClipboardList className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submissions</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-0.5">{(data as StudentReportData).summary.submissionsCount}</h3>
                    <p className="text-[10px] text-slate-450 font-semibold mt-0.5 uppercase tracking-wider font-mono">Coursework Uploaded</p>
                  </div>
                </div>

                {/* Average graded score */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <TrendingUp className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assignment Avg</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-0.5">{(data as StudentReportData).summary.averageAssignmentGrade} <span className="text-sm font-bold text-slate-450">/ 100</span></h3>
                    <p className="text-[10px] text-indigo-650 font-semibold mt-0.5 uppercase tracking-wider font-mono">{(data as StudentReportData).summary.gradedSubmissionsCount} Grades Assigned</p>
                  </div>
                </div>
              </div>

              {/* circular gauges and visual charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SVG circular progress ring for Quiz Pass Rate */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-full text-left">
                    <h3 className="text-base font-bold text-slate-800">Quiz Completion Standings</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Success metrics based on passing marks</p>
                  </div>

                  <div className="relative flex items-center justify-center h-48 w-48">
                    {/* SVG Circle Gauge */}
                    <svg className="w-36 h-36 transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        className="text-slate-100"
                        strokeWidth="12"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        className="text-indigo-600 transition-all duration-1000 ease-out"
                        strokeWidth="12"
                        strokeDasharray={2 * Math.PI * 60}
                        strokeDashoffset={2 * Math.PI * 60 * (1 - (data as StudentReportData).summary.quizPassRate / 100)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <p className="text-3xl font-black text-indigo-950">{(data as StudentReportData).summary.quizPassRate}%</p>
                      <p className="text-[10px] text-slate-450 font-mono uppercase tracking-wider font-bold mt-0.5">Pass Rate</p>
                    </div>
                  </div>

                  <div className="flex gap-6 text-xs font-bold uppercase font-mono tracking-wider text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>{(data as StudentReportData).summary.passedQuizAttemptsCount} Passed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <XCircle className="h-4 w-4 text-rose-500" />
                      <span>{(data as StudentReportData).summary.quizAttemptsCount - (data as StudentReportData).summary.passedQuizAttemptsCount} Failed</span>
                    </div>
                  </div>
                </div>

                {/* SVG circular progress ring for Assignment grading */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-full text-left">
                    <h3 className="text-base font-bold text-slate-800">Assignment Grade Average</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Your overall graded performance summary</p>
                  </div>

                  <div className="relative flex items-center justify-center h-48 w-48">
                    {/* SVG Circle Gauge */}
                    <svg className="w-36 h-36 transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        className="text-slate-100"
                        strokeWidth="12"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="60"
                        className="text-emerald-500 transition-all duration-1000 ease-out"
                        strokeWidth="12"
                        strokeDasharray={2 * Math.PI * 60}
                        strokeDashoffset={2 * Math.PI * 60 * (1 - (data as StudentReportData).summary.averageAssignmentGrade / 100)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <p className="text-3xl font-black text-emerald-950">{(data as StudentReportData).summary.averageAssignmentGrade}%</p>
                      <p className="text-[10px] text-slate-450 font-mono uppercase tracking-wider font-bold mt-0.5">Avg Grade</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 font-medium">
                    Grading calculated across <span className="font-extrabold text-slate-800">{(data as StudentReportData).summary.gradedSubmissionsCount}</span> evaluations.
                  </div>
                </div>
              </div>

              {/* Lists of student attempts & submissions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Completed quiz attempts list */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                    <Award className="h-5 w-5 text-indigo-650" />
                    <span>Completed Quiz History</span>
                  </h3>

                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                    {(data as StudentReportData).attempts.length === 0 ? (
                      <p className="text-slate-400 italic text-xs py-10 text-center">No completed quiz attempts found.</p>
                    ) : (
                      (data as StudentReportData).attempts.map((a) => (
                        <div key={a.id} className="py-3.5 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate text-xs">{a.quizTitle}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                              <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-1 rounded">{a.courseCode}</span>
                              <span>{new Date(a.submittedAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              a.passed 
                                ? "bg-emerald-50 text-emerald-700" 
                                : "bg-rose-50 text-rose-700"
                            }`}>
                              {a.passed ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                              <span>{a.percentage}%</span>
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{a.score} marks</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Submitted assignments list */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    <span>Assignment Grading Records</span>
                  </h3>

                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                    {(data as StudentReportData).submissions.length === 0 ? (
                      <p className="text-slate-400 italic text-xs py-10 text-center">No submissions found.</p>
                    ) : (
                      (data as StudentReportData).submissions.map((s) => (
                        <div key={s.id} className="py-3.5 flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate text-xs">{s.assignmentTitle}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                              <span className="font-bold text-indigo-650 bg-indigo-50 border border-indigo-100/50 px-1 rounded">{s.courseCode}</span>
                              <span>{new Date(s.submittedAt).toLocaleDateString()}</span>
                            </div>
                            {s.feedback && (
                              <p className="text-[10px] text-slate-450 italic mt-1 bg-slate-50 border border-slate-100 p-2 rounded-lg truncate" title={s.feedback}>
                                Feedback: "{s.feedback}"
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            {s.grade !== null ? (
                              <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                {s.grade} / 100
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                Pending Review
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
