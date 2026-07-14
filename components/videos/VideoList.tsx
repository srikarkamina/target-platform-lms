"use client";

import React from "react";
import Link from "next/link";
import { Film, Edit, Trash2, ExternalLink, HardDrive } from "lucide-react";

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
  published: boolean;
  courseId: string;
  createdAt: string;
  course: {
    id: string;
    title: string;
    courseCode: string;
  };
}

interface VideoListProps {
  videos: Video[];
  onDelete: (courseId: string, videoId: string) => Promise<void>;
  loading?: boolean;
}

export default function VideoList({ videos, onDelete, loading = false }: VideoListProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse">
        <Film className="h-8 w-8 text-slate-300 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading videos...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center p-12 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <Film className="mx-auto h-12 w-12 text-slate-300 mb-3" />
        <h3 className="text-base font-semibold text-slate-800">No videos found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          No video lessons have been added yet, or they don&apos;t match your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white border border-slate-150 rounded-2xl shadow-sm flex flex-col">
      {/* Desktop Table View */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full border-collapse text-left text-sm text-slate-500">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-150">
            <tr>
              <th scope="col" className="px-6 py-4">Lesson</th>
              <th scope="col" className="px-6 py-4">Course</th>
              <th scope="col" className="px-6 py-4">Duration</th>
              <th scope="col" className="px-6 py-4">Status</th>
              <th scope="col" className="px-6 py-4">Storage Info</th>
              <th scope="col" className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {videos.map((video) => (
              <tr key={video.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 max-w-xs">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-600">
                      {video.sortOrder}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{video.title}</p>
                      {video.description && (
                        <p className="truncate text-xs font-normal text-slate-400 mt-0.5">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                    {video.course.courseCode}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">
                    {video.course.title}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
                  {formatDuration(video.duration)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {video.published ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-250">
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
                <td className="px-6 py-4 whitespace-nowrap">
                  {video.storagePath ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
                      <div>
                        <p className="truncate max-w-[120px] font-mono text-[10px] text-slate-400">
                          {video.fileName}
                        </p>
                        <p className="text-[10px] text-slate-500 font-normal">
                          Supabase • {formatFileSize(video.fileSize)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] font-normal text-slate-400">
                      External URL
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2.5">
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-505 hover:text-slate-700 transition-colors"
                      title="Open Video URL"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <Link
                      href={`/dashboard/videos/${video.id}/edit`}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-505 hover:text-indigo-600 transition-colors"
                      title="Edit Video"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => onDelete(video.courseId, video.id)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-505 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Video"
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

      {/* Mobile Stacked Card View */}
      <div className="block md:hidden divide-y divide-slate-100 bg-white">
        {videos.map((video) => (
          <div key={video.id} className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-600 mt-0.5">
                  {video.sortOrder}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{video.title}</p>
                  <p className="text-[10px] text-indigo-650 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md mt-1 inline-block font-mono">
                    {video.course.courseCode}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {video.published ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-2xs font-semibold text-emerald-700 border border-emerald-150">
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-2xs font-semibold text-slate-600 border border-slate-200">
                    Draft
                  </span>
                )}
              </div>
            </div>

            {video.description && (
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {video.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Duration</p>
                <p className="font-bold text-slate-700 font-mono">{formatDuration(video.duration)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Storage</p>
                <p className="font-bold text-slate-700 truncate" title={video.fileName || ""}>
                  {video.storagePath ? `Supabase (${formatFileSize(video.fileSize)})` : "External URL"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <a
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
                title="Open Video URL"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <Link
                href={`/dashboard/videos/${video.id}/edit`}
                className="p-2 rounded-xl border border-slate-200 hover:bg-indigo-50 text-slate-500 hover:text-indigo-650 transition-colors"
                title="Edit Video"
              >
                <Edit className="h-4 w-4" />
              </Link>
              <button
                onClick={() => onDelete(video.courseId, video.id)}
                className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                title="Delete Video"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
