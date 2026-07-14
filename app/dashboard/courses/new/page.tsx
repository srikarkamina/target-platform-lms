"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import Link from "next/link";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

export default function NewCoursePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

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
    if (!token) {
      router.push("/login");
      return;
    }
    const payload = parseJwt(token);
    if (payload && payload.role) {
      setRole(payload.role);
    }
    setRoleLoading(false);
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !courseCode) {
      toast.error("Please fill in required fields.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/courses", {
        title,
        description,
        courseCode,
        instituteId: "99c501ce-88ac-4611-92b3-17e7fea8374a",
      });

      toast.success("Course created successfully!");
      router.push("/dashboard/courses");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create course.");
    } finally {
      setLoading(false);
    }
  }

  if (roleLoading) {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 text-indigo-650 animate-spin" />
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 mb-4">
              <Plus className="h-8 w-8 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150">Access Denied</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
              Course creation is restricted to administrators. You do not have permissions to view this resource.
            </p>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardPageContainer>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Create New Course</h1>
              <p className="text-sm text-slate-500">Initialize a new academic track and curriculum space</p>
            </div>
          </div>

          <div className="max-w-xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                  placeholder="e.g. Intermediate Java Programming"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Course Code *
                </label>
                <input
                  type="text"
                  required
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                  placeholder="e.g. JAVA102"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                  rows={4}
                  placeholder="Optional course description..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  <span>{loading ? "Creating..." : "Create Course"}</span>
                </button>
              </div>
            </form>
          </div>
        </DashboardPageContainer>
    </DashboardLayout>
  );
}