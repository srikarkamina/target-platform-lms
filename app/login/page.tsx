"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { GraduationCap, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      console.log("Login clicked");

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      console.log("API Response:", res.data);
      localStorage.setItem("token", res.data.token);
      console.log("Token stored successfully");
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login Error:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
            <GraduationCap className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-4">
            Welcome Back
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to access your target learning space
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-400 shadow-xs"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900 placeholder-slate-400 shadow-xs"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}