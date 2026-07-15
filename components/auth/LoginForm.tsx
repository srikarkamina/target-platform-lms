"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface LoginFormProps {
  onForgotPasswordClick: () => void;
}

export default function LoginForm({ onForgotPasswordClick }: LoginFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      toast.success("Successfully logged in!");
      
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login Error:", err);
      const errMsg = err?.response?.data?.message || "Invalid email or password. Please try again.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 text-white">
      {/* Email Address */}
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
            className="w-full h-[52px] pl-10 pr-4 py-2 rounded-[14px] border border-white/[0.15] bg-white/5 text-white placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm shadow-xs transition-all duration-200"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-350 mb-1.5">
          Password
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            <Lock className="h-4.5 w-4.5" />
          </span>
          <input
            type={showPassword ? "text" : "password"}
            required
            className="w-full h-[52px] pl-10 pr-10 py-2 rounded-[14px] border border-white/[0.15] bg-white/5 text-white placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-sm shadow-xs transition-all duration-200"
            placeholder="••••••••"
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

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between text-xs pt-1">
        <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
          />
          <span>Remember me</span>
        </label>

        <button
          type="button"
          onClick={onForgotPasswordClick}
          className="font-semibold text-indigo-400 hover:text-indigo-350 hover:underline cursor-pointer transition-colors"
        >
          Forgot Password?
        </button>
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
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </button>
    </form>
  );
}
