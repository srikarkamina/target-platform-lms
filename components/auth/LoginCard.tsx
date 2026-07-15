"use client";

import { useState } from "react";

import { GraduationCap } from "lucide-react";
import LoginForm from "./LoginForm";
import GoogleLoginButton from "./GoogleLoginButton";
import ForgotPasswordForm from "./ForgotPasswordForm";
import OTPVerification from "./OTPVerification";
import ResetPasswordForm from "./ResetPasswordForm";

type CardView = "login" | "forgot-password" | "otp-verification" | "reset-password";

export default function LoginCard() {
  const [view, setView] = useState<CardView>("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  const handleForgotPasswordSubmit = (email: string) => {
    setForgotEmail(email);
    setView("otp-verification");
  };

  const handleOtpVerified = (token: string) => {
    setResetToken(token);
    setView("reset-password");
  };

  const handlePasswordResetSuccess = () => {
    setResetToken("");
    setView("login");
  };

  return (
    <div 
      className="w-full max-w-[430px] rounded-[28px] border border-white/[0.12] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-[24px] transition-all duration-300 text-white relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)] animate-float"
      style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
    >
      {/* Background glow animation */}
      <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500" />
      <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-purple-500/10 blur-2xl group-hover:bg-purple-500/20 transition-all duration-500" />

      {view === "login" && (
        <div className="space-y-6 relative z-10">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
              <GraduationCap className="h-6 w-6" />
            </span>
            <span className="text-xs font-black tracking-[0.2em] text-indigo-400 uppercase mt-4">
              TARGET
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Welcome Back
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Continue to your LMS
            </p>
          </div>

          {/* Form */}
          <LoginForm onForgotPasswordClick={() => setView("forgot-password")} />

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-white/10" />
            <span className="flex-shrink mx-4 text-slate-450 text-[10px] font-bold uppercase tracking-wider">
              Or
            </span>
            <div className="flex-grow border-t border-white/10" />
          </div>

          {/* Social login */}
          <GoogleLoginButton />

          {/* Footer sign-up action */}
          <div className="text-center text-xs text-slate-400 pt-2 border-t border-white/5 space-y-1">
            <p>Need an account?</p>
            <p className="font-semibold text-indigo-400">
              Contact your Institute Administrator
            </p>
          </div>
        </div>
      )}

      {view === "forgot-password" && (
        <ForgotPasswordForm
          onSubmit={handleForgotPasswordSubmit}
          onBackToLogin={() => setView("login")}
        />
      )}

      {view === "otp-verification" && (
        <OTPVerification
          email={forgotEmail}
          onVerify={handleOtpVerified}
          onBack={() => setView("forgot-password")}
        />
      )}

      {view === "reset-password" && (
        <ResetPasswordForm token={resetToken} onSuccess={handlePasswordResetSuccess} />
      )}
    </div>
  );
}
