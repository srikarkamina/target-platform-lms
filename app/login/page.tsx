"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "react-hot-toast";
import { 
  ShieldCheck, 
  Users, 
  Video, 
  Award 
} from "lucide-react";
import Image from "next/image";
import LoginCard from "@/components/auth/LoginCard";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (token) {
      localStorage.setItem("token", token);
      toast.success("Successfully logged in!");
      router.push("/dashboard");
    }

    if (error) {
      toast.error(decodeURIComponent(error));
      // Clean up query params from location bar
      router.replace("/login");
    }
  }, [searchParams, router]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 overflow-x-hidden font-sans select-none py-12 lg:py-16">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <Image
          src="/login-bg.png"
          alt="Target LMS Authentication Background"
          fill
          priority
          quality={100}
          className="object-cover object-center pointer-events-none select-none"
        />
        {/* Subtle gradient overlay: linear-gradient(rgba(8,12,35,.28), rgba(8,12,35,.28)) */}
        <div 
          className="absolute inset-0 pointer-events-none z-10" 
          style={{ background: "linear-gradient(rgba(8,12,35,.28), rgba(8,12,35,.28))" }}
        />
      </div>

      {/* Main Split Layout Container */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-12 md:px-16 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
        
        {/* Left Side Content Panel (max-width: 520px, center vertically, left padding: 80px) */}
        <div className="w-full lg:w-[50%] lg:pl-[80px] flex flex-col justify-center text-left space-y-6 lg:space-y-8 animate-fade-in-up">
          <div className="max-w-[520px] space-y-6">
            
            {/* Heading: TARGET LMS */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-white">
              TARGET LMS
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl font-bold tracking-tight text-[#4FFBFF]">
              Secure Learning. Smart Management.
            </p>

            {/* Description (One short description) */}
            <p className="text-sm sm:text-base leading-relaxed max-w-md" style={{ color: "rgba(255, 255, 255, 0.92)" }}>
              A cloud-based Learning Management System designed to manage students, faculty, courses, and institute operations in one clean dashboard.
            </p>

            {/* Feature List (4 bullets) */}
            <div className="flex flex-col gap-4 pt-6 border-t border-white/10">
              {[
                { name: "Multi-Tenant SaaS Isolation", icon: ShieldCheck },
                { name: "Role-Based Portal Access", icon: Users },
                { name: "Unified Video Lessons & Quizzes", icon: Video },
                { name: "Auto-Generated Certificates", icon: Award },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={idx} 
                    className="flex items-center gap-3 text-white transition-transform duration-300 hover:translate-x-1"
                    style={{ animationDelay: `${(idx + 1) * 80}ms`, animationFillMode: "both" }}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4FFBFF]/10 text-[#4FFBFF] border border-[#4FFBFF]/20 shadow-[0_0_15px_rgba(79,251,255,0.15)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-bold tracking-wide text-white">{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Floating Login Card Container */}
        <div className="w-full lg:w-[45%] flex justify-center lg:justify-end items-center">
          <div className="w-full max-w-[430px] flex justify-center items-center">
            <LoginCard />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 border-r-2 border-indigo-500/20 mx-auto mb-4"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Loading Auth Portal...
            </p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}