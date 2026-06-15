"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import VideoForm from "@/components/videos/VideoForm";
import Link from "next/link";
import { ArrowLeft, Film, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Course {
  id: string;
  title: string;
  courseCode: string;
}

interface Video {
  id: string;
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
}

export default function EditVideoPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.id as string;

  const [courses, setCourses] = useState<Course[]>([]);
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [coursesRes, videoRes] = await Promise.all([
          api.get("/courses"),
          api.get(`/videos/${videoId}`),
        ]);
        setCourses(coursesRes.data);
        setVideo(videoRes.data);
      } catch (err: unknown) {
        console.error("Failed to load edit page data:", err);
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || "Failed to load video details.");
      } finally {
        setLoading(false);
      }
    };
    if (videoId) {
      loadData();
    }
  }, [videoId]);

  const handleUpdateVideo = async (videoData: {
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
      await api.put(`/videos/${videoId}`, videoData);
      toast.success("Video lesson updated successfully!");
      router.push("/dashboard/videos");
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Failed to update video record in database.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideo = async () => {
    const confirmed = confirm("Are you sure you want to delete this video lesson? This action will remove the database record and delete the uploaded file from storage.");
    if (!confirmed) return;

    try {
      setSaving(true);
      await api.delete(`/videos/${videoId}`);
      toast.success("Video lesson deleted successfully!");
      router.push("/dashboard/videos");
    } catch (err: unknown) {
      console.error("Delete failed:", err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "Failed to delete video.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/videos"
                className="inline-flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Edit Video Lesson</h1>
                <p className="text-sm text-slate-500">Edit lesson details or replace video file</p>
              </div>
            </div>

            {video && (
              <button
                onClick={handleDeleteVideo}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Lesson</span>
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <Film className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
                <p className="text-sm text-slate-500">Loading video details...</p>
              </div>
            ) : !video ? (
              <div className="text-center p-8">
                <p className="text-sm text-slate-500 font-medium">Video lesson not found.</p>
                <Link
                  href="/dashboard/videos"
                  className="mt-4 inline-block text-indigo-600 hover:underline text-sm font-semibold"
                >
                  Back to Video List
                </Link>
              </div>
            ) : (
              <VideoForm
                initialData={{
                  ...video,
                  description: video.description || null,
                  storagePath: video.storagePath || null,
                  fileName: video.fileName || null,
                  fileSize: video.fileSize || null,
                  mimeType: video.mimeType || null,
                }}
                courses={courses}
                onSubmit={handleUpdateVideo}
                loading={saving}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
