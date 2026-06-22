"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Plus, Search, Filter, Edit, Trash2, HelpCircle, Award, AlertTriangle, Calendar, Clock, BookOpen, Layers } from "lucide-react";
import toast from "react-hot-toast";

interface Course {
  id: string;
  title: string;
  courseCode: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  timeLimit: number;
  passingMarks: number;
  totalMarks: number;
  isPublished: boolean;
  createdAt: string;
  course: {
    id: string;
    title: string;
    courseCode: string;
  };
  _count?: {
    questions: number;
  };
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [publishedFilter, setPublishedFilter] = useState(""); // "", "true", "false"

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Delete modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (selectedCourseId) {
        params.append("courseId", selectedCourseId);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      if (publishedFilter !== "") {
        params.append("isPublished", publishedFilter);
      }

      const res = await api.get(`/quizzes?${params.toString()}`);
      setQuizzes(res.data.quizzes || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load quizzes.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedCourseId, searchQuery, publishedFilter]);

  // Load courses for filtering
  useEffect(() => {
    let active = true;
    const fetchCoursesList = async () => {
      try {
        const res = await api.get("/courses");
        if (active) {
          setCourses(res.data);
        }
      } catch (err) {
        console.error("Failed to load courses for filter:", err);
      }
    };
    fetchCoursesList();
    return () => {
      active = false;
    };
  }, []);

  // Fetch quizzes with debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchQuizzes();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCourseId, publishedFilter, page, fetchQuizzes]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCourseId, publishedFilter]);

  const handleDeleteClick = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuiz) return;
    try {
      setDeleting(true);
      await api.delete(`/quizzes/${selectedQuiz.id}`);
      toast.success("Quiz deleted successfully!");
      setIsDeleteOpen(false);
      setSelectedQuiz(null);
      fetchQuizzes();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete quiz.");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <Award className="h-8 w-8 text-indigo-600" />
                <span>Quizzes</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Configure curriculum assessments, structure exam questions, and monitor scoring thresholds
              </p>
            </div>

            <Link
              href="/dashboard/quizzes/create"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Create Quiz</span>
            </Link>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                placeholder="Search quizzes by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Course Filter Dropdown */}
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Filter className="h-4 w-4" />
                </span>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="">All Courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      [{course.courseCode}] {course.title}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <span className="text-[10px]">▼</span>
                </div>
              </div>

              {/* Status Filter Dropdown */}
              <div className="relative w-full sm:w-48">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Layers className="h-4 w-4" />
                </span>
                <select
                  value={publishedFilter}
                  onChange={(e) => setPublishedFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50/50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="true">Published</option>
                  <option value="false">Draft</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <span className="text-[10px]">▼</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quizzes List Table */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-pulse">
              <div className="h-12 bg-slate-50 border-b border-slate-200"></div>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-16 border-b border-slate-100 flex items-center px-6 justify-between">
                  <div className="h-4 w-40 bg-slate-200 rounded"></div>
                  <div className="h-4 w-28 bg-slate-200 rounded"></div>
                  <div className="h-4 w-12 bg-slate-200 rounded"></div>
                  <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            /* Empty State */
            <div className="text-center p-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <HelpCircle className="mx-auto h-14 w-14 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No quizzes found</h3>
              <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
                Create your first curriculum assessment, or adjust filters to explore matching quizzes.
              </p>
              <div className="pt-5">
                <Link
                  href="/dashboard/quizzes/create"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Quiz</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Table Grid */
            <div className="overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th scope="col" className="px-6 py-4">Quiz details</th>
                      <th scope="col" className="px-6 py-4">Course</th>
                      <th scope="col" className="px-6 py-4">Total Questions</th>
                      <th scope="col" className="px-6 py-4">Time Limit</th>
                      <th scope="col" className="px-6 py-4">Passing Marks</th>
                      <th scope="col" className="px-6 py-4">Status</th>
                      <th scope="col" className="px-6 py-4">Created Date</th>
                      <th scope="col" className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {quizzes.map((quiz) => (
                      <tr key={quiz.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4 max-w-xs">
                          <div>
                            <p className="font-semibold text-slate-800 truncate">{quiz.title}</p>
                            {quiz.description && (
                              <p className="text-xs font-normal text-slate-400 truncate mt-0.5 max-w-[200px]">
                                {quiz.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                            {quiz.course?.courseCode || "N/A"}
                          </span>
                          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[120px]">
                            {quiz.course?.title}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-600">
                          {quiz._count?.questions ?? 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{quiz.timeLimit} mins</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded px-2 py-0.5 font-mono">
                            {quiz.passingMarks} / {quiz.totalMarks}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {quiz.isPublished ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                              Draft
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{formatDate(quiz.createdAt)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/quizzes/${quiz.id}/edit`}
                              className="p-2 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 transition-colors"
                              title="Edit Quiz"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(quiz)}
                              className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Quiz"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
                <div className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{((page - 1) * limit) + 1}</span> to{" "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(page * limit, total)}
                  </span>{" "}
                  of <span className="font-semibold text-slate-700">{total}</span> quizzes
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 hover:bg-slate-55 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 hover:bg-slate-55 transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      {isDeleteOpen && selectedQuiz && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-slate-800">Delete Quiz</h3>
                <p className="text-sm text-slate-500 px-2">
                  Are you sure you want to delete <span className="font-semibold text-slate-800">&quot;{selectedQuiz.title}&quot;</span>? This will soft-delete the quiz and prevent further student attempts.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsDeleteOpen(false);
                    setSelectedQuiz(null);
                  }}
                  disabled={deleting}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-extrabold text-white shadow hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-500 transition-colors cursor-pointer"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
