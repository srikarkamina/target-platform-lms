"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { 
  BookOpen, 
  FileText, 
  Clock,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Circle,
  Menu,
  X
} from "lucide-react";
import toast from "react-hot-toast";

export interface Course {
  id: string;
  title: string;
  courseCode: string;
  description: string | null;
  instituteId: string;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  duration: number | null;
  sortOrder: number;
  storagePath?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  progress?: {
    completed: boolean;
    watchTime: number;
  };
}

export interface Material {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  materialType: string;
}

interface ProgressStats {
  totalVideos: number;
  completedVideos: number;
  completionPercentage: number;
}

interface LearnContextType {
  course: Course | null;
  videos: Video[];
  materials: Material[];
  progress: ProgressStats;
  loading: boolean;
  updateVideoProgressLocal: (videoId: string, watchTime: number, completed: boolean) => void;
  toggleComplete: (videoId: string, completed: boolean) => Promise<void>;
  refetchContent: () => Promise<void>;
}

const LearnContext = createContext<LearnContextType | undefined>(undefined);

export function useLearn() {
  const context = useContext(LearnContext);
  if (!context) {
    throw new Error("useLearn must be used within a LearnProvider");
  }
  return context;
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const params = paramsHook();
  const router = useRouter();
  const pathname = usePathname();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [progress, setProgress] = useState<ProgressStats>({
    totalVideos: 0,
    completedVideos: 0,
    completionPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Helper helper to handle useParams safe unpacking in next 15/16
  function paramsHook() {
    return useParams();
  }

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/${courseId}/content`);
      setCourse(res.data.course);
      setVideos(res.data.videos || []);
      setMaterials(res.data.materials || []);
      setProgress(res.data.progress);
    } catch (err: any) {
      console.error("Error loading course learn layout content:", err);
      if (err.response?.status === 403) {
        toast.error("Forbidden: You do not have access to this course.");
        router.push("/dashboard/courses");
      } else {
        toast.error("Failed to load learning assets.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const updateVideoProgressLocal = (videoId: string, watchTime: number, completed: boolean) => {
    setVideos((prevVideos) => {
      const updated = prevVideos.map((video) => {
        if (video.id === videoId) {
          return {
            ...video,
            progress: { completed, watchTime },
          };
        }
        return video;
      });

      const total = updated.length;
      const completedCount = updated.filter((v) => v.progress?.completed).length;
      const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
      
      setProgress({
        totalVideos: total,
        completedVideos: completedCount,
        completionPercentage: percentage,
      });

      return updated;
    });
  };

  const toggleComplete = async (videoId: string, completed: boolean) => {
    try {
      await api.post("/progress", { videoId, completed });
      updateVideoProgressLocal(videoId, 0, completed);
      toast.success(completed ? "Lesson marked completed! 🎉" : "Lesson marked incomplete.");
    } catch (err) {
      console.error("Failed to update video progress status:", err);
      toast.error("Failed to save progress on the server.");
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
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center font-sans">
        <Loader2 className="h-10 w-10 text-indigo-650 animate-spin mb-4" />
        <p className="text-sm text-slate-500 font-medium">Entering your learning space...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 font-sans">
        <p className="text-rose-600 font-semibold text-lg">Course not found or access denied.</p>
        <Link
          href="/dashboard/courses"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 px-5 py-2.5 text-sm font-semibold transition-colors shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Courses</span>
        </Link>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-707 w-72 sm:w-80 shrink-0">
      {/* Course Completion percentage */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans">Your Progress</span>
          <span className="text-sm font-extrabold text-indigo-650 font-mono">
            {progress.completionPercentage}%
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 shadow-inner overflow-hidden">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.completionPercentage}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-2 font-bold font-mono">
          {progress.completedVideos} of {progress.totalVideos} lessons completed
        </p>
      </div>

      {/* Lesson List Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/20 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="h-4.5 w-4.5 text-indigo-600" />
          <span>Lessons List</span>
        </h3>
      </div>

      {/* Videos List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-150 bg-white">
        {videos.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm italic">
            No lessons available.
          </div>
        ) : (
          videos.map((video, idx) => {
            const isCompleted = video.progress?.completed || false;
            const watchPath = `/dashboard/courses/${courseId}/learn/videos/${video.id}`;
            const isActive = pathname === watchPath;

            return (
              <button
                key={video.id}
                onClick={() => {
                  setSidebarOpen(false);
                  router.push(watchPath);
                }}
                className={`w-full text-left p-4 flex gap-3 transition-colors ${
                  isActive 
                    ? "bg-indigo-50/40 border-r-2 border-indigo-600" 
                    : "hover:bg-slate-50/50 border-r-2 border-transparent"
                }`}
              >
                <span className="shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 fill-emerald-50" />
                  ) : isActive ? (
                    <Circle className="h-4.5 w-4.5 text-indigo-600 animate-pulse" />
                  ) : (
                    <Circle className="h-4.5 w-4.5 text-slate-350" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold leading-tight ${
                    isActive ? "text-indigo-600" : "text-slate-800"
                  }`}>
                    {idx + 1}. {video.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-bold font-mono">
                    {video.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Materials / Resources Section */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-slate-400" />
          <span>Course Materials ({materials.length})</span>
        </h4>
        <div className="max-h-36 overflow-y-auto space-y-1.5">
          {materials.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">No materials uploaded.</p>
          ) : (
            materials.map((mat) => (
              <a
                key={mat.id}
                href={mat.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all group"
              >
                <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0 group-hover:scale-105 transition-transform" />
                <span className="text-[11px] text-slate-700 truncate font-semibold group-hover:text-indigo-605 transition-colors">
                  {mat.title}
                </span>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <LearnContext.Provider value={{
      course,
      videos,
      materials,
      progress,
      loading,
      updateVideoProgressLocal,
      toggleComplete,
      refetchContent: loadCourseData
    }}>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        
        {/* Navigation Bar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 flex items-center justify-between shadow-xs relative z-20">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-xs animate-none"
            >
              <ArrowLeft className="h-4 w-4 text-slate-650" />
            </Link>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-mono">
                {course.courseCode}
              </span>
              <h1 className="text-sm lg:text-base font-extrabold text-slate-900 truncate mt-0.5">{course.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider text-slate-605 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              {videos.length} Lessons • {materials.length} Materials
            </div>
            
            {/* Mobile Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-750 transition-colors cursor-pointer"
              aria-label="Toggle Lessons List"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          
          {/* Desktop Left Sidebar */}
          <div className="hidden lg:block">
            <SidebarContent />
          </div>

          {/* Mobile Overlay Sidebar */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-20 flex lg:hidden bg-black/40 backdrop-blur-xs transition-opacity duration-300">
              <div className="flex-1" onClick={() => setSidebarOpen(false)} />
              <SidebarContent />
            </div>
          )}

          {/* Workspace Area */}
          <main className="flex-1 min-h-0 overflow-y-auto bg-slate-50 relative">
            {children}
          </main>
        </div>
      </div>
    </LearnContext.Provider>
  );
}
