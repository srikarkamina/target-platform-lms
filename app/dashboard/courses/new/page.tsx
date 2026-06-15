"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

export default function NewCoursePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6 font-sans">
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
        </main>
      </div>
    </div>
  );
}