"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, GraduationCap, Menu, Search } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { toggleSidebar } from "@/lib/sidebar-state";
import SearchDialog from "@/components/search/SearchDialog";

export default function Navbar() {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Logout API logging failed:", err);
    }
    localStorage.removeItem("token");
    router.push("/login");
  };

  // Keyboard shortcut listener to open search modal (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 font-sans sticky top-0 z-30 w-full shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={toggleSidebar}
          className="lg:hidden inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight truncate">
            Target LMS <span className="hidden sm:inline text-indigo-600 font-normal">Platform</span>
          </span>
        </div>
      </div>

      {/* Desktop Search Button Trigger */}
      <div className="hidden sm:flex flex-1 max-w-sm mx-4 justify-center">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center justify-between w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-400 hover:text-slate-500 transition-all shadow-3xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 min-w-0"
        >
          <div className="flex items-center gap-2 min-w-0 text-slate-500">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="text-xs font-semibold truncate">Search catalog...</span>
          </div>
          <kbd className="inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[9px] font-bold text-slate-450 shadow-3xs shrink-0">
            Ctrl K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2.5 md:gap-4 shrink-0">
        {/* Mobile Search Icon Button Trigger */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="sm:hidden inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Open search dialog"
        >
          <Search className="h-4 w-4" />
        </button>

        <NotificationBell />
        <button
          onClick={logout}
          className="inline-flex h-11 px-3 md:px-4 items-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Logout user session"
        >
          <LogOut className="h-4 w-4 text-slate-500" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Global Search Dialog Modal */}
      <SearchDialog isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}