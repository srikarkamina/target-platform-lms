"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface ResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
}

export default function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
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
      
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }
      
      toast.success("Password reset successfully!");
      setIsSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-6 text-white">
        <div className="flex justify-center mb-4 text-emerald-500">
          <CheckCircle2 className="h-16 w-16 stroke-[1.5]" />
        </div>
        <h2 className="text-lg font-black text-white tracking-tight">
          Reset Successful
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
          Your account password has been updated. You can now log in using your new credentials.
        </p>
        <button
          onClick={onSuccess}
          className="mt-6 w-full h-[52px] bg-gradient-to-r from-blue-600 to-purple-650 hover:from-blue-500 hover:to-purple-550 active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0 text-white rounded-[14px] text-sm font-bold shadow-md hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer flex items-center justify-center"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-white">
      <div className="mb-4">
        <h2 className="text-lg font-black text-white tracking-tight">
          Create New Password
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Please enter and confirm your new secure account password.
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
        {/* New Password */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Lock className="h-4.5 w-4.5" />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              required
              className="w-full h-[52px] pl-10 pr-10 py-2 rounded-[14px] border border-white/[0.15] bg-white/5 text-white placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm shadow-xs transition-all duration-200"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Lock className="h-4.5 w-4.5" />
            </span>
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              className="w-full h-[52px] pl-10 pr-10 py-2 rounded-[14px] border border-white/[0.15] bg-white/5 text-white placeholder-slate-455 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm shadow-xs transition-all duration-200"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] bg-gradient-to-r from-blue-600 to-purple-650 hover:from-blue-500 hover:to-purple-550 active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0 text-white rounded-[14px] text-sm font-bold shadow-md hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Resetting password...</span>
            </>
          ) : (
            <span>Reset Password</span>
          )}
        </button>
      </form>
    </div>
  );
}
