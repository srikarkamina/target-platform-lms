"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  MessageSquare,
  Sparkles,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function RequestAccessPage() {
  const [formData, setFormData] = useState({
    instituteName: "",
    ownerName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    country: "",
    website: "",
    requestedPlan: "BASIC",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validations
    if (
      !formData.instituteName.trim() ||
      !formData.ownerName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.city.trim() ||
      !formData.state.trim() ||
      !formData.country.trim()
    ) {
      toast.error("Please fill in all required fields marked with an asterisk (*).");
      return;
    }

    if (!formData.email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit request.");
      }

      setSuccess(true);
      setRequestNumber(data.request?.requestNumber || "AR-PENDING");
      toast.success("Request submitted successfully!");
    } catch (err: any) {
      toast.error(err.message || "An error occurred during submission. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#312e81_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_75%,#1e1b4b_0%,transparent_50%)]" />

        <div className="relative w-full max-w-xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 text-center shadow-2xl animate-fade-in">
          <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6">
            <CheckCircle className="w-12 h-12" />
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">
            Request Logged Successfully
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Thank you for requesting access to Target LMS. A confirmation receipt email has been dispatched to{" "}
            <span className="text-indigo-400 font-semibold">{formData.email}</span>.
          </p>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 mb-8">
            <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Tracking Reference Number
            </span>
            <span className="text-2xl font-black text-indigo-400 letter-spacing-1 font-mono">
              {requestNumber}
            </span>
          </div>

          <div className="text-slate-400 text-xs leading-relaxed mb-8 max-w-md mx-auto">
            Our Super Admin review team is currently validating your organization details. We will notify you by email as soon as your environment is approved and provisioned.
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 justify-center w-full px-6 py-3 font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-750 transition-all shadow-lg shadow-indigo-600/20"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative font-sans overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,#312e81_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_90%,#1e1b4b_0%,transparent_50%)] pointer-events-none" />

      <div className="relative w-full max-w-3xl my-8">
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center gap-2 text-indigo-400 text-sm font-semibold hover:text-indigo-300 transition-colors mb-4 group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to portal login
          </Link>
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30 text-white font-black text-2xl">
              🎓
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-2">
            Target LMS Access Request
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Target LMS is an enterprise, multi-tenant academic platform. Submit your registration details below to apply for a dedicated institute sandbox environment.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6"
        >
          <div className="border-b border-slate-800 pb-4 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> General Organization Details
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Institute Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Institute Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="instituteName"
                  value={formData.instituteName}
                  onChange={handleChange}
                  placeholder="e.g. Target Academy"
                  required
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-600 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Owner Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Owner / Contact Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  required
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-600 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Business Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. contact@targetlms.com"
                  required
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-600 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contact Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +1 (555) 000-0000"
                  required
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-600 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="border-b border-slate-800 pb-4 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Geographic Location & Details
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
                required
                className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-600 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                State / Province <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
                required
                className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-600 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Country <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Country"
                required
                className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-600 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="border-b border-slate-800 pb-4 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Subscription Plan Details
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Website URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Website URL (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-600 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Requested Plan */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Subscription Plan <span className="text-rose-500">*</span>
              </label>
              <select
                name="requestedPlan"
                value={formData.requestedPlan}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="FREE">Free Tier (Sandbox, Limit 10 Students)</option>
                <option value="BASIC">Basic Plan (Scale Academy, Limit 100 Students)</option>
                <option value="PROFESSIONAL">Professional Tier (High volume, Limit 500 Students)</option>
                <option value="ENTERPRISE">Enterprise Tier (Unlimited Quotas, Custom Storage)</option>
              </select>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Custom Requirements / Message (Optional)
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3.5 flex items-start pointer-events-none text-slate-500">
                <MessageSquare className="w-4 h-4" />
              </div>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={3}
                placeholder="Briefly state your purpose, user counts, or billing details..."
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-600 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center gap-2 justify-center py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-750 focus:outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Logging Request...
              </>
            ) : (
              "Submit Access Request"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
