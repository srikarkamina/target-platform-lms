"use client";

import React, { useEffect, useState } from "react";
import { Users, UserCheck, BookOpen, Layers, Award, ClipboardList, RefreshCw, BarChart3, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import StatCard from "./StatCard";
import ChartCard from "./ChartCard";
import GrowthChart from "./GrowthChart";
import ActivityTimeline from "./ActivityTimeline";
import RecentActivity from "./RecentActivity";

interface AdminData {
  statistics: {
    totalStudents: number;
    totalFaculty: number;
    totalCourses: number;
    activeCourses: number;
    certificatesIssued: number;
    assignmentSubmissions: number;
    quizAttempts: number;
    activeUsers: number;
  };
  charts: {
    studentGrowth: Array<{ month: string; count: number }>;
    courseGrowth: Array<{ month: string; count: number }>;
    certificateTrend: Array<{ month: string; count: number }>;
    quizCompletionTrend: Array<{ month: string; count: number }>;
  };
  timeline: Array<{
    day: string;
    dateStr: string;
    count: number;
  }>;
  activityFeed: Array<{
    id: string;
    user: string;
    userRole: string;
    action: string;
    module: string;
    description: string;
    timestamp: string;
  }>;
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/dashboard/admin");
      setData(res.data);
    } catch (err: any) {
      console.error("Failed to load admin dashboard:", err);
      setError("Failed to fetch dashboard and statistics. Ensure you have administrator access.");
      toast.error("Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
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

  const stats = data?.statistics;
  const charts = data?.charts;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-850 dark:text-slate-100 tracking-tight">
            Administrator Console 🛡️
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Monitor institutional metrics, growth trends, system activity levels, and audit events.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Console</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          icon={Users}
          color="indigo"
          description="Enrolled student accounts"
          loading={loading}
        />
        <StatCard
          title="Total Faculty"
          value={stats?.totalFaculty ?? 0}
          icon={UserCheck}
          color="blue"
          description="Registered instructors"
          loading={loading}
        />
        <StatCard
          title="Total Courses"
          value={stats?.totalCourses ?? 0}
          icon={BookOpen}
          color="purple"
          description="Curriculum options"
          loading={loading}
        />
        <StatCard
          title="Active Courses"
          value={stats?.activeCourses ?? 0}
          icon={Layers}
          color="emerald"
          description="Courses with active batches"
          loading={loading}
        />
        <StatCard
          title="Certificates Issued"
          value={stats?.certificatesIssued ?? 0}
          icon={Award}
          color="amber"
          description="Credentials generated"
          loading={loading}
        />
        <StatCard
          title="Submissions"
          value={stats?.assignmentSubmissions ?? 0}
          icon={ClipboardList}
          color="rose"
          description="Assignment files loaded"
          loading={loading}
        />
        <StatCard
          title="Quiz Attempts"
          value={stats?.quizAttempts ?? 0}
          icon={BarChart3}
          color="purple"
          description="Quizzes completed"
          loading={loading}
        />
        <StatCard
          title="Active Users"
          value={stats?.activeUsers ?? 0}
          icon={Users}
          color="slate"
          description="Users active in last 30 days"
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Student Growth" description="Monthly student registrations over 6 months" icon={Users}>
          <GrowthChart
            data={charts?.studentGrowth.map((d) => ({ label: d.month.split(" ")[0], value: d.count })) ?? []}
            type="bar"
            color="indigo"
          />
        </ChartCard>

        <ChartCard title="Course Additions" description="New course publications over 6 months" icon={BookOpen}>
          <GrowthChart
            data={charts?.courseGrowth.map((d) => ({ label: d.month.split(" ")[0], value: d.count })) ?? []}
            type="line"
            color="emerald"
          />
        </ChartCard>

        <ChartCard title="Certificate Trends" description="Credentials issued over 6 months" icon={Award}>
          <GrowthChart
            data={charts?.certificateTrend.map((d) => ({ label: d.month.split(" ")[0], value: d.count })) ?? []}
            type="bar"
            color="amber"
          />
        </ChartCard>

        <ChartCard title="Quiz Submissions" description="Total quiz completions over 6 months" icon={BarChart3}>
          <GrowthChart
            data={charts?.quizCompletionTrend.map((d) => ({ label: d.month.split(" ")[0], value: d.count })) ?? []}
            type="line"
            color="rose"
          />
        </ChartCard>
      </div>

      {/* Activity Timeline and Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-650" />
              <span>Weekly Activity Timeline</span>
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 leading-relaxed">
              Count of system logs and interactions over the last 7 days.
            </p>
          </div>
          <div className="mt-8">
            <ActivityTimeline data={data?.timeline ?? []} loading={loading} />
          </div>
        </div>

        {/* Latest Activity Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2 mb-6">
            <Layers className="h-5 w-5 text-indigo-650" />
            <span>Latest Operations Feed</span>
          </h3>
          <div className="max-h-[300px] overflow-y-auto pr-1">
            <RecentActivity activities={data?.activityFeed ?? []} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
