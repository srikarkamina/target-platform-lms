"use client";

import React, { useEffect, useState } from "react";
import { Award, Bell, ClipboardList, RefreshCw, Flame, BookOpen, ChevronRight, Play, CheckCircle, AlertCircle, History } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import ProgressChart from "./ProgressChart";
import DeadlineCard from "./DeadlineCard";
import NotificationSummary from "./NotificationSummary";

interface StudentData {
  learningStreak: number;
  overallProgress: number;
  continueLearning: {
    id: string;
    title: string;
    courseId: string;
    courseTitle: string;
    isCompleted?: boolean;
  } | null;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    course: { title: string };
  }>;
  recentCertificates: Array<{
    id: string;
    certificateNumber: string;
    issueDate: string;
    course: { title: string };
  }>;
  unreadNotifications: Array<{
    id: string;
    title: string;
    message: string;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    module: string;
    description: string | null;
    createdAt: string;
  }>;
}

export default function StudentDashboard() {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/dashboard/student");
      setData(res.data);
    } catch (err: any) {
      console.error("Failed to load student dashboard:", err);
      setError("Failed to fetch student dashboard details. Verify you are logged in as a student.");
      toast.error("Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      // Local state update
      if (data) {
        setData({
          ...data,
          unreadNotifications: data.unreadNotifications.filter((n) => n.id !== id),
        });
      }
      toast.success("Notification marked as read");
    } catch (err) {
      console.error("Failed to mark read:", err);
      toast.error("Failed to update notification status.");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900 shadow-sm text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-3" />
        <h3 className="text-base font-bold text-rose-800 dark:text-rose-455">{error}</h3>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const streak = data?.learningStreak ?? 0;
  const progress = data?.overallProgress ?? 0;
  const currentLesson = data?.continueLearning;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 dark:from-slate-900 dark:to-indigo-950 p-6 rounded-3xl border border-slate-800 shadow-lg text-white">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-amber-400">
            <Flame className="h-6 w-6 fill-amber-450 animate-bounce" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Keep moving forward! 🚀
            </h1>
            <p className="text-xs text-indigo-200 mt-1 leading-relaxed max-w-lg">
              You are currently on a <span className="font-extrabold text-amber-300">{streak}-day learning streak</span>. Finish today&apos;s lectures and quizzes to secure your streak!
            </p>
          </div>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Stats</span>
          </button>
        </div>
      </div>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Progress and Continue Learning */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            {/* Radial progress gauge */}
            <div className="md:col-span-1 border-r border-slate-100 dark:border-slate-800 pr-0 md:pr-6 flex flex-col items-center justify-center">
              <ProgressChart percentage={progress} size={130} strokeWidth={10} color="indigo" title="Completed" />
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mt-2">
                Overall Course Progress
              </p>
            </div>

            {/* Continue Learning recommendation */}
            <div className="md:col-span-2 pl-0 md:pl-6 flex flex-col justify-between pt-4 md:pt-0">
              <div>
                <span className="inline-flex text-[9px] font-extrabold uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 px-2.5 py-1 rounded-full mb-3">
                  Up Next
                </span>
                {loading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800 rounded"></div>
                    <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded"></div>
                  </div>
                ) : currentLesson ? (
                  <>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight leading-snug">
                      {currentLesson.title}
                    </h3>
                    <p className="text-xs text-slate-450 dark:text-slate-400 mt-1 leading-normal flex items-center gap-1 font-semibold">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>{currentLesson.courseTitle}</span>
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    No active course lessons recommended at this time. Enroll in a course to get started!
                  </p>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                {currentLesson && (
                  <a
                    href={`/dashboard/videos?id=${currentLesson.id}&courseId=${currentLesson.courseId}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-755 text-white font-extrabold px-4 py-2.5 text-xs transition-colors shadow-sm shadow-indigo-200 dark:shadow-none cursor-pointer"
                  >
                    {currentLesson.isCompleted ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Review Lecture</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Resume Lesson</span>
                      </>
                    )}
                    <ChevronRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2 mb-6">
              <History className="h-5 w-5 text-indigo-650" />
              <span>Recent Activity History</span>
            </h3>
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="h-10 bg-slate-50 dark:bg-slate-800 rounded-xl"></div>
                ))}
              </div>
            ) : data?.recentActivity.length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500 italic text-xs">
                No activity recorded yet. Explore your workspace to populate logs!
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {data?.recentActivity.map((activity, idx) => (
                    <li key={activity.id}>
                      <div className="relative pb-6">
                        {idx !== (data?.recentActivity.length ?? 0) - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-850" aria-hidden="true"></span>
                        )}
                        <div className="relative flex space-x-3 items-start">
                          <div>
                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">
                              <History className="h-4 w-4 shrink-0" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1.5 flex justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold text-slate-750 dark:text-slate-200">
                                {activity.description || `${activity.action} in ${activity.module}`}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-semibold">
                                {activity.module}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap bg-slate-50 dark:bg-slate-850 px-2 py-0.5 rounded-md">
                                {new Date(activity.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column */}
        <div className="lg:col-span-1 space-y-8">
          {/* Upcoming Assignment Deadlines */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2 mb-6">
              <ClipboardList className="h-5 w-5 text-indigo-650" />
              <span>Upcoming Deadlines</span>
            </h3>
            <DeadlineCard deadlines={data?.upcomingDeadlines ?? []} loading={loading} />
          </div>

          {/* Unread Alerts / Notifications */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2 mb-6">
              <Bell className="h-5 w-5 text-indigo-655" />
              <span>Unread Alerts</span>
            </h3>
            <NotificationSummary
              notifications={data?.unreadNotifications ?? []}
              loading={loading}
              onMarkRead={handleMarkRead}
            />
          </div>

          {/* Recent Credentials earned */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2 mb-6">
              <Award className="h-5 w-5 text-amber-500" />
              <span>Credentials Earned</span>
            </h3>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-12 bg-slate-50 dark:bg-slate-800 rounded-xl"></div>
              </div>
            ) : data?.recentCertificates.length === 0 ? (
              <div className="text-center py-6 text-slate-450 dark:text-slate-500 italic text-xs bg-slate-50/30 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                No certificates earned yet. Finish a course to receive credentials!
              </div>
            ) : (
              <div className="space-y-3">
                {data?.recentCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center gap-3 p-4 bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 border border-slate-150/50 dark:border-slate-850 rounded-2xl transition-colors"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
                      <Award className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {cert.course.title}
                      </h4>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                        Cert: {cert.certificateNumber}
                      </p>
                    </div>
                    <a
                      href={`/dashboard/certificates?id=${cert.id}`}
                      className="shrink-0 text-[10px] font-extrabold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
