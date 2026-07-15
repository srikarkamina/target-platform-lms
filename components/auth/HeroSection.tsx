"use client";

import Link from "next/link";
import { Sparkles, CheckCircle2, Heart, ArrowRight } from "lucide-react";
import Navbar from "./Navbar";
import FeatureGrid from "./FeatureGrid";
import TrustSection from "./TrustSection";
import StatisticsSection from "./StatisticsSection";
import BookDemoButton from "./BookDemoButton";

export default function HeroSection() {
  const whyChooseUs = [
    "Cloud Based - Access from anywhere, anytime",
    "Blazing Fast - Optimized query speed & page loads",
    "Highly Secure - Encrypted connections & isolation",
    "Fully Responsive - Perfect layout on mobile & desktop",
    "Multi Tenant - Custom domains & isolated brandings",
    "Easy to Use - Intuitive design with zero training",
    "Scalable - Scales from 50 to 50,000+ active students",
    "Built for Indian Coaching - Optimized for mock exams",
  ];

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Dynamic Background Blurs */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Animated Blob 1 */}
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[120px] animate-pulse duration-10000" />
        {/* Animated Blob 2 */}
        <div className="absolute top-[30%] -right-40 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[100px] animate-pulse duration-7000" />
        {/* Animated Blob 3 */}
        <div className="absolute -bottom-40 left-[20%] h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse duration-8000" />
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar */}
        <Navbar />

        {/* Hero Body */}
        <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center">
          {/* Main Hero Header */}
          <div className="max-w-3xl mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400 mb-6 backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Generation LMS Platform</span>
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1] mb-6">
              Everything Your Institute Needs <br />
              <span className="bg-gradient-to-r from-indigo-500 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                In One Platform.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-350 leading-relaxed max-w-2xl mb-8">
              Target LMS is a complete Learning Management System built for coaching institutes, academies, colleges, and training organizations. Manage students, faculty, online courses, attendance, mock tests, assignments, certificates, reports, and analytics from one centralized platform.
            </p>

            <div className="flex flex-wrap gap-4">
              <BookDemoButton size="lg" />
              <a
                href="#features"
                className="inline-flex items-center justify-center font-semibold rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-850 hover:border-slate-650 text-slate-200 px-6 py-3 text-base transition-all duration-200 hover:-translate-y-0.5 cursor-pointer gap-2"
              >
                <span>Explore Features</span>
                <ArrowRight className="h-4 w-4 text-slate-450" />
              </a>
            </div>
          </div>

          {/* Statistics Grid */}
          <StatisticsSection />

          {/* Core Feature Grid */}
          <FeatureGrid />

          {/* Why Target LMS */}
          <section id="why-us" className="py-12 border-t border-slate-200/60 dark:border-slate-800/40 scroll-mt-20">
            <div className="text-left mb-8">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl tracking-tight">
                Why Choose Target LMS
              </h2>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                Streamline operations and elevate user experience with state-of-the-art educational tech.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {whyChooseUs.map((item, index) => {
                const [title, desc] = item.split(" - ");
                return (
                  <div
                    key={index}
                    className="flex gap-3 rounded-2xl border border-slate-800/50 bg-slate-900/40 p-5 items-start hover:border-slate-700 transition-colors"
                  >
                    <CheckCircle2 className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight">{title}</h4>
                      <p className="mt-1 text-xs text-slate-400 leading-normal">{desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Trust Section */}
          <TrustSection />
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-slate-800 bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="text-sm font-extrabold tracking-tight text-white">
                Target LMS
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Made for modern Coaching Institutes & Academies.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-semibold text-slate-450">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/support" className="hover:text-white transition-colors">Support Portal</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
              <Link href="/demo" className="hover:text-indigo-400 text-indigo-500 transition-colors">Book a Demo</Link>
            </div>

            <div className="text-xs text-slate-600 flex items-center gap-1">
              <span>© {new Date().getFullYear()} Target LMS. Crafted with</span>
              <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
