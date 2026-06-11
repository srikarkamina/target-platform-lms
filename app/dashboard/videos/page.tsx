"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

interface Video {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  duration: number | null;
  sortOrder: number;
  courseId: string;
  createdAt: string;
  course: {
    id: string;
    title: string;
    courseCode: string;
  };
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/videos");
      setVideos(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load videos. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (
    courseId: string,
    videoId: string
  ) => {
    const confirmed = confirm(
      "Are you sure you want to delete this video?"
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/courses/${courseId}/videos/${videoId}`
      );
      fetchVideos();
    } catch (err) {
      console.error(err);
      alert("Failed to delete video.");
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div>
      <Navbar />

      <div className="flex">
        <Sidebar />

        <div className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Videos</h1>

            <p className="text-sm text-gray-500">
              Manage videos from each Course page
            </p>
          </div>

          {loading && (
            <p className="text-gray-500">Loading videos...</p>
          )}

          {error && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && videos.length === 0 && (
            <div className="rounded border p-8 text-center text-gray-500">
              <p className="text-lg font-medium">
                No videos found.
              </p>
              <p className="mt-2 text-sm">
                Go to a Course page to add videos.
              </p>
              <Link
                href="/dashboard/courses"
                className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Go to Courses
              </Link>
            </div>
          )}

          {!loading && videos.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="p-3 text-left font-semibold">
                      Title
                    </th>

                    <th className="p-3 text-left font-semibold">
                      Course
                    </th>

                    <th className="p-3 text-left font-semibold">
                      Duration
                    </th>

                    <th className="p-3 text-left font-semibold">
                      Order
                    </th>

                    <th className="p-3 text-left font-semibold">
                      URL
                    </th>

                    <th className="p-3 text-center font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {videos.map((video) => (
                    <tr
                      key={video.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-3 font-medium">
                        {video.title}
                      </td>

                      <td className="p-3">
                        <Link
                          href={`/dashboard/courses/${video.courseId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {video.course.title}
                        </Link>
                      </td>

                      <td className="p-3 text-gray-600">
                        {formatDuration(video.duration)}
                      </td>

                      <td className="p-3 text-gray-600">
                        {video.sortOrder}
                      </td>

                      <td className="max-w-xs p-3">
                        <a
                          href={video.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-blue-600 hover:underline"
                        >
                          {video.videoUrl}
                        </a>
                      </td>

                      <td className="space-x-2 p-3 text-center">
                        <Link
                          href={`/dashboard/courses/${video.courseId}`}
                          className="rounded bg-blue-500 px-3 py-1 text-white"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() =>
                            handleDelete(
                              video.courseId,
                              video.id
                            )
                          }
                          className="rounded bg-red-500 px-3 py-1 text-white"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
