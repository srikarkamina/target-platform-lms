"use client";

import React, { useState, useRef } from "react";
import api from "@/lib/axios";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface VideoUploadProps {
  onUploadComplete: (metadata: {
    url: string;
    storagePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }) => void;
  onUploadError?: (error: string) => void;
  initialFileName?: string;
}

export default function VideoUpload({
  onUploadComplete,
  onUploadError,
  initialFileName,
}: VideoUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(initialFileName || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = async (file: File) => {
    setError(null);

    // Frontend validations
    const allowedExtensions = ["mp4", "webm", "mov"];
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      const msg = "Invalid file type. Only MP4, WebM, and MOV videos are allowed.";
      setError(msg);
      if (onUploadError) onUploadError(msg);
      return;
    }

    const maxSizeBytes = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSizeBytes) {
      const msg = "Maximum video size is 2GB";
      setError(msg);
      if (onUploadError) onUploadError(msg);
      return;
    }

    // Start upload
    setUploading(true);
    setProgress(0);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/upload/video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(pct);
          }
        },
      });

      if (res.data.success) {
        onUploadComplete({
          url: res.data.url,
          storagePath: res.data.storagePath,
          fileName: res.data.fileName,
          fileSize: res.data.fileSize,
          mimeType: res.data.mimeType,
        });
      }
    } catch (err: unknown) {
      console.error("Upload error details:", err);
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errMsg = axiosError.response?.data?.message || "Failed to upload file to storage.";
      setError(errMsg);
      setFileName(null);
      if (onUploadError) onUploadError(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await validateAndUpload(e.target.files[0]);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Video File Upload
      </label>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={!uploading ? triggerBrowse : undefined}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? "border-indigo-500 bg-indigo-50/50 shadow-inner scale-[0.99]"
            : fileName && !error && !uploading
            ? "border-emerald-500 bg-emerald-50/20"
            : "border-slate-300 bg-white hover:border-slate-400 hover:shadow-md"
        } ${uploading ? "cursor-not-allowed pointer-events-none" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center w-full max-w-xs">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-1">
              Uploading video file... {progress}%
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2 truncate w-full">
              {fileName}
            </p>
          </div>
        ) : fileName && !error ? (
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Video uploaded successfully
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md truncate">
              {fileName}
            </p>
            <span className="mt-3 text-xs font-medium text-indigo-600 hover:underline">
              Replace File
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Drag & drop video file here, or{" "}
              <span className="text-indigo-600 hover:underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Supports MP4, WebM, and MOV up to 2GB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Upload Failed</p>
            <p className="text-xs mt-0.5 text-rose-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
