"use client";

import { useRouter } from "next/navigation";
import { LogOut, GraduationCap } from "lucide-react";

export default function Navbar() {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 font-sans">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
          <GraduationCap className="h-5 w-5" />
        </span>
        <span className="text-base font-extrabold text-slate-900 tracking-tight">
          Target LMS <span className="text-indigo-600 font-normal">Platform</span>
        </span>
      </div>

      <button
        onClick={logout}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
      >
        <LogOut className="h-3.5 w-3.5 text-slate-500" />
        <span>Logout</span>
      </button>
    </header>
  );
}