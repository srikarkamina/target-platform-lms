"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, User, Mail, Phone, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import GoogleLoginButton from "./GoogleLoginButton";

export default function RegisterForm() {
  const [instituteName, setInstituteName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      // Simulated register delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Account request submitted successfully!");
      setIsSuccess(true);
    } catch {
      toast.error("Failed to register. Please try again.");
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
          Request Submitted
        </h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Thank you for signing up your institute, <span className="font-bold text-slate-700 dark:text-slate-350">{instituteName}</span>! 
          We have sent a verification link to <span className="font-semibold text-indigo-650">{email}</span>. Please verify your email to activate your tenant.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.98]"
        >
          Proceed to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          Create Your Academy Tenant
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Set up your organization's learning space on Target LMS.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
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
              placeholder="e.g. Apex Coaching Classes"
              value={instituteName}
              onChange={(e) => setInstituteName(e.target.value)}
            />
          </div>
        </div>

        {/* Owner Name */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Owner Name
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <User className="h-4 w-4" />
            </span>
            <input
              type="text"
              required
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-205 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              placeholder="e.g. Rajesh Kumar"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
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
              placeholder="owner@institute.com"
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

        {/* Passwords side-by-side on desktop */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-205 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                placeholder="Min. 8 chars"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-205 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs shadow-xs dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
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
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
        <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          Or
        </span>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
      </div>

      <GoogleLoginButton />

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
