"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu, X } from "lucide-react";
import BookDemoButton from "./BookDemoButton";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Why Target LMS", href: "#why-us" },
    { name: "Stats", href: "#stats" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80 transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/login" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-150 group-hover:scale-105 transition-transform duration-200">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Target LMS <span className="text-indigo-600 font-normal">Platform</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white transition-colors"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <BookDemoButton size="sm" />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 md:hidden cursor-pointer"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 md:hidden animate-fade-in-up">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white transition-all"
              >
                {link.name}
              </a>
            ))}
            <hr className="my-2 border-slate-200 dark:border-slate-800" />
            <div className="flex flex-col gap-3 px-3">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="text-center text-sm font-bold text-slate-700 hover:text-indigo-600 dark:text-slate-350 dark:hover:text-white py-2"
              >
                Sign In
              </Link>
              <BookDemoButton variant="primary" size="md" className="w-full" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
