"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, BookOpen, Video, FileText, ClipboardCheck, ClipboardList, Award, BarChart3 } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string>("STUDENT");

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
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.role) {
        setRole(payload.role);
      }
    }
  }, []);

  const isManagementRole = role === "ADMIN" || role === "SUPER_ADMIN" || role === "FACULTY";

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Students", href: "/dashboard/students", icon: Users },
    { name: "Courses", href: "/dashboard/courses", icon: BookOpen },
    { name: "Videos", href: "/dashboard/videos", icon: Video },
    { name: "Materials", href: "/dashboard/materials", icon: FileText },
    { name: "Assignments", href: "/dashboard/assignments", icon: ClipboardCheck },
  ];

  if (isManagementRole) {
    menuItems.push({ name: "Submissions", href: "/dashboard/submissions", icon: ClipboardList });
    menuItems.push({ name: "Quizzes", href: "/dashboard/quizzes", icon: Award });
  } else {
    menuItems.push({ name: "My Submissions", href: "/dashboard/student/submissions", icon: ClipboardList });
    menuItems.push({ name: "Quizzes", href: "/dashboard/student/quizzes", icon: Award });
  }

  menuItems.push({ name: "Reports & Analytics", href: "/dashboard/reports", icon: BarChart3 });

  return (
    <aside className="w-64 border-r border-slate-200 bg-white min-h-[calc(100vh-65px)] shrink-0 font-sans">
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}