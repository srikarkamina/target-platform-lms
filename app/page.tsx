import Image from "next/image";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-base font-extrabold text-slate-900 tracking-tight">
            Target LMS <span className="text-indigo-600 font-normal">Platform</span>
          </span>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
        >
          Sign In
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center py-20 px-6 max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <Image
            src="/next.svg"
            alt="Next.js logo"
            width={120}
            height={25}
            priority
            className="mx-auto"
          />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl max-w-2xl leading-tight">
          Welcome to the Next-Generation Target LMS
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">
          Access your personalized dashboard, manage video lessons, upload materials, track your progress, and view courses in a single consolidated interface.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-8 text-sm font-bold text-white transition-all shadow-md shadow-indigo-100"
          >
            Enter Dashboard
          </Link>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-8 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
