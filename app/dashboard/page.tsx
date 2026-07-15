"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();

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
      } else if (payload.role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (payload.role === "FACULTY") {
        router.push("/dashboard/faculty");
      } else {
        router.push("/dashboard/student");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center p-32 min-h-screen bg-slate-950 text-white font-sans">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-semibold">
        Loading workspace dashboard...
      </p>
    </div>
  );
}