"use client";

import HeroSection from "@/components/auth/HeroSection";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-950 font-sans">
      {/* Left Side: Product Marketing Section */}
      <div className="w-full lg:w-[65%] xl:w-[70%]">
        <HeroSection />
      </div>

      {/* Right Side: Register Form Card */}
      <div className="w-full lg:w-[35%] xl:w-[30%] lg:h-screen lg:sticky lg:top-0 flex items-center justify-center p-6 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800/80">
        <div className="w-full flex justify-center py-10 lg:py-0">
          <div className="w-full max-w-[420px] rounded-3xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-100/50 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-none transition-all duration-300">
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}
