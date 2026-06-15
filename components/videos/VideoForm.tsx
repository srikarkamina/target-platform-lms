"use client";

import React, { useState } from "react";
import VideoUpload from "./VideoUpload";
import { AlertCircle } from "lucide-react";

interface Course {
  id: string;
  title: string;
  courseCode: string;
}

interface VideoFormPayload {
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
}

interface VideoFormProps {
  initialData?: {
    id?: string;
    title: string;
    description?: string | null;
    videoUrl: string;
    storagePath?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
    mimeType?: string | null;
    duration?: number | null;
    sortOrder: number;
    published?: boolean;
    courseId: string;
  };
  courses: Course[];
  courseIdFixed?: string;
  onSubmit: (data: VideoFormPayload) => Promise<void> | void;
  loading?: boolean;
}

export default function VideoForm({
  initialData,
  courses,
  courseIdFixed,
  onSubmit,
  loading = false,
}: VideoFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || "");
  const [storagePath, setStoragePath] = useState(initialData?.storagePath || "");
  const [fileName, setFileName] = useState(initialData?.fileName || "");
  const [fileSize, setFileSize] = useState(initialData?.fileSize || null);
  const [mimeType, setMimeType] = useState(initialData?.mimeType || "");
  const [duration, setDuration] = useState(
    initialData?.duration !== undefined && initialData?.duration !== null
      ? String(initialData.duration)
      : ""
  );
  const [sortOrder, setSortOrder] = useState(
    initialData?.sortOrder !== undefined && initialData?.sortOrder !== null
      ? String(initialData.sortOrder)
      : "0"
  );
  const [published, setPublished] = useState(
    initialData?.published !== undefined ? initialData.published : true
  );
  const [courseId, setCourseId] = useState(
    courseIdFixed || initialData?.courseId || (courses[0]?.id ?? "")
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleUploadComplete = (meta: {
    url: string;
    storagePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }) => {
    setVideoUrl(meta.url);
    setStoragePath(meta.storagePath);
    setFileName(meta.fileName);
    setFileSize(meta.fileSize);
    setMimeType(meta.mimeType);

    // Auto-fill title if empty
    if (!title) {
      // remove extension from name
      const nameWithoutExt = meta.fileName.substring(0, meta.fileName.lastIndexOf(".")) || meta.fileName;
      // replace underscores/dashes with spaces
      const formattedTitle = nameWithoutExt.replace(/[_-]/g, " ");
      setTitle(formattedTitle);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    const errors: string[] = [];
    if (!title.trim()) errors.push("Title is required.");
    if (!videoUrl.trim()) errors.push("Please upload a video file or provide a valid video URL.");
    if (!courseId) errors.push("Please select a course.");

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    const payload = {
      title,
      description: description || null,
      videoUrl,
      storagePath: storagePath || null,
      fileName: fileName || null,
      fileSize: fileSize ? Number(fileSize) : null,
      mimeType: mimeType || null,
      duration: duration ? Number(duration) : null,
      sortOrder: Number(sortOrder) || 0,
      published,
      courseId,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="flex gap-2 font-semibold mb-1">
            <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5" />
            <span>Please fix the following validation errors:</span>
          </div>
          <ul className="list-disc list-inside text-rose-700 text-xs space-y-0.5">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Row 1: Course (if not fixed) */}
      {!courseIdFixed && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Select Course *
          </label>
          <div className="relative">
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              required
            >
              <option value="" disabled>-- Select Course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  [{course.courseCode}] {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Row 2: File Upload */}
      <div>
        <VideoUpload
          onUploadComplete={handleUploadComplete}
          initialFileName={fileName || undefined}
        />
      </div>

      {/* Row 3: Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Video Lesson Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Introduction to Next.js App Router"
          className="w-full rounded-xl border border-slate-300 p-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          required
        />
      </div>

      {/* Row 4: Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Add details about this lesson..."
          className="w-full rounded-xl border border-slate-300 p-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
        />
      </div>

      {/* Row 5: Duration and Order */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Duration (seconds)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 900"
            min="0"
            className="w-full rounded-xl border border-slate-300 p-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Sort Order (Lesson Sequence)
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="e.g. 1"
            min="0"
            className="w-full rounded-xl border border-slate-300 p-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      {/* Row 6: Published Status */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="published"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
        />
        <label htmlFor="published" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
          Publish this lesson (visible to students)
        </label>
      </div>

      {/* Hidden inputs to track file upload details */}
      {videoUrl && (
        <div className="bg-slate-50 rounded-2xl p-4 border text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700 mb-1">File Attachment Info:</p>
          <p><span className="font-medium text-slate-600">Public URL:</span> <span className="break-all">{videoUrl}</span></p>
          {fileName && <p><span className="font-medium text-slate-600">Storage Filename:</span> {fileName}</p>}
          {fileSize && (
            <p>
              <span className="font-medium text-slate-600">Size:</span> {(fileSize / (1024 * 1024)).toFixed(2)} MB ({fileSize.toLocaleString()} bytes)
            </p>
          )}
          {mimeType && <p><span className="font-medium text-slate-600">MIME Type:</span> {mimeType}</p>}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors cursor-pointer"
        >
          {loading ? "Saving..." : initialData ? "Update Video Lesson" : "Create Video Lesson"}
        </button>
      </div>
    </form>
  );
}
