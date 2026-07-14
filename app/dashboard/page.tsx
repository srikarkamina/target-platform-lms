"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import dynamic from "next/dynamic";
import LoadingState from "@/components/common/LoadingState";
import { Loader2 } from "lucide-react";

const AdminDashboard = dynamic(() => import("@/components/dashboard/AdminDashboard"), {
  loading: () => <LoadingState message="Loading Admin workspace..." />,
});
const FacultyDashboard = dynamic(() => import("@/components/dashboard/FacultyDashboard"), {
  loading: () => <LoadingState message="Loading Faculty workspace..." />,
});
const StudentDashboard = dynamic(() => import("@/components/dashboard/StudentDashboard"), {
  loading: () => <LoadingState message="Loading Student workspace..." />,
});

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const payload = parseJwt(token);
    if (payload && payload.role) {
      if (payload.role === "SUPER_ADMIN") {
        router.push("/dashboard/super-admin");
        return;
      }
      setRole(payload.role);
    } else {
      router.push("/login");
    }
    setLoading(false);
  }, [router]);

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        {loading ? (
          <div className="flex flex-col items-center justify-center p-32">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-semibold">
              Loading workspace dashboard...
            </p>
          </div>
        ) : role === "ADMIN" || role === "SUPER_ADMIN" ? (
          <AdminDashboard />
        ) : role === "FACULTY" ? (
          <FacultyDashboard />
        ) : role === "STUDENT" ? (
          <StudentDashboard />
        ) : (
          <div className="text-center p-12 text-slate-500 dark:text-slate-400">
            Unauthorized role structure. Please log in again.
          </div>
        )}
      </DashboardPageContainer>
    </DashboardLayout>
  );
}