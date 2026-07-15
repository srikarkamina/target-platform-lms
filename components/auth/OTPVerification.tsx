"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

interface OTPVerificationProps {
  email: string;
  onVerify: (token: string) => void;
  onBack: () => void;
}

export default function OTPVerification({ email, onVerify, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(59);

  const inputRefs = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, "");
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (element.nextSibling && index < 5) {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (otp[index] === "") {
        // Focus previous input on backspace if current is empty
        if (index > 0) {
          const prevInput = inputRefs.current[index - 1];
          prevInput.focus();
          newOtp[index - 1] = "";
        }
      } else {
        newOtp[index] = "";
      }
      setOtp(newOtp);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid verification code.");
      }
      
      toast.success("Verification successful!");
      onVerify(data.token);
    } catch (err: any) {
      toast.error(err.message || "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      setResending(true);
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to resend code.");
      }

      toast.success("New code sent to your email!");
      setTimer(59);
      setOtp(new Array(6).fill(""));
      inputRefs.current[0].focus();
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-4 text-white">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={onBack}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-bold text-slate-400">Back</span>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-black text-white tracking-tight">
          Verify Security Code
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          We sent a verification code to <span className="font-bold text-slate-350">{email}</span>.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        {/* OTP Input Fields */}
        <div className="flex justify-between gap-2">
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              name="otp-input"
              maxLength={1}
              ref={(el) => {
                if (el) inputRefs.current[index] = el;
              }}
              value={data}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="w-11 h-[52px] text-center text-lg font-black rounded-[14px] border border-white/[0.15] bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 shadow-xs transition-all duration-200"
            />
          ))}
        </div>

        {/* Resend Action */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-400">Didn't receive the code?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={timer > 0 || resending}
            className="flex items-center gap-1 font-bold text-indigo-400 hover:text-indigo-350 disabled:text-slate-450 hover:underline cursor-pointer disabled:no-underline"
          >
            {resending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            <span>
              {timer > 0 ? `Resend Code in ${timer}s` : "Resend Code"}
            </span>
          </button>
        </div>

        {/* Verify Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] bg-gradient-to-r from-blue-600 to-purple-650 hover:from-blue-500 hover:to-purple-550 active:scale-[0.98] hover:-translate-y-0.5 active:translate-y-0 text-white rounded-[14px] text-sm font-bold shadow-md hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-200 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Verifying code...</span>
            </>
          ) : (
            <span>Verify & Continue</span>
          )}
        </button>
      </form>
    </div>
  );
}
