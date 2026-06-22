"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { 
  ClipboardList, 
  Search, 
  Filter, 
  User, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Loader2, 
  GraduationCap, 
  FileText,
  AlertTriangle 
} from "lucide-react";

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
  student: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface Course {
  id: string;
  title: string;
  courseCode: string;
}

interface Assignment {
  id: string;
  title: string;
}

export default function SubmissionsDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("STUDENT");

  // Search & Filtering
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Grading Modal States
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  // Parse JWT
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
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.role) {
        setTimeout(() => {
          setUserRole(payload.role);
        }, 0);
      }
    }
  }, []);

  const isManagementRole = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "FACULTY";

  const fetchData = async () => {
    try {
      setLoading(true);
      const [submissionsRes, coursesRes, assignmentsRes] = await Promise.all([
        api.get("/submissions"),
        api.get("/courses"),
        api.get("/assignments"),
      ]);
      setSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data : []);
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
    } catch (err) {
      console.error("Failed to load submissions:", err);
      toast.error("Failed to load submission data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManagementRole) {
      setTimeout(() => {
        fetchData();
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

  // Statistics Calculation
  const totalAssignments = assignments.length;
  const totalSubmissions = submissions.length;
  const pendingSubmissions = submissions.filter((s) => s.grade === null).length;
  const gradedSubmissions = submissions.filter((s) => s.grade !== null).length;

  // Course title lookup helper
  const getCourseTitle = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? `[${course.courseCode}] ${course.title}` : "Unknown Course";
  };

  // Filter Submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch = 
      sub.student.name.toLowerCase().includes(search.toLowerCase()) ||
      sub.assignment.title.toLowerCase().includes(search.toLowerCase());

    const matchesCourse = 
      courseFilter === "all" || sub.assignment.courseId === courseFilter;

    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "pending" && sub.grade === null) ||
      (statusFilter === "graded" && sub.grade !== null);

    return matchesSearch && matchesCourse && matchesStatus;
  });

  const handleOpenGradeModal = (sub: Submission) => {
    setSelectedSubmission(sub);
    setGradeInput(sub.grade !== null ? String(sub.grade) : "");
    setFeedbackInput(sub.feedback || "");
    setIsGradeOpen(true);
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    const parsedGrade = parseInt(gradeInput, 10);
    if (isNaN(parsedGrade) || parsedGrade < 0 || parsedGrade > 100) {
      toast.error("Grade must be a whole number between 0 and 100.");
      return;
    }

    try {
      setSavingGrade(true);
      await api.put(`/submissions/${selectedSubmission.id}`, {
        grade: parsedGrade,
        feedback: feedbackInput.trim() || null,
      });
      toast.success("Grade and feedback saved successfully!");
      setIsGradeOpen(false);
      setSelectedSubmission(null);
      fetchData();
    } catch (err) {
      console.error("Failed to save grade and feedback:", err);
      toast.error("Failed to save grade and feedback.");
    } finally {
      setSavingGrade(false);
    }
  };

  // Student Access Denied View
  if (!loading && !isManagementRole) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 flex flex-col items-center justify-center font-sans">
            <AlertTriangle className="h-12 w-12 text-rose-500 mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Access Denied</h3>
            <p className="text-sm text-slate-550 mt-1 max-w-sm text-center leading-relaxed">
              This dashboard is only accessible to faculty and administrators. Students can view coursework and upload assignments directly via the assignments tab inside their courses.
            </p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6 font-sans">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
                <ClipboardList className="h-8 w-8 text-indigo-650" />
                <span>Submissions & Grading</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Review submitted files, set grading assessments, and track coursework statistics
              </p>
            </div>
          </div>

          {/* Stats Section */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-24 bg-slate-200 rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Stat 1: Total Assignments */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assignments</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalAssignments}</h3>
                </div>
              </div>

              {/* Stat 2: Total Submissions */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submissions</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalSubmissions}</h3>
                </div>
              </div>

              {/* Stat 3: Pending */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Grade</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{pendingSubmissions}</h3>
                </div>
              </div>

              {/* Stat 4: Graded */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Graded</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-0.5">{gradedSubmissions}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student or assignment..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap w-full md:w-auto items-center gap-4">
              {/* Course Selector Filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <GraduationCap className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.courseCode}] {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Selector Filter */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white p-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Grade</option>
                  <option value="graded">Graded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submissions Table / Listing */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center animate-pulse">
              <Loader2 className="h-8 w-8 text-slate-300 animate-spin mb-2" />
              <p className="text-sm text-slate-500">Loading student submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center p-12 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No submissions found</h3>
              <p className="text-sm text-slate-550 mt-1 max-w-sm mx-auto">
                No submissions match the current search filters or coursework requirements.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-650">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                    <tr>
                      <th scope="col" className="px-6 py-4">Student</th>
                      <th scope="col" className="px-6 py-4">Assignment</th>
                      <th scope="col" className="px-6 py-4">Course</th>
                      <th scope="col" className="px-6 py-4">Submitted Date</th>
                      <th scope="col" className="px-6 py-4">Grade</th>
                      <th scope="col" className="px-6 py-4">Status</th>
                      <th scope="col" className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 bg-white font-medium text-slate-700">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-500">
                              <User className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="font-bold text-slate-800">{sub.student.name}</p>
                              <p className="text-xs text-slate-400 font-normal">{sub.student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate font-bold text-slate-800">
                          {sub.assignment.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-indigo-650 font-bold">
                          {getCourseTitle(sub.assignment.courseId)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-extrabold text-base">
                          {sub.grade !== null ? (
                            <span className="text-emerald-700">{sub.grade} / 100</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {sub.grade !== null ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-250">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              Graded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-220">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleOpenGradeModal(sub)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
                          >
                            <span>View & Grade</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW & GRADE MODAL */}
          {isGradeOpen && selectedSubmission && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-lg text-slate-800">Grade Assignment</h3>
                  <button
                    onClick={() => {
                      setIsGradeOpen(false);
                      setSelectedSubmission(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
                  >
                    &times;
                  </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSaveGrade}>
                  <div className="p-6 space-y-4 text-sm">
                    {/* Course / Assignment info */}
                    <div className="space-y-1">
                      <p className="text-slate-400 uppercase tracking-widest text-[10px] font-extrabold font-mono">
                        {getCourseTitle(selectedSubmission.assignment.courseId)}
                      </p>
                      <h4 className="font-bold text-slate-800 text-base">
                        {selectedSubmission.assignment.title}
                      </h4>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Student details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-xs font-bold">Student Name</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{selectedSubmission.student.name}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs font-bold">Submitted Date</p>
                        <p className="font-semibold text-slate-800 mt-0.5">
                          {new Date(selectedSubmission.submittedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* File Attachment URL */}
                    <div>
                      <p className="text-slate-400 text-xs font-bold mb-1">Attached Work</p>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-slate-700">
                          <FileText className="h-5 w-5 text-indigo-650 shrink-0" />
                          <span className="font-semibold truncate flex-1" title={selectedSubmission.fileName || "Submitted File"}>
                            {selectedSubmission.fileName || "Submitted File"}
                          </span>
                        </div>
                        {selectedSubmission.fileSize && (
                          <p className="text-[10px] text-slate-450 font-mono">
                            Size: {(selectedSubmission.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        )}
                        <a
                          href={selectedSubmission.fileUrl || "#"}
                          download={selectedSubmission.fileName || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
                        >
                          <span>Download File</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Grade input */}
                    <div>
                      <label className="block text-slate-650 font-bold text-xs uppercase tracking-wider mb-1">
                        Assign Grade (0 - 100) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                        placeholder="e.g. 95"
                        className="w-full rounded-xl border border-slate-300 p-3 shadow-xs text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        required
                        disabled={savingGrade}
                      />
                    </div>

                    {/* Feedback input */}
                    <div>
                      <label className="block text-slate-650 font-bold text-xs uppercase tracking-wider mb-1">
                        Faculty Feedback
                      </label>
                      <textarea
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="Enter student feedback here..."
                        rows={4}
                        className="w-full rounded-xl border border-slate-300 p-3 shadow-xs text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        disabled={savingGrade}
                      />
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsGradeOpen(false);
                        setSelectedSubmission(null);
                      }}
                      disabled={savingGrade}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingGrade}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-extrabold text-white shadow transition-colors cursor-pointer disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-1.5 justify-center"
                    >
                      {savingGrade && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                      <span>Save Grade</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
