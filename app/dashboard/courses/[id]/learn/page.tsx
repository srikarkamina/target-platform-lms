"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useLearn } from "./layout";
import { 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  FileText, 
  Award, 
  Clock,
  ArrowLeft,
  Loader2,
  Lock
} from "lucide-react";

export default function StudentLearnPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const { course, videos, materials, loading } = useLearn();
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"overview" | "materials" | "quizzes" | "progress">("overview");

  const activeVideo = videos[activeVideoIndex];

  const handleNext = () => {
    if (activeVideoIndex < videos.length - 1) {
      setActiveVideoIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (activeVideoIndex > 0) {
      setActiveVideoIndex((prev) => prev - 1);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 text-indigo-650 animate-spin mb-4" />
          <p className="text-sm text-slate-500 font-medium">Entering your learning space...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <p className="text-rose-600 font-semibold text-lg">Course not found or access denied.</p>
          <Link
            href="/dashboard/courses"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 px-5 py-2.5 text-sm font-semibold transition-colors shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Courses</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar />

      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Link>
          <div className="min-w-0">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">
              {course.courseCode}
            </span>
            <h1 className="text-lg font-extrabold text-slate-900 truncate mt-0.5">{course.title}</h1>
          </div>
        </div>
        
        <div className="text-xs text-slate-550 font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-mono">
          {videos.length} Lessons • {materials.length} Materials
        </div>
      </div>

      {/* Main Learning Grid */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left Area: Video Player & Details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 lg:border-r lg:border-slate-200 bg-slate-50">
          {activeVideo ? (
            <div className="space-y-4">
              {/* Responsive Video Container */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-200">
                <video
                  key={activeVideo.id}
                  src={activeVideo.videoUrl}
                  controls
                  className="absolute inset-0 h-full w-full object-contain"
                  poster="/next.svg"
                />
              </div>

              {/* Player Navigation Buttons */}
              <div className="flex items-center justify-between bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                <button
                  onClick={handlePrev}
                  disabled={activeVideoIndex === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous Lesson</span>
                </button>

                <div className="text-xs text-slate-500 font-bold font-mono">
                  Lesson {activeVideoIndex + 1} of {videos.length}
                </div>

                <button
                  onClick={handleNext}
                  disabled={activeVideoIndex === videos.length - 1}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Video Info Header */}
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">{activeVideo.title}</h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 font-bold font-mono">
                  {activeVideo.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-405" />
                      {formatDuration(activeVideo.duration)}
                    </span>
                  )}
                  <span className="h-1 w-1 rounded-full bg-slate-350"></span>
                  <span className="text-indigo-650 font-bold bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg text-[10px]">
                    Current Lesson
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-video w-full rounded-2xl flex flex-col items-center justify-center bg-white border border-slate-200 p-8 text-center shadow-xs">
              <Play className="h-12 w-12 text-slate-400 mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-slate-800">No video lessons available</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-xs leading-relaxed">
                This course does not have any videos uploaded yet.
              </p>
            </div>
          )}

          {/* Details & Resources Tabs */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex gap-2 border-b border-slate-200 pb-px mb-6">
              {(
                [
                  { id: "overview", label: "Overview", icon: BookOpen, locked: false },
                  { id: "materials", label: "Resources", icon: FileText, locked: false },
                  { id: "quizzes", label: "Quizzes & Assignments", icon: Award, locked: true },
                  { id: "progress", label: "My Progress", icon: Clock, locked: true },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => !tab.locked && setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-xs lg:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                      tab.locked 
                        ? "text-slate-400 cursor-not-allowed opacity-60" 
                        : activeTab === tab.id
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                    disabled={tab.locked}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.locked && <Lock className="h-3 w-3 text-slate-400 ml-1" />}
                  </button>
                );
              })}
            </div>

            {/* Tab: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-4 text-slate-600 leading-relaxed text-sm">
                {activeVideo?.description ? (
                  <div>
                    <h4 className="font-bold text-slate-400 mb-2 text-xs uppercase tracking-wider">Lesson Description</h4>
                    <p className="text-slate-700 font-semibold">{activeVideo.description}</p>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No description provided for this lesson.</p>
                )}

                {course.description && (
                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <h4 className="font-bold text-slate-400 mb-2 text-xs uppercase tracking-wider">About the Course</h4>
                    <p className="text-slate-700 font-semibold">{course.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Materials */}
            {activeTab === "materials" && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-2">Study Materials</h4>
                {materials.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No study materials uploaded for this course yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {materials.map((mat) => (
                      <a
                        key={mat.id}
                        href={mat.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all group"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-250 text-emerald-600 group-hover:scale-105 transition-transform">
                          <FileText className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-650 transition-colors">
                            {mat.title}
                          </p>
                          {mat.description && (
                            <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                              {mat.description}
                            </p>
                          )}
                          <span className="inline-block mt-2 text-[10px] uppercase font-bold tracking-wider text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            {mat.materialType}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Area: Sidebar Lesson List */}
        <div className="w-full lg:w-80 shrink-0 bg-white border-l border-slate-200 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/40">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <BookOpen className="h-4.5 w-4.5 text-indigo-600" />
              <span>Lessons List</span>
            </h3>
            <span className="text-xs text-slate-500 font-bold font-mono bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg">
              {videos.length} Videos
            </span>
          </div>

          <div className="flex-1 divide-y divide-slate-150 bg-white">
            {videos.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm italic">
                No lessons loaded.
              </div>
            ) : (
              videos.map((video, idx) => {
                const isActive = idx === activeVideoIndex;
                return (
                  <button
                    key={video.id}
                    onClick={() => setActiveVideoIndex(idx)}
                    className={`w-full text-left p-4 flex gap-3 transition-colors ${
                      isActive 
                        ? "bg-indigo-50/40 border-l-2 border-indigo-600" 
                        : "hover:bg-slate-50/50 border-l-2 border-transparent"
                    }`}
                  >
                    <span className={`h-6 w-6 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                      isActive 
                        ? "bg-indigo-650 text-white" 
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        isActive ? "text-indigo-600" : "text-slate-800"
                      }`}>
                        {video.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-bold font-mono">
                        {video.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(video.duration)}
                          </span>
                        )}
                        {video.storagePath && (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Supabase
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
