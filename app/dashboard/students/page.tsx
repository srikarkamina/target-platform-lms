"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import { User, Users, Mail, Edit2, Trash2, Search, X, CheckSquare, Square, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Course {
  id: string;
  title: string;
  courseCode: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Course states
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Faculty specific states
  const [role, setRole] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const base64Url = token.split(".")[1];
      if (base64Url) {
        try {
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            window.atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const payload = JSON.parse(jsonPayload);
          setRole(payload.role || "STUDENT");
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const fetchCourseReport = async (courseId: string) => {
    if (!courseId) return;
    try {
      setReportLoading(true);
      const res = await api.get(`/reports/course/${courseId}`);
      setReportData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load student progress for this course.");
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (role === "FACULTY" && selectedCourseId) {
      fetchCourseReport(selectedCourseId);
    }
  }, [selectedCourseId, role]);

  const fetchStudents = async () => {
    try {
      const res = await api.get("/students");
      setStudents(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load students.");
    }
  };

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const res = await api.get("/courses");
      setCourses(res.data);
      if (res.data.length > 0) {
        setSelectedCourseId(res.data[0].id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load courses.");
    } finally {
      setCoursesLoading(false);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsDropdownOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % Math.max(1, filteredCourses.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + filteredCourses.length) % Math.max(1, filteredCourses.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredCourses.length) {
        const targetCourse = filteredCourses[focusedIndex];
        toggleCourseSelection(targetCourse.id);
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
      setFocusedIndex(-1);
    }
  };

  const addOrUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (selectedCourseIds.length === 0) {
      toast.error("Please select at least one course.");
      return;
    }
    try {
      setLoading(true);
      if (editingId) {
        const res = await api.put(`/students/${editingId}`, {
          name,
          email,
          courseIds: selectedCourseIds,
        });
        toast.success(res.data.message || "Student details and enrollments updated successfully.");
        setEditingId(null);
      } else {
        const res = await api.post("/students", {
          name,
          email,
          courseIds: selectedCourseIds,
        });
        toast.success(res.data.message || `Student created successfully and enrolled in ${selectedCourseIds.length} courses.`);
      }
      setName("");
      setEmail("");
      setSelectedCourseIds([]);
      setSearchQuery("");
      setIsDropdownOpen(false);
      fetchStudents();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this student?");
    if (!confirmed) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success("Student deleted successfully.");
      fetchStudents();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete student.");
    }
  };

  const editStudent = async (student: Student) => {
    setEditingId(student.id);
    setName(student.name);
    setEmail(student.email);
    setSelectedCourseIds([]);
    setSearchQuery("");
    setIsDropdownOpen(false);
    try {
      const res = await api.get(`/students/${student.id}/courses`);
      setSelectedCourseIds(res.data.map((c: any) => c.id));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load student's current enrollments.");
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      course.title.toLowerCase().includes(query) ||
      course.courseCode.toLowerCase().includes(query)
    );
  });

  if (role === "FACULTY") {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 dark:bg-slate-950 p-6 rounded-3xl border border-slate-850 shadow-sm text-left mb-6">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-650 text-white">
                <User className="h-6 w-6 text-white" />
              </span>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white">
                  Student Progress & Performance
                </h1>
                <p className="text-xs text-slate-205 mt-1">
                  View students enrolled in your assigned courses and monitor their quiz, assignment, and lecture progress.
                </p>
              </div>
            </div>

            {/* Course Selector Dropdown */}
            {courses.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase whitespace-nowrap">Select Course:</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-hidden"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} - {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {courses.length === 0 ? (
            <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-sm text-slate-500">No courses assigned to you yet.</p>
            </div>
          ) : reportLoading ? (
            <div className="flex flex-col items-center justify-center p-32">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-semibold">
                Loading student progress details...
              </p>
            </div>
          ) : !reportData ? (
            <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-sm text-slate-500">Failed to load reports for the selected course.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Course Stats Summary Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl text-left">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Students</span>
                  <span className="text-2xl font-extrabold text-slate-850 dark:text-slate-100 block mt-1">
                    {reportData.stats.totalStudents}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl text-left">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Avg Progress</span>
                  <span className="text-2xl font-extrabold text-indigo-650 block mt-1">
                    {reportData.stats.averageProgress}%
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl text-left">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Avg Quiz Score</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-450 block mt-1">
                    {reportData.stats.quizAverage}%
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl text-left">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Certificates</span>
                  <span className="text-2xl font-extrabold text-amber-600 block mt-1">
                    {reportData.stats.certificatesCount}
                  </span>
                </div>
              </div>

              {/* Students Progress Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-150 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100">Enrolled Students ({reportData.students.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm text-slate-650 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500">Student Info</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500">Course Progress</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500 text-center">Quizzes</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500 text-center">Avg Quiz Score</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500 text-center">Assignments</th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500 text-right">Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {reportData.students.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">
                            No students enrolled in this course.
                          </td>
                        </tr>
                      ) : (
                        reportData.students.map((student: any) => (
                          <tr key={student.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-850 dark:text-slate-100">{student.studentName}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{student.studentEmail}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                  <div
                                    className="bg-indigo-650 h-2 rounded-full"
                                    style={{ width: `${student.progress}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold">{student.progress}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                              {student.quizzesAttempted}
                            </td>
                            <td className="px-6 py-4 text-center font-extrabold text-emerald-600 dark:text-emerald-450">
                              {student.averageQuizScore}%
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                              {student.assignmentsSubmitted}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                student.certificateStatus === "Earned"
                                  ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 ring-green-600/20"
                                  : "bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 ring-slate-500/10"
                              }`}>
                                {student.certificateStatus}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 dark:bg-slate-950 p-6 rounded-3xl border border-slate-850 shadow-sm text-left mb-6">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-650 text-white">
              <Users className="h-6 w-6 text-white" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Student Directory
              </h1>
              <p className="text-xs text-slate-205 mt-1">
                Manage student directory, add new records, or update details.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Input Form Panel */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-850 dark:text-slate-100">
              {editingId ? "Update Student Record" : "Add New Student"}
            </h2>

            <form onSubmit={addOrUpdateStudent} className="space-y-4">
              {/* Student Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Student Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <User className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Student Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Student Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-855 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                    placeholder="e.g. john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Courses Dropdown Selector */}
              <div className="space-y-1.5 relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Courses *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Search className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm bg-white dark:bg-slate-855 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs cursor-text"
                    placeholder="Search and select courses..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                      setFocusedIndex(-1);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onKeyDown={handleKeyDown}
                  />
                  {selectedCourseIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCourseIds([])}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-450 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {filteredCourses.length === 0 ? (
                      <div className="p-3 text-xs text-slate-450 italic">
                        {coursesLoading ? "Loading courses..." : "No courses found."}
                      </div>
                    ) : (
                      filteredCourses.map((course, idx) => {
                        const isSelected = selectedCourseIds.includes(course.id);
                        return (
                          <div
                            key={course.id}
                            onClick={() => toggleCourseSelection(course.id)}
                            className={`flex items-center justify-between p-2.5 text-xs cursor-pointer select-none transition-colors ${
                              focusedIndex === idx
                                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                                : "hover:bg-slate-50 dark:hover:bg-slate-850"
                            }`}
                          >
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{course.title}</p>
                              <p className="text-[10px] text-slate-450 font-mono mt-0.5">{course.courseCode}</p>
                            </div>
                            <span className="text-indigo-600">
                              {isSelected ? (
                                <CheckSquare className="h-4.5 w-4.5" />
                              ) : (
                                <Square className="h-4.5 w-4.5" />
                              )}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Selected Badges */}
              {selectedCourseIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {selectedCourseIds.map((id) => {
                    const c = courses.find((x) => x.id === id);
                    if (!c) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg text-[10px] font-bold border border-indigo-100 dark:border-indigo-900"
                      >
                        <span>{c.courseCode}</span>
                        <button
                          type="button"
                          onClick={() => toggleCourseSelection(id)}
                          className="hover:text-indigo-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2.5 text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer border-none"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingId ? (
                  "Update Record"
                ) : (
                  "Create Student"
                )}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setName("");
                    setEmail("");
                    setSelectedCourseIds([]);
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          {/* List Table Panel */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-150 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 font-sans text-left">Student Directory ({students.length})</h3>
            </div>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full border-collapse text-left text-sm text-slate-650 dark:text-slate-350">
                <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500">Name</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500">Email</th>
                    <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic">
                        No students in the directory.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-850 dark:text-slate-100">{student.name}</td>
                        <td className="px-6 py-4 font-medium text-slate-500 font-mono text-xs">{student.email}</td>
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => editStudent(student)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => deleteStudent(student.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950 px-2.5 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 shadow-xs transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked List View */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {students.length === 0 ? (
                <div className="px-6 py-10 text-center text-slate-400 italic text-xs">
                  No students in the directory.
                </div>
              ) : (
                students.map((student) => (
                  <div key={student.id} className="p-4 space-y-3">
                    <div>
                      <p className="font-semibold text-slate-850 dark:text-slate-100 text-sm">{student.name}</p>
                      <p className="font-medium text-slate-500 font-mono text-xs mt-0.5">{student.email}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => editStudent(student)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-xs transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => deleteStudent(student.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 shadow-xs transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DashboardPageContainer>
    </DashboardLayout>
  );
}