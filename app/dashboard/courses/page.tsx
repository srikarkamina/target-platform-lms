"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import { BookOpen, Plus, Sparkles, GraduationCap } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  courseCode: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("STUDENT");

  // Dependency-free client-side JWT parser
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

    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        setCourses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
        setLoading(false);
      });
  }, []);

  const isManagementRole = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "FACULTY";

  return (
    <DashboardLayout>
      <DashboardPageContainer>
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-indigo-600" />
                <span>My Courses</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {isManagementRole 
                  ? "Manage curriculum details, lessons, materials, and check enrollments" 
                  : "Access your enrolled courses and view lessons"}
              </p>
            </div>

            {(userRole === "ADMIN" || userRole === "SUPER_ADMIN") && (
              <Link
                href="/dashboard/courses/new"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Add Course</span>
              </Link>
            )}
          </div>

          {/* Main Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <BookOpen className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-sm text-slate-500">Loading course catalog...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center p-12 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No courses available</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                {isManagementRole 
                  ? "Click 'Add Course' to start creating your curriculum." 
                  : "You are not enrolled in any active courses yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-150 p-6 flex flex-col hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600 uppercase tracking-wide">
                      {course.courseCode}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 leading-snug truncate group-hover:text-indigo-600 transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-slate-500 text-sm mt-2 line-clamp-3 flex-1 mb-6">
                    {course.description || "No description provided."}
                  </p>

                  <div className="mt-auto">
                    {isManagementRole ? (
                      <Link
                        href={`/dashboard/courses/${course.id}`}
                        className="w-full inline-flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        Edit Course & Lessons
                      </Link>
                    ) : (
                      <Link
                        href={`/dashboard/courses/${course.id}/learn`}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition-colors"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Start Learning</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
      </DashboardPageContainer>
    </DashboardLayout>
  );
}