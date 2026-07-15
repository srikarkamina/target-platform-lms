"use client";

import { useState } from "react";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => void;
  onBackToLogin: () => void;
}

export default function ForgotPasswordForm({ onSubmit, onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send verification code.");
      }
      
      toast.success(data.message || "Verification code sent to your email!");
      onSubmit(email);
    } catch (err: any) {
      toast.error(err.message || "Failed to send code. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-white">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={onBackToLogin}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-bold text-slate-400">Back to Login</span>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-black text-white tracking-tight">
          Forgot Password
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Enter your registered email address and we will send you a verification code.
        </p>
      </div>

      <form onSubmit={handleSendOTP} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-350 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Mail className="h-4.5 w-4.5" />
            </span>
            <input
              type="email"
              required
              className="w-full h-[52px] pl-10 pr-4 py-2 rounded-[14px] border border-white/[0.15] bg-white/5 text-white placeholder-slate-455 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm shadow-xs transition-all duration-200"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] bg-gradient-to-r from-blue-600 to-purple-655 hover:from-blue-500 hover:to-purple-550 active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0 text-white rounded-[14px] text-sm font-bold shadow-md hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sending code...</span>
            </>
          ) : (
            <span>Send Verification Code</span>
          )}
        </button>
      </form>
    </div>
  );
}
