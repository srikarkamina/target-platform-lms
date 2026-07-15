"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Building2, Mail, Phone, MessageSquare, Calendar, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function DemoForm() {
  const [name, setName] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [demoDate, setDemoDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          instituteName,
          email,
          phone,
          message,
          demoDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to book demo");
      }

      toast.success("Demo session requested successfully!");
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-6 animate-fade-in-up">
        <div className="flex justify-center mb-4 text-emerald-500">
          <CheckCircle2 className="h-16 w-16 stroke-[1.5]" />
        </div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
          Demo Session Booked!
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Thank you, <span className="font-bold text-slate-700 dark:text-slate-350">{name}</span>. We've received your booking request for <span className="font-bold text-slate-700 dark:text-slate-350">{instituteName}</span>. 
          Our team will email you at <span className="font-semibold text-indigo-650">{email}</span> within 24 hours to schedule the custom walkthrough session.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98]"
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Request a Personal Demo
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          See how Target LMS can scale your academy's learning experience.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Your Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <User className="h-4 w-4" />
            </span>
            <input
              type="text"
              required
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-205 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              placeholder="e.g. Amit Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        {/* Institute Name */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Institute Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Building2 className="h-4 w-4" />
            </span>
            <input
              type="text"
              required
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-205 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              placeholder="e.g. Sharma IIT-JEE Academy"
              value={instituteName}
              onChange={(e) => setInstituteName(e.target.value)}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              required
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-205 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              placeholder="you@academy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Phone className="h-4 w-4" />
            </span>
            <input
              type="tel"
              required
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-205 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              placeholder="+91 XXXXX XXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Preferred Date */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Preferred Date
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Calendar className="h-4 w-4" />
            </span>
            <input
              type="date"
              required
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-205 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              value={demoDate}
              onChange={(e) => setDemoDate(e.target.value)}
            />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Tell us about your requirements
          </label>
          <div className="relative">
            <span className="absolute top-2.5 left-3 pointer-events-none text-slate-400">
              <MessageSquare className="h-4 w-4" />
            </span>
            <textarea
              rows={3}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-205 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              placeholder="e.g. We have 500 students and require video lecture streaming and custom mock tests."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Scheduling demo...</span>
            </>
          ) : (
            <span>Request Demo Class</span>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-750 hover:underline"
        >
          Sign In
        </Link>
      </p>
    </div>
  );
}
