"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import { Award, Clock, BookOpen, Search, Play, ArrowRight, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
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
  timeLimit: number;
  passingMarks: number;
  totalMarks: number;
  course: Course;
  questionCount: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  attemptId: string | null;
  score: number | null;
  percentage: number | null;
  passed: boolean | null;
}

export default function StudentQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setAuthError(null);
      const res = await api.get("/student/quizzes");
      setQuizzes(res.data);
      
      // Extract unique courses for filtering
      const uniqueCourses: Course[] = [];
      res.data.forEach((q: Quiz) => {
        if (!uniqueCourses.some((c) => c.id === q.course.id)) {
          uniqueCourses.push(q.course);
        }
      });
      setCourses(uniqueCourses);
    } catch (err: any) {
      console.error("fetchQuizzes error:", err);
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
        toast.error("Failed to load your quizzes.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      fetchQuizzes();
    }
  }, []);

  const handleStartQuiz = async (quizId: string) => {
    try {
      setActionLoading(quizId);
      const res = await api.post("/quiz-attempts/start", { quizId });
      const { attemptId } = res.data;
      toast.success("Quiz started! Good luck.");
      router.push(`/dashboard/student/quizzes/${attemptId}`);
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.message || "Failed to start quiz.";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter quizzes locally
  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourseId === "" || quiz.course.id === selectedCourseId;
    const matchesStatus = statusFilter === "" || quiz.status === statusFilter;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  return (
    <DashboardLayout>
      <DashboardPageContainer>
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <Award className="h-8 w-8 text-indigo-600" />
                <span>My Quizzes</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                View your available course quizzes, resume active attempts, and check completed grades
              </p>
            </div>
            <button
              onClick={fetchQuizzes}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors cursor-pointer self-start md:self-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filters Dashboard */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search quiz by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full sm:w-48 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.courseCode} - {course.title}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-48 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="">All Statuses</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* List display */}
          {authError ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
              <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
              <h3 className="text-base font-semibold text-rose-800">{authError}</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                Please make sure you are logged in with a valid Student account.
              </p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <Award className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-sm text-slate-500 font-medium">Loading your quizzes...</p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="text-center p-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <Award className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No quizzes found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedCourseId || statusFilter
                  ? "Try resetting your search query or dropdown filters."
                  : "You do not have any published quizzes assigned to your enrolled courses."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Quiz details</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Course</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Questions</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Duration</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Passing Marks</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Status & Grade</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredQuizzes.map((quiz) => (
                      <tr key={quiz.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 max-w-xs">
                          <p className="font-semibold text-slate-900 leading-tight">{quiz.title}</p>
                          {quiz.description && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate">{quiz.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg">
                            <BookOpen className="h-3 w-3" />
                            <span>{quiz.course.courseCode}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-600">
                          {quiz.questionCount} {quiz.questionCount === 1 ? "Question" : "Questions"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{quiz.timeLimit} mins</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          <span className="font-semibold text-slate-900">{quiz.passingMarks}</span>
                          <span className="text-slate-400"> / {quiz.totalMarks}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {quiz.status === "NOT_STARTED" && (
                              <span className="inline-flex items-center rounded-lg bg-slate-200 px-2.5 py-1 text-xs font-bold tracking-wide text-slate-700">
                                Not Started
                              </span>
                            )}
                            {quiz.status === "IN_PROGRESS" && (
                              <span className="inline-flex items-center rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-bold tracking-wide text-indigo-700">
                                In Progress
                              </span>
                            )}
                            {quiz.status === "COMPLETED" && (
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold tracking-wide ${
                                  quiz.passed
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}>
                                  {quiz.passed ? "Passed" : "Failed"}
                                </span>
                                <p className="text-[11px] font-medium text-slate-400">
                                  Score: <span className="font-bold text-slate-600">{quiz.score}</span> ({quiz.percentage}%)
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {quiz.status === "NOT_STARTED" && (
                            <button
                              onClick={() => handleStartQuiz(quiz.id)}
                              disabled={actionLoading !== null}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 px-4 py-2 text-xs font-bold text-white shadow transition-all cursor-pointer"
                            >
                              <Play className="h-3 w-3 fill-white" />
                              <span>{actionLoading === quiz.id ? "Starting..." : "Start Quiz"}</span>
                            </button>
                          )}
                          {quiz.status === "IN_PROGRESS" && (
                            <Link
                              href={`/dashboard/student/quizzes/${quiz.attemptId}`}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow transition-all"
                            >
                              <ArrowRight className="h-3.5 w-3.5 text-white" />
                              <span>Resume Quiz</span>
                            </Link>
                          )}
                          {quiz.status === "COMPLETED" && (
                            <Link
                              href={`/dashboard/student/quizzes/${quiz.attemptId}/result`}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow transition-all"
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-white" />
                              <span>View Result</span>
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DashboardPageContainer>
    </DashboardLayout>
  );
}
