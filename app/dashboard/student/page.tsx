"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import StudentDashboard from "@/components/dashboard/StudentDashboard";
import LoadingState from "@/components/common/LoadingState";

export default function StudentDashboardPage() {
  const router = useRouter();
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
    if (!payload || payload.role !== "STUDENT") {
      if (payload && payload.role === "SUPER_ADMIN") {
        router.push("/dashboard/super-admin");
      } else if (payload && payload.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (payload && payload.role === "FACULTY") {
        router.push("/dashboard/faculty");
      } else {
        router.push("/login");
      }
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return <LoadingState message="Loading Student workspace..." />;
  }

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        <StudentDashboard />
      </DashboardPageContainer>
    </DashboardLayout>
  );
}
