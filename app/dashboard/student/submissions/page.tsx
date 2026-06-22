"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { 
  ClipboardList, 
  Search, 
  Filter, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  FileText,
  MessageSquare
} from "lucide-react";
import toast from "react-hot-toast";

interface Course {
  id: string;
  title: string;
  courseCode: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  submittedAt: string;
  grade: number | null;
  feedback: string | null;
  assignment: {
    id: string;
    title: string;
    courseId: string;
  };
}

export default function StudentSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Search & Filtering
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setAuthError(null);

      // Fetch student submissions (backend secures this, returning only current student's)
      const submissionsRes = await api.get("/submissions");
      // Fetch courses for filter dropdown
      const coursesRes = await api.get("/courses");

      setSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data : []);
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
    } catch (err: any) {
      console.error("Failed to load student submissions:", err);
      const status = err.response?.status;
      if (status === 401) {
        localStorage.removeItem("token");
        setAuthError("Session expired. Redirecting to login...");
        toast.error("Session expired. Please log in again.");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else if (status === 403) {
        setAuthError("Access forbidden: Student role required.");
        toast.error("Access forbidden: Student role required.");
      } else {
        toast.error("Failed to load submissions.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCourseCode = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.courseCode : "COURSE";
  };

  const getCourseTitle = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.title : "Unknown Course";
  };

  // Filter local data
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch = 
      sub.assignment.title.toLowerCase().includes(search.toLowerCase());

    const matchesCourse = 
      courseFilter === "all" || sub.assignment.courseId === courseFilter;

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "pending" && sub.grade === null) ||
      (statusFilter === "graded" && sub.grade !== null);

    return matchesSearch && matchesCourse && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
                <ClipboardList className="h-8 w-8 text-indigo-600" />
                <span>My Submissions</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                View your submitted assignments, grades, and faculty feedback details
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by assignment title..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap w-full md:w-auto items-center gap-4">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full sm:w-48 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-slate-700"
                >
                  <option value="all">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.courseCode}] {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-48 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Grade</option>
                  <option value="graded">Graded</option>
                </select>
              </div>
            </div>
          </div>

          {/* List display */}
          {authError ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
              <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
              <h3 className="text-base font-semibold text-rose-800">{authError}</h3>
              <p className="text-sm text-slate-550 mt-1">Please log in to your student dashboard.</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-sm text-slate-500 font-medium">Loading your submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center p-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No submissions found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {search || courseFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your search query or dropdown filters."
                  : "You haven't submitted any coursework assignments yet."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Assignment</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Course</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Submitted Date</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Grade</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Status</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Feedback</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {sub.assignment.title}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg">
                            <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                            <span>{getCourseCode(sub.assignment.courseId)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-sm">
                          {sub.grade !== null ? (
                            <span className="text-emerald-700">{sub.grade} / 100</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {sub.grade !== null ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-250">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              Graded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                              Submitted
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate">
                          {sub.feedback ? (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                              <MessageSquare className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              <span className="truncate">{sub.feedback}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">No feedback</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/student/submissions/${sub.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            <span>View Details</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
