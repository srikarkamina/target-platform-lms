"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarState, setSidebar } from "@/lib/sidebar-state";
import { 
  LayoutDashboard, Users, BookOpen, Video, FileText, 
  ClipboardCheck, ClipboardList, Award, BarChart3, 
  Scroll, Medal, X, Settings, History, Mail, Building, CreditCard,
  Activity, Database, Megaphone, HelpCircle, HeartHandshake, Vote, Calendar
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string>("STUDENT");
  const isOpen = useSidebarState();
  const drawerRef = useRef<HTMLDivElement>(null);

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

  // Escape key closes the mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setSidebar(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  // Focus trapping loop for drawer
  useEffect(() => {
    if (!isOpen) return;
    const focusable = drawerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;

    // Focus the first item (close button or first link)
    first.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  // Close mobile drawer on route changes
  useEffect(() => {
    setSidebar(false);
  }, [pathname]);

  const isManagementRole = role === "ADMIN" || role === "SUPER_ADMIN" || role === "FACULTY";

  const menuItems: Array<{ name: string; href: string; icon: any }> = [];

  if (role === "SUPER_ADMIN") {
    menuItems.push({ name: "SaaS Dashboard", href: "/dashboard/super-admin", icon: LayoutDashboard });
    menuItems.push({ name: "Access Requests", href: "/dashboard/super-admin/access-requests", icon: ClipboardList });
    menuItems.push({ name: "Demo Requests", href: "/dashboard/super-admin/demo-requests", icon: Calendar });
    menuItems.push({ name: "Institutes", href: "/dashboard/super-admin/institutes", icon: Building });
    menuItems.push({ name: "Subscriptions", href: "/dashboard/super-admin/subscriptions", icon: CreditCard });
    menuItems.push({ name: "System Health", href: "/dashboard/super-admin/system", icon: Activity });
    menuItems.push({ name: "Backups", href: "/dashboard/super-admin/backups", icon: Database });
    menuItems.push({ name: "Feedback Management", href: "/dashboard/feedback", icon: HeartHandshake });
    menuItems.push({ name: "Audit Logs", href: "/dashboard/audit-logs", icon: History });
    menuItems.push({ name: "Email History", href: "/dashboard/email-history", icon: Mail });
  } else if (isManagementRole) {
    menuItems.push({ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard });
    if (role === "FACULTY") {
      menuItems.push({ name: "Course Students", href: "/dashboard/students", icon: Users });
    } else {
      menuItems.push({ name: "Students", href: "/dashboard/students", icon: Users });
    }
    menuItems.push({ name: "Courses", href: "/dashboard/courses", icon: BookOpen });
    menuItems.push({ name: "Videos", href: "/dashboard/videos", icon: Video });
    menuItems.push({ name: "Materials", href: "/dashboard/materials", icon: FileText });
    menuItems.push({ name: "Assignments", href: "/dashboard/assignments", icon: ClipboardCheck });
    menuItems.push({ name: "Submissions", href: "/dashboard/submissions", icon: ClipboardList });
    menuItems.push({ name: "Quizzes", href: "/dashboard/quizzes", icon: Award });
    menuItems.push({ name: "Announcements", href: "/dashboard/announcements", icon: Megaphone });
    menuItems.push({ name: "Doubts", href: "/dashboard/doubts", icon: HelpCircle });
    if (role === "ADMIN") {
      menuItems.push({ name: "Feedback", href: "/dashboard/feedback", icon: HeartHandshake });
    }
    menuItems.push({ name: "Polls", href: "/dashboard/polls", icon: Vote });
    menuItems.push({ name: "Events", href: "/dashboard/events", icon: Calendar });
    if (role !== "FACULTY") {
      menuItems.push({ name: "Templates", href: "/dashboard/certificate-templates", icon: Scroll });
    }
    menuItems.push({ name: "Certificates", href: "/dashboard/certificates", icon: Medal });
    if (role !== "FACULTY") {
      menuItems.push({ name: "Audit Logs", href: "/dashboard/audit-logs", icon: History });
    }
    if (role === "ADMIN") {
      menuItems.push({ name: "Email History", href: "/dashboard/email-history", icon: Mail });
      menuItems.push({ name: "Subscription", href: "/dashboard/settings/subscription", icon: CreditCard });
    }
    if (role !== "FACULTY") {
      menuItems.push({ name: "Settings", href: "/dashboard/settings", icon: Settings });
    }
  } else {
    menuItems.push({ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard });
    menuItems.push({ name: "Courses", href: "/dashboard/courses", icon: BookOpen });
    menuItems.push({ name: "Videos", href: "/dashboard/videos", icon: Video });
    menuItems.push({ name: "Materials", href: "/dashboard/materials", icon: FileText });
    menuItems.push({ name: "Assignments", href: "/dashboard/assignments", icon: ClipboardCheck });
    menuItems.push({ name: "My Submissions", href: "/dashboard/student/submissions", icon: ClipboardList });
    menuItems.push({ name: "Quizzes", href: "/dashboard/student/quizzes", icon: Award });
    menuItems.push({ name: "Announcements", href: "/dashboard/announcements", icon: Megaphone });
    menuItems.push({ name: "Doubts", href: "/dashboard/doubts", icon: HelpCircle });
    menuItems.push({ name: "Polls", href: "/dashboard/polls", icon: Vote });
    menuItems.push({ name: "Events", href: "/dashboard/events", icon: Calendar });
    menuItems.push({ name: "Certificates", href: "/dashboard/certificates", icon: Medal });
    menuItems.push({ name: "My Activity", href: "/dashboard/audit-logs", icon: History });
  }

  if (role !== "SUPER_ADMIN") {
    let reportsHref = "/dashboard/reports";
    if (role === "STUDENT") {
      reportsHref = "/dashboard/student/reports";
    }

    menuItems.push({
      name: "Reports & Analytics",
      href: reportsHref,
      icon: BarChart3,
    });
  }

  const hasExactMatch = menuItems.some(item => pathname === item.href);

  const isItemActive = (itemHref: string) => {
    if (hasExactMatch) {
      return pathname === itemHref;
    }
    if (itemHref === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname?.startsWith(itemHref) ?? false;
  };

  return (
    <>
      {/* Static Sidebar for Desktop/Tablet */}
      <aside className="hidden md:flex flex-col w-20 lg:w-64 border-r border-slate-200 bg-white min-h-[calc(100vh-64px)] shrink-0 transition-all duration-300 font-sans">
        <nav className="p-4 space-y-1 flex-1">
          {menuItems.map((item) => {
            const isActive = isItemActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-center lg:justify-start gap-3 px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-yellow-500 ${
                  isActive
                    ? "bg-yellow-400 text-slate-900 shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                }`}
                title={item.name}
              >
                <Icon 
                  className={`h-5 w-5 shrink-0 transition-colors ${isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"}`} 
                  strokeWidth={2.2}
                />
                <span className="hidden lg:inline-block">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Drawer (visible `< md`) */}
      <div 
        ref={drawerRef}
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
          isOpen ? "visible opacity-100 pointer-events-auto" : "invisible opacity-0 pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu drawer"
      >
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setSidebar(false)}
        />
        
        {/* Drawer panel */}
        <aside className={`absolute inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 shrink-0">
            <span className="font-extrabold text-slate-800 tracking-tight">Navigation</span>
            <button 
              onClick={() => setSidebar(false)} 
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-405 hover:text-slate-600 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              aria-label="Close navigation drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto flex-1">
            {menuItems.map((item) => {
              const isActive = isItemActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-3 px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-yellow-500 ${
                    isActive
                      ? "bg-yellow-400 text-slate-900 shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                  }`}
                >
                  <Icon 
                    className={`h-5 w-5 shrink-0 transition-colors ${isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"}`} 
                    strokeWidth={2.2}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>
    </>
  );
}