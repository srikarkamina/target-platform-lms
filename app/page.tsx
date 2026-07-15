"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Video, 
  FileText, 
  Award, 
  FileCheck, 
  BarChart3, 
  TrendingUp, 
  Bell, 
  Cloud, 
  ShieldCheck,
  Lock,
  Zap,
  Sparkles,
  Server,
  Globe
} from "lucide-react";

export default function Home() {
  useEffect(() => {
    let active = true;
    
    // Find all parallax background elements in the DOM
    const bgElements = document.querySelectorAll(".landing-parallax-bg");
    
    const handleScroll = () => {
      if (!active) return;
      const scrolled = window.scrollY;
      bgElements.forEach((node) => {
        const el = node as HTMLDivElement;
        const rect = el.getBoundingClientRect();
        // Only run transform if the element is near the viewport
        const visible = rect.top < window.innerHeight && rect.bottom > 0;
        if (visible) {
          const elementTop = rect.top + scrolled;
          const offset = (scrolled - elementTop) * 0.08;
          el.style.transform = `translate3d(0, ${offset}px, 0)`;
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      active = false;
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-250">
      
      {/* 1. Hero Section */}
      <section className="relative min-h-screen w-full flex flex-col bg-[#050819] overflow-hidden select-none">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0 h-full w-full">
          <Image
            src="/landing-bg-clean.png"
            alt="Target LMS Welcome Page Background"
            fill
            priority
            quality={100}
            className="object-contain object-right pointer-events-none select-none"
          />
          {/* Subtle dark overlay: rgba(5,8,25,0.20) */}
          <div className="absolute inset-0 bg-[#050819]/20 pointer-events-none" />
        </div>

        {/* Minimal Nav Header */}
        <header className="relative z-30 w-full max-w-7xl mx-auto px-6 sm:px-12 md:px-16 lg:px-[80px] h-24 flex items-center justify-between">
          {/* Left Side: Logo */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30">
              <GraduationCap className="h-6 w-6" />
            </span>
            <span className="text-lg font-black tracking-wider text-white">
              TARGET LMS
            </span>
          </div>

          {/* Right Side: Login & Get Started */}
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-sm font-bold text-white hover:text-[#2AD4FF] transition-colors cursor-pointer"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#19E68C] to-[#2AD4FF] hover:brightness-110 px-5 text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* Hero Content Layer */}
        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-12 md:px-16 lg:pl-[80px] lg:pr-[80px] flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-[80px] pb-16 lg:pb-0">
          {/* Left Column (42% space on desktop) */}
          <div className="w-full lg:w-[42%] flex flex-col justify-center py-8 text-left relative z-20">
            <div className="max-w-[520px] flex flex-col animate-fade-in-up">
              
              {/* Badge */}
              <div className="self-start inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/8 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#8AE8FF] animate-pulse shadow-[0_0_8px_rgba(138,232,255,0.7)]" />
                <span className="text-[10px] sm:text-[11px] font-black tracking-[1.5px] text-[#8AE8FF] uppercase">
                  TARGET LEARNING MANAGEMENT SYSTEM
                </span>
              </div>

              {/* Heading (32px below Badge) */}
              <h1 className="mt-[32px] text-[38px] md:text-[48px] lg:text-[64px] font-black tracking-tight leading-none bg-gradient-to-r from-[#19E68C] via-[#2AD4FF] to-[#7B5CFF] bg-clip-text text-transparent filter drop-shadow-[0_2px_12px_rgba(42,212,255,0.25)]">
                TARGET LMS
              </h1>

              {/* Subheading (24px below Heading) */}
              <h2 className="mt-[24px] text-2xl sm:text-3xl lg:text-[32px] font-bold tracking-tight text-white leading-tight">
                Enterprise SaaS Platform<br />for Modern Educational Institutions
              </h2>

              {/* Description (28px below Subheading) */}
              <p className="mt-[28px] text-[16px] md:text-[17px] lg:text-[18px] leading-[1.8] max-w-[470px]" style={{ color: "rgba(255,255,255,0.9)" }}>
                TARGET LMS is a cloud-based multi-tenant Learning Management System built for coaching institutes, schools, colleges and universities. Manage admissions, students, faculty, online classes, live lectures, assessments, assignments, certificates, attendance, reports and institute operations from one intelligent platform.
              </p>

              {/* Action Buttons (36px below Description) */}
              <div className="mt-[36px] flex flex-wrap gap-[20px]">
                <Link
                  href="/login"
                  className="inline-flex h-[52px] items-center justify-center rounded-[14px] bg-gradient-to-r from-[#19E68C] to-[#2AD4FF] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 px-8 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all duration-200 cursor-pointer"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-[52px] items-center justify-center rounded-[14px] border border-white/12 bg-white/5 hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0 px-8 text-sm font-bold text-white transition-all duration-200 cursor-pointer"
                >
                  Login
                </Link>
              </div>

              {/* 4 Feature Highlights (40px below Buttons) */}
              <div className="mt-[40px] flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:flex-wrap items-start lg:items-center gap-x-6 gap-y-3 pt-8 border-t border-white/5">
                {[
                  "Multi-Tenant SaaS",
                  "Student Management",
                  "Faculty Portal",
                  "Analytics & Reports"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-white">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(42,212,255,0.15)] flex-shrink-0">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-xs font-bold text-white tracking-wide">{item}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Right Column (58% space on desktop, transparent placeholder to show background artwork) */}
          <div className="w-full lg:w-[58%] h-[45vh] lg:h-full pointer-events-none" />
        </div>
      </section>

      {/* 2. Why TARGET LMS - Subtle Gradient 1 */}
      <section className="relative py-24 sm:py-32 border-t border-white/5 bg-gradient-to-b from-[#02040d] to-[#040717] overflow-hidden">
        {/* Decorative Background Artwork (Target Symbol) - Right Center - Variant A (Full) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="landing-parallax-bg absolute top-1/2 -translate-y-1/2 -right-[96px] md:-right-[160px] lg:-right-[200px] w-[240px] h-[240px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] opacity-[0.20] md:opacity-[0.26] lg:opacity-[0.30] transition-opacity duration-300 z-0">
            {/* Depth/Rotation Layer */}
            <div className="w-full h-full rotate-[-8deg] scale-100">
              {/* Slow Float & Glow Layer */}
              <div className="w-full h-full animate-slow-float relative filter drop-shadow-[0_0_30px_rgba(90,120,255,0.18)]">
                <Image
                  src="/target-symbol.jpg"
                  alt="Target Symbol Decorative Background - Full target with arrow"
                  fill
                  sizes="(max-width: 768px) 220px, (max-width: 1024px) 400px, 500px"
                  className="object-contain object-center select-none"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
          {/* Dark overlay: rgba(5,8,25,0.35) */}
          <div className="absolute inset-0 bg-[#050819]/35 z-10 pointer-events-none" />
        </div>

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-10" />
        {/* Radial glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none z-10" />

        <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-12 md:px-16">
          <div className="max-w-3xl space-y-4">
            <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">
              Operational Efficiency
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Why institutes run on <span className="bg-gradient-to-r from-[#22C55E] via-[#10B981] to-[#14B8A6] bg-clip-text text-transparent">TARGET LMS</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
              Managing operations across multiple academic departments, batches, and student lists is traditionally complex. TARGET LMS bridges this gap by unifying student tracking, video streaming, assessment grading, and automated certificate generation under a secure, lightning-fast multi-tenant architecture designed to scale.
            </p>
          </div>
        </div>
      </section>

      {/* Centered Glowing Separator 1 */}
      <div className="w-full flex justify-center bg-[#040717] py-0 relative z-20">
        <div className="h-[1px] w-[80%] bg-gradient-to-r from-transparent via-[rgba(80,120,255,0.15)] to-transparent" />
      </div>

      {/* 3. Features Grid (12 Cards) - Subtle Gradient 2 */}
      <section className="relative py-20 bg-gradient-to-b from-[#040717] to-[#030612] border-t border-white/5 overflow-hidden">
        {/* Decorative Background Artwork (Target Symbol) - Left Center - Variant B (Zoomed outer rings) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="landing-parallax-bg absolute top-1/2 -translate-y-1/2 -left-[96px] md:-left-[160px] lg:-left-[200px] w-[240px] h-[240px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] opacity-[0.18] md:opacity-[0.26] lg:opacity-[0.30] transition-opacity duration-300 z-0">
            {/* Depth/Rotation Layer */}
            <div className="w-full h-full rotate-[8deg]">
              {/* Slow Float & Glow Layer */}
              <div className="w-full h-full animate-slow-float relative filter drop-shadow-[0_0_30px_rgba(90,120,255,0.18)]">
                {/* Variant B CSS scale & origin crop (Focuses on outer rings) */}
                <div className="w-full h-full scale-[1.8] md:scale-[2.2] lg:scale-[2.4] origin-bottom-left relative">
                  <Image
                    src="/target-symbol.jpg"
                    alt="Target Symbol Decorative Background - Zoomed outer rings"
                    fill
                    sizes="(max-width: 768px) 220px, (max-width: 1024px) 400px, 500px"
                    className="object-contain select-none"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Dark overlay: rgba(5,8,25,0.35) */}
          <div className="absolute inset-0 bg-[#050819]/35 z-10 pointer-events-none" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-12 md:px-16 space-y-16">
          <div className="text-left space-y-2">
            <span className="text-xs font-black tracking-widest text-emerald-455 uppercase">
              Features
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Designed to power education at any scale
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[
              { title: "Course Management", desc: "Build modular courses with lessons, categories, description fields, and files.", icon: BookOpen },
              { title: "Faculty Management", desc: "Provision, manage, and assign faculty mentors to specific batches.", icon: GraduationCap },
              { title: "Student Management", desc: "Oversee enrollments, batch assignments, user history, and profiles.", icon: Users },
              { title: "Video Learning", desc: "Upload and stream high-quality video lessons securely inside the dashboard.", icon: Video },
              { title: "Assignments", desc: "Publish assignments, collect student files, and grade submissions online.", icon: FileText },
              { title: "Quizzes", desc: "Configure custom question banks, set strict timers, and log detailed mock tests.", icon: Award },
              { title: "Certificates", desc: "Design certificate templates and auto-generate credentials upon completion.", icon: FileCheck },
              { title: "Reports", desc: "Export automated performance records, grading summaries, and audit lists.", icon: BarChart3 },
              { title: "Analytics", desc: "Visualize progress tracking, video completion statistics, and quiz metrics.", icon: TrendingUp },
              { title: "Notifications", desc: "Broadcast announcements, email confirmations, and urgent system alerts.", icon: Bell },
              { title: "Cloud SaaS", desc: "Multi-tenant isolation keeps data completely private across multiple institutes.", icon: Cloud },
              { title: "Role Based Access", desc: "Pre-configured roles (Super Admin, Admin, Faculty, Student) ensure clear guardrails.", icon: ShieldCheck },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={idx}
                  className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-xs hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 overflow-hidden z-10"
                >
                  {/* Subtle hover glow accent */}
                  <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500/5 blur-xl transition-all duration-500" />
                  
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-450 border border-white/5 group-hover:border-emerald-500/20 shadow-xs group-hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300 mb-5">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h4 className="text-sm font-bold text-white tracking-tight mb-2 group-hover:text-emerald-355 transition-colors">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Centered Glowing Separator 2 */}
      <div className="w-full flex justify-center bg-[#030612] py-0 relative z-20">
        <div className="h-[1px] w-[80%] bg-gradient-to-r from-transparent via-[rgba(80,120,255,0.15)] to-transparent" />
      </div>

      {/* 4. Platform Benefits - Subtle Gradient 3 */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#030612] to-[#02050f] border-t border-white/5 overflow-hidden">
        {/* Decorative Background Artwork (Target Symbol) - Bottom Right - Variant C (Bullseye center with arrow) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="landing-parallax-bg absolute -bottom-[96px] md:-bottom-[160px] lg:-bottom-[200px] -right-[96px] md:-right-[160px] lg:-right-[200px] w-[240px] h-[240px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] opacity-[0.22] md:opacity-[0.26] lg:opacity-[0.30] transition-opacity duration-300 z-0">
            {/* Depth/Rotation Layer */}
            <div className="w-full h-full rotate-[-8deg]">
              {/* Slow Float & Glow Layer */}
              <div className="w-full h-full animate-slow-float relative filter drop-shadow-[0_0_30px_rgba(90,120,255,0.18)]">
                {/* Variant C CSS scale & origin crop (Focuses on arrow/bullseye) */}
                <div className="w-full h-full scale-[1.4] md:scale-[1.6] lg:scale-[1.8] origin-center relative">
                  <Image
                    src="/target-symbol.jpg"
                    alt="Target Symbol Decorative Background - Bullseye center with arrow"
                    fill
                    sizes="(max-width: 768px) 220px, (max-width: 1024px) 400px, 500px"
                    className="object-contain select-none"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Dark overlay: rgba(5,8,25,0.35) */}
          <div className="absolute inset-0 bg-[#050819]/35 z-10 pointer-events-none" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-12 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">
              Infrastructure
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Enterprise architecture. Built for reliability.
            </h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              We leverage modern serverless and cloud technologies to offer an education platform that is secure, fast, and completely scale-tolerant. From custom domain support to transaction isolation, the system handles heavy traffic seamlessly.
            </p>
          </div>

          <div className="space-y-5 z-10">
            {[
              { title: "Highly Secure", desc: "Data isolation, JWT encryption, and rigid role gates block unauthorized lookups.", icon: Lock },
              { title: "Blazing Fast", desc: "Caching, optimized database indexing, and CDN-served media load instantly.", icon: Zap },
              { title: "Infinite Scalability", desc: "Easily scales from a single small batch to over 50,000+ active students.", icon: Sparkles },
              { title: "100% Cloud Based", desc: "No local hardware is required. Launch operations instantly via cloud setup.", icon: Server },
              { title: "Enterprise Ready", desc: "Detailed audit logs, security tracking, and customizable portal features.", icon: Globe },
            ].map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="flex gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-emerald-455 border border-white/5 flex-shrink-0 mt-0.5 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h5 className="text-xs font-extrabold tracking-tight text-white mb-1">{benefit.title}</h5>
                    <p className="text-xs text-slate-400 leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Centered Glowing Separator 3 */}
      <div className="w-full flex justify-center bg-[#02050f] py-0 relative z-20">
        <div className="h-[1px] w-[80%] bg-gradient-to-r from-transparent via-[rgba(80,120,255,0.15)] to-transparent" />
      </div>

      {/* 5. Statistics Section - Subtle Gradient 4 */}
      <section className="relative py-20 bg-gradient-to-b from-[#02050f] to-[#05091c] border-t border-white/5 overflow-hidden">
        {/* Decorative Background Artwork (Target Symbol) - Top Left - Variant A (Full target with arrow) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="landing-parallax-bg absolute -top-[96px] md:-top-[160px] lg:-top-[200px] -left-[96px] md:-left-[160px] lg:-left-[200px] w-[240px] h-[240px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] opacity-[0.25] md:opacity-[0.26] lg:opacity-[0.30] transition-opacity duration-300 z-0">
            {/* Depth/Rotation Layer */}
            <div className="w-full h-full rotate-[8deg] scale-100">
              {/* Slow Float & Glow Layer */}
              <div className="w-full h-full animate-slow-float relative filter drop-shadow-[0_0_30px_rgba(90,120,255,0.18)]">
                <Image
                  src="/target-symbol.jpg"
                  alt="Target Symbol Decorative Background - Full target with arrow"
                  fill
                  sizes="(max-width: 768px) 220px, (max-width: 1024px) 400px, 500px"
                  className="object-contain object-center select-none"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
          {/* Dark overlay: rgba(5,8,25,0.35) */}
          <div className="absolute inset-0 bg-[#050819]/35 z-10 pointer-events-none" />
        </div>

        {/* Ambient background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-emerald-500/5 blur-[90px] pointer-events-none z-10" />

        <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-12 md:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            {[
              { value: "100+", label: "Institutes Managed" },
              { value: "5000+", label: "Active Students" },
              { value: "500+", label: "Faculty Mentors" },
              { value: "10000+", label: "Published Courses" },
            ].map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <span className="block text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-[#22C55E] via-[#10B981] to-[#14B8A6] bg-clip-text text-transparent filter drop-shadow-[0_2px_8px_rgba(34,197,94,0.15)] leading-none">
                  {stat.value}
                </span>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Centered Glowing Separator 4 */}
      <div className="w-full flex justify-center bg-[#05091c] py-0 relative z-20">
        <div className="h-[1px] w-[80%] bg-gradient-to-r from-transparent via-[rgba(80,120,255,0.15)] to-transparent" />
      </div>

      {/* 6. Call To Action (CTA) - Subtle Gradient 5 */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#05091c] to-[#02040d] border-t border-white/5 overflow-hidden">
        {/* Decorative Background Artwork (Target Symbol) - Right - Variant B (Zoomed outer rings) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="landing-parallax-bg absolute top-1/2 -translate-y-1/2 -right-[96px] md:-right-[160px] lg:-right-[200px] w-[240px] h-[240px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] opacity-[0.20] md:opacity-[0.26] lg:opacity-[0.30] transition-opacity duration-300 z-0">
            {/* Depth/Rotation Layer */}
            <div className="w-full h-full rotate-[-8deg]">
              {/* Slow Float & Glow Layer */}
              <div className="w-full h-full animate-slow-float relative filter drop-shadow-[0_0_30px_rgba(90,120,255,0.18)]">
                {/* Variant B Crop (Focuses on outer rings) */}
                <div className="w-full h-full scale-[1.8] md:scale-[2.2] lg:scale-[2.4] origin-bottom-left relative">
                  <Image
                    src="/target-symbol.jpg"
                    alt="Target Symbol Decorative Background - Zoomed outer rings"
                    fill
                    sizes="(max-width: 768px) 220px, (max-width: 1024px) 400px, 500px"
                    className="object-contain select-none"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Dark overlay: rgba(5,8,25,0.35) */}
          <div className="absolute inset-0 bg-[#050819]/35 z-10 pointer-events-none" />
        </div>

        <div className="relative z-20 max-w-5xl mx-auto px-6 text-center">
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-12 sm:p-16 overflow-hidden shadow-2xl backdrop-blur-xs">
            {/* Soft backdrop blurs */}
            <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

            <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 relative z-10">
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
                Ready to transform your institute?
              </h3>
              <p className="text-sm sm:text-base text-slate-355 leading-relaxed max-w-xl mx-auto">
                Join modern educational centers leveraging TARGET LMS to streamline scheduling, host video courses, deliver quizzes, and track success.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/login"
                  className="inline-flex h-[52px] items-center justify-center rounded-[14px] bg-gradient-to-r from-[#22C55E] via-[#10B981] to-[#14B8A6] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 px-8 text-sm font-bold text-slate-950 shadow-md transition-all duration-200 cursor-pointer"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-[52px] items-center justify-center rounded-[14px] border border-white/12 bg-white/5 hover:bg-white/10 hover:-translate-y-0.5 active:translate-y-0 px-8 text-sm font-bold text-white transition-all duration-200 cursor-pointer"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Centered Glowing Separator 5 */}
      <div className="w-full flex justify-center bg-[#02040d] py-0 relative z-20">
        <div className="h-[1px] w-[80%] bg-gradient-to-r from-transparent via-[rgba(80,120,255,0.15)] to-transparent" />
      </div>

      {/* 7. Footer - Subtle Gradient 6 */}
      <footer className="relative border-t border-white/5 bg-gradient-to-b from-[#02040d] to-[#010206] py-12 overflow-hidden">
        {/* Decorative Background Artwork (Target Symbol) - Left - Variant C (Bullseye center with arrow) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="landing-parallax-bg absolute top-1/2 -translate-y-1/2 -left-[96px] md:-left-[160px] lg:-left-[200px] w-[240px] h-[240px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] opacity-[0.18] md:opacity-[0.26] lg:opacity-[0.30] transition-opacity duration-300 z-0">
            {/* Depth/Rotation Layer */}
            <div className="w-full h-full rotate-[8deg]">
              {/* Slow Float & Glow Layer */}
              <div className="w-full h-full animate-slow-float relative filter drop-shadow-[0_0_30px_rgba(90,120,255,0.18)]">
                {/* Variant C Crop (Focuses on center bullseye) */}
                <div className="w-full h-full scale-[1.4] md:scale-[1.6] lg:scale-[1.8] origin-center relative">
                  <Image
                    src="/target-symbol.jpg"
                    alt="Target Symbol Decorative Background - Bullseye center with arrow"
                    fill
                    sizes="(max-width: 768px) 220px, (max-width: 1024px) 400px, 500px"
                    className="object-contain select-none"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Dark overlay: rgba(5,8,25,0.35) */}
          <div className="absolute inset-0 bg-[#050819]/35 z-10 pointer-events-none" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-12 md:px-16 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500 font-semibold">
          <div className="text-center sm:text-left space-y-1">
            <span className="text-sm font-black text-white tracking-wider">TARGET LMS</span>
            <p className="text-[10px]">Cloud-Based Enterprise Learning Management Platform</p>
          </div>
          <div>
            <span>© {new Date().getFullYear()} Target LMS. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
