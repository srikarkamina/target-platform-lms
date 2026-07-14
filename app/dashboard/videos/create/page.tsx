"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import VideoForm from "@/components/videos/VideoForm";
import Link from "next/link";
import { ArrowLeft, Film } from "lucide-react";
import toast from "react-hot-toast";

interface Course {
  id: string;
  title: string;
  courseCode: string;
}

export default function CreateVideoPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        const res = await api.get("/courses");
        setCourses(res.data);
      } catch (err) {
        console.error("Failed to load courses:", err);
        setError("Could not load courses. Please try again.");
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleCreateVideo = async (videoData: {
    title: string;
    description: string | null;
    videoUrl: string;
    storagePath: string | null;
    fileName: string | null;
    fileSize: number | null;
    mimeType: string | null;
    duration: number | null;
    sortOrder: number;
    courseId: string;
  }) => {
    try {
      setSaving(true);
      setError(null);
      await api.post("/videos", videoData);
      toast.success("Video lesson created successfully!");
      router.push("/dashboard/videos");
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Failed to create video record in database.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardPageContainer maxWidth="max-w-4xl">
          <div className="mb-6 flex items-center gap-4">
            <Link
              href="/dashboard/videos"
              className="inline-flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Create Video Lesson</h1>
              <p className="text-sm text-slate-500">Upload and configure a new course lesson video</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm">
            {coursesLoading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <Film className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
                <p className="text-sm text-slate-500">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center p-8">
                <p className="text-sm text-slate-500 font-medium">No courses available.</p>
                <p className="text-xs text-slate-400 mt-1">Please create a course before uploading lessons.</p>
                <Link
                  href="/dashboard/courses/new"
                  className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 transition-colors"
                >
                  Create Course
                </Link>
              </div>
            ) : (
              <VideoForm
                courses={courses}
                onSubmit={handleCreateVideo}
                loading={saving}
              />
            )}
          </div>
        </DashboardPageContainer>
    </DashboardLayout>
  );
}
