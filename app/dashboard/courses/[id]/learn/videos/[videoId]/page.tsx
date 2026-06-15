"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLearn } from "../../layout";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  BookOpen, 
  FileText,
  Activity,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import api from "@/lib/axios";
import toast from "react-hot-toast";

export default function VideoWatchPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const videoId = params.videoId as string;

  const { videos, materials, updateVideoProgressLocal, toggleComplete, loading } = useLearn();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressLoadedRef = useRef<string | null>(null);

  const [activeTab, setActiveTab] = useState<"overview" | "materials" | "stats">("overview");

  // Find current video details
  const videoIndex = videos.findIndex((v) => v.id === videoId);
  const currentVideo = videos[videoIndex];

  // Ref to hold current state values for event listeners (so they don't capture stale values)
  const stateRef = useRef({
    courseId,
    videoId,
    currentTime: 0,
    completed: false
  });

  useEffect(() => {
    stateRef.current = {
      courseId,
      videoId,
      currentTime: videoRef.current?.currentTime || 0,
      completed: currentVideo?.progress?.completed || false
    };
  }, [courseId, videoId, currentVideo]);

  // Save progress handler
  const saveProgress = async (time: number, isCompleted: boolean) => {
    try {
      const roundedTime = Math.floor(time);
      await api.post("/progress", {
        videoId: videoId,
        completed: isCompleted,
      });
      updateVideoProgressLocal(videoId, roundedTime, isCompleted);
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  };

  // Restore playback state and hook up unload listeners
  useEffect(() => {
    if (!currentVideo || !videoRef.current) return;

    const videoEl = videoRef.current;
    
    // Set initial seek position only once per video mount
    if (progressLoadedRef.current !== videoId) {
      const savedProgress = currentVideo.progress;
      if (savedProgress && !savedProgress.completed && savedProgress.watchTime > 0) {
        videoEl.currentTime = savedProgress.watchTime;
      } else {
        videoEl.currentTime = 0;
      }
      progressLoadedRef.current = videoId;
    }

    // Save timer running every 10 seconds during active playback
    const handlePlay = () => {
      saveIntervalRef.current = setInterval(() => {
        if (videoRef.current) {
          saveProgress(videoRef.current.currentTime, stateRef.current.completed);
        }
      }, 10000);
    };

    const handlePause = () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      saveProgress(videoEl.currentTime, stateRef.current.completed);
    };

    const handleEnded = () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      // Save completion
      stateRef.current.completed = true;
      saveProgress(videoEl.currentTime, true);
      toast.success("Lesson completed! 🎉");
    };

    const handleTimeUpdate = () => {
      stateRef.current.currentTime = videoEl.currentTime;
    };

    // Unload listener for browser tabs/windows
    const handleBeforeUnload = () => {
      const body = JSON.stringify({
        videoId: stateRef.current.videoId,
        completed: stateRef.current.completed
      });
      const url = "/api/progress";
      
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: 'POST',
          body,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true
        });
      }
    };

    // Attach local video events
    videoEl.addEventListener("play", handlePlay);
    videoEl.addEventListener("pause", handlePause);
    videoEl.addEventListener("ended", handleEnded);
    videoEl.addEventListener("timeupdate", handleTimeUpdate);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
      // Save any remaining progress on unmount
      saveProgress(videoEl.currentTime, stateRef.current.completed);

      videoEl.removeEventListener("play", handlePlay);
      videoEl.removeEventListener("pause", handlePause);
      videoEl.removeEventListener("ended", handleEnded);
      videoEl.removeEventListener("timeupdate", handleTimeUpdate);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [videoId, currentVideo]);

  if (loading) return null;

  if (!currentVideo) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh] bg-slate-50">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-3 animate-pulse" />
        <h3 className="text-base font-semibold text-slate-800">Lesson not found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-xs leading-relaxed">
          The selected video could not be loaded or does not belong to this course.
        </p>
      </div>
    );
  }

  // Navigation handlers
  const handlePrev = () => {
    if (videoIndex > 0) {
      router.push(`/dashboard/courses/${courseId}/learn/videos/${videos[videoIndex - 1].id}`);
    }
  };

  const handleNext = () => {
    if (videoIndex < videos.length - 1) {
      router.push(`/dashboard/courses/${courseId}/learn/videos/${videos[videoIndex + 1].id}`);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6 bg-slate-50 font-sans text-slate-700">
      {/* Video Player Box */}
      <div className="space-y-4">
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-slate-200">
          <video
            ref={videoRef}
            key={currentVideo.id}
            src={currentVideo.videoUrl}
            controls
            className="absolute inset-0 h-full w-full object-contain"
            poster="/next.svg"
          />
        </div>

        {/* Video Player Footer Controls */}
        <div className="flex items-center justify-between bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
          <button
            onClick={handlePrev}
            disabled={videoIndex === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous Lesson</span>
          </button>

          <div className="text-xs text-slate-500 font-bold font-mono">
            Lesson {videoIndex + 1} of {videos.length}
          </div>

          <button
            onClick={handleNext}
            disabled={videoIndex === videos.length - 1}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <span>Next Lesson</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Lesson Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pt-2">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {currentVideo.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 font-bold font-mono">
              {currentVideo.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {formatDuration(currentVideo.duration)}
                </span>
              )}
              <span className="h-1 w-1 rounded-full bg-slate-300"></span>
              {currentVideo.progress?.completed ? (
                <span className="text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Completed
                </span>
              ) : (
                <span className="text-amber-700 font-extrabold bg-amber-50 border border-amber-250 px-2 py-0.5 rounded-lg text-[10px]">
                  In Progress
                </span>
              )}
            </div>
          </div>

          {/* Mark Complete Action Button */}
          <button
            onClick={() => toggleComplete(videoId, !currentVideo.progress?.completed)}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition-all shadow-xs cursor-pointer ${
              currentVideo.progress?.completed 
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300" 
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {currentVideo.progress?.completed ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-slate-500" />
                <span>Mark Incomplete</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-100" />
                <span>Mark Complete</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex gap-2 border-b border-slate-200 pb-px mb-6">
          {(
            [
              { id: "overview", label: "Overview", icon: BookOpen },
              { id: "materials", label: "Resources", icon: FileText },
              { id: "stats", label: "My Progress", icon: Activity }
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs lg:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl min-h-[160px] shadow-xs">
          {activeTab === "overview" && (
            <div className="space-y-4 text-slate-600 leading-relaxed text-sm">
              {currentVideo.description ? (
                <div>
                  <h4 className="font-bold text-slate-400 mb-2 text-xs uppercase tracking-wider">Lesson Description</h4>
                  <p className="text-slate-650 font-medium">{currentVideo.description}</p>
                </div>
              ) : (
                <p className="text-slate-400 italic">No description provided for this lesson.</p>
              )}
            </div>
          )}

          {activeTab === "materials" && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-2">Available Study Materials</h4>
              {materials.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No materials uploaded for this course yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {materials.map((mat) => (
                    <a
                      key={mat.id}
                      href={mat.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-4 bg-slate-50 hover:bg-slate-105 border border-slate-200 rounded-2xl transition-all group"
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

          {activeTab === "stats" && (
            <div className="space-y-4 text-slate-600 text-sm">
              <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Granular Video Tracking Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Watch Time Status</span>
                  <div className="text-lg font-bold text-slate-800 mt-1 font-mono">
                    {Math.floor(currentVideo.progress?.watchTime || 0)}s
                    {currentVideo.duration ? ` / ${currentVideo.duration}s` : ""}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Completion Verification</span>
                  <div className="text-lg font-bold mt-1">
                    {currentVideo.progress?.completed ? (
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                        Verified Completed
                      </span>
                    ) : (
                      <span className="text-amber-705 font-bold">Not Completed Yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
