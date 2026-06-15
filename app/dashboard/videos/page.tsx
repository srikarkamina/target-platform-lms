"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import VideoList from "@/components/videos/VideoList";
import { Plus, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";

interface Course {
  id: string;
  title: string;
  courseCode: string;
}

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCourseId) {
        params.append("courseId", selectedCourseId);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const res = await api.get(`/videos?${params.toString()}`);
      setVideos(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load video list.");
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, searchQuery]);

  const handleDelete = async (courseId: string, videoId: string) => {
    const confirmed = confirm(
      "Are you sure you want to delete this video? This will permanently delete the record and its storage file."
    );

    if (!confirmed) return;

    try {
      await api.delete(`/videos/${videoId}`);
      toast.success("Video lesson deleted successfully!");
      fetchVideos();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete video.");
    }
  };

  useEffect(() => {
    let active = true;
    const fetchAndSet = async () => {
      try {
        const res = await api.get("/courses");
        if (active) {
          setCourses(res.data);
        }
      } catch (err) {
        console.error("Failed to load courses for filter:", err);
      }
    };
    fetchAndSet();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchVideos();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, selectedCourseId, fetchVideos]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <div className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Videos</h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage lesson video files, storage records, and student access
              </p>
            </div>

            <Link
              href="/dashboard/videos/create"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Add Video Lesson</span>
            </Link>
          </div>

          {/* Filters Bar */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-150 shadow-sm">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                placeholder="Search lessons by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
              />
            </div>

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
          </div>

          {/* Video List Table */}
          <VideoList
            videos={videos}
            onDelete={handleDelete}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
