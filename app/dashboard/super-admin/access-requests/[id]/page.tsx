"use client";

import React, { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Building,
  User,
  Globe,
  MessageSquare,
  Loader2,
  AlertTriangle,
  History,
  Info,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface AccessRequest {
  id: string;
  requestNumber: string;
  instituteName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  website: string | null;
  requestedPlan: string;
  message: string | null;
  status: string;
  reviewNotes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function AccessRequestDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const [request, setRequest] = useState<AccessRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog States
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Approve Dialog Fields
  const [approvePlan, setApprovePlan] = useState("");
  const [trialDuration, setTrialDuration] = useState("30");
  const [createInst, setCreateInst] = useState(true);
  const [createAdmin, setCreateAdmin] = useState(true);
  const [generatePass, setGeneratePass] = useState(true);
  const [sendWelcome, setSendWelcome] = useState(true);

  // Reject Dialog Fields
  const [rejectReason, setRejectReason] = useState("Duplicate Institute");
  const [rejectNotes, setRejectNotes] = useState("");

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/super-admin/access-requests/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load details.");
      }

      setRequest(data);
      setApprovePlan(data.requestedPlan);
    } catch (err: any) {
      toast.error(err.message || "Error reading request details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleStatusChange = async (targetStatus: string, reviewNotes?: string) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/super-admin/access-requests/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: targetStatus, reviewNotes }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update request status.");
      }

      toast.success(data.message || `Request moved to ${targetStatus}`);
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message || "Failed to change status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveOnboard = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/super-admin/access-requests/${id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: approvePlan,
          trialDurationDays: trialDuration,
          generateTempPassword: generatePass,
          sendWelcomeEmail: sendWelcome,
          createInstitute: createInst,
          createInstituteAdmin: createAdmin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Approve onboarding failed.");
      }

      toast.success("Institute onboarding completed successfully!");
      setShowApproveDialog(false);
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message || "Onboarding approval failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOnboard = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/super-admin/access-requests/${id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: rejectReason,
          notes: rejectNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Rejection update failed.");
      }

      toast.success("Access request successfully rejected.");
      setShowRejectDialog(false);
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message || "Rejection action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case "SUBMITTED":
        return <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">Submitted</span>;
      case "UNDER_REVIEW":
        return <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">Under Review</span>;
      case "APPROVED":
        return <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">Approved</span>;
      case "ONBOARDING":
        return <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">Onboarding</span>;
      case "ACTIVE":
        return <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Active / Completed</span>;
      case "REJECTED":
        return <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">Rejected</span>;
      case "CANCELLED":
        return <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400">Cancelled</span>;
      default:
        return <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400">{statusStr}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-950 font-sans text-slate-200">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <div className="flex-1 flex items-center justify-center bg-slate-950">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto mb-3" />
              <p className="text-sm text-slate-450 font-semibold">Loading access request details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-screen bg-slate-950 font-sans text-slate-200">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
            <div className="text-center bg-slate-900/30 border border-slate-800 p-8 rounded-2xl max-w-sm">
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Request Not Found</h3>
              <p className="text-slate-400 text-sm mb-6">
                The access request ID you are trying to view does not exist or has been deleted.
              </p>
              <Link href="/dashboard/super-admin/access-requests" className="px-4 py-2 bg-slate-850 hover:bg-slate-750 text-xs font-semibold text-white rounded-xl border border-slate-700 transition-colors">
                Back to Requests List
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPendingReview = request.status === "SUBMITTED";
  const isUnderReview = request.status === "UNDER_REVIEW";
  const isTerminal = ["ACTIVE", "REJECTED", "CANCELLED"].includes(request.status);

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b_0%,transparent_50%)] pointer-events-none" />

          <div className="relative max-w-5xl mx-auto space-y-6">
            {/* Header / Back Link */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/super-admin/access-requests"
                  className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-850 transition-colors text-slate-400 hover:text-slate-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      {request.requestNumber}
                    </span>
                    {getStatusBadge(request.status)}
                  </div>
                  <h1 className="text-2xl font-extrabold text-white mt-1">
                    {request.instituteName}
                  </h1>
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div className="flex gap-2">
                {isPendingReview && (
                  <button
                    onClick={() => handleStatusChange("UNDER_REVIEW")}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-slate-950 hover:text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Move to Review
                  </button>
                )}

                {isUnderReview && (
                  <>
                    <button
                      onClick={() => setShowApproveDialog(true)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Approve Onboarding
                    </button>
                    <button
                      onClick={() => setShowRejectDialog(true)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Reject Request
                    </button>
                  </>
                )}

                {!isTerminal && (
                  <button
                    onClick={() => handleStatusChange("CANCELLED")}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Details Cards */}
              <div className="lg:col-span-2 space-y-6">
                {/* Institute & Contact Grid */}
                <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl space-y-5">
                  <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-400" /> Institute & Location Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        Institute Name
                      </span>
                      <span className="text-white font-medium">{request.instituteName}</span>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        Geographic Location
                      </span>
                      <span className="text-slate-300 font-medium">
                        {request.city}, {request.state}, {request.country}
                      </span>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        Website URL
                      </span>
                      {request.website ? (
                        <a
                          href={request.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 font-semibold hover:underline flex items-center gap-1.5 text-xs mt-1"
                        >
                          <Globe className="w-3.5 h-3.5" /> Visit Site
                        </a>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Not Provided</span>
                      )}
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        Submission Date
                      </span>
                      <span className="text-slate-300 font-medium">
                        {new Date(request.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl space-y-5">
                  <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-400" /> Contact & Owner Credentials
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        Owner Name
                      </span>
                      <span className="text-white font-medium">{request.ownerName}</span>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        Contact Phone
                      </span>
                      <span className="text-slate-300 font-medium">{request.phone}</span>
                    </div>

                    <div className="col-span-2">
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        Contact / Login Email
                      </span>
                      <span className="text-indigo-400 font-semibold font-mono">{request.email}</span>
                    </div>
                  </div>
                </div>

                {/* Requirements Message */}
                {request.message && (
                  <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-400" /> Requirements / Message
                    </h3>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                      {request.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Status Summary / Timeline */}
              <div className="space-y-6">
                {/* Request Status Box */}
                <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-400" /> Status Summary
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-slate-800/60 pb-2">
                      <span className="text-slate-500">Requested Plan</span>
                      <span className="text-white font-extrabold uppercase">{request.requestedPlan}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-2">
                      <span className="text-slate-500">Current Lifecycle</span>
                      <span className="text-indigo-400 font-semibold">{request.status}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-2">
                      <span className="text-slate-500">Last Updated</span>
                      <span className="text-slate-400">{new Date(request.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {request.reviewNotes && (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 mt-4">
                      <span className="block text-xs font-bold text-rose-400 uppercase mb-1">
                        Reviewer Notes / Rejection Reason
                      </span>
                      <p className="text-xs text-slate-300 leading-normal">{request.reviewNotes}</p>
                    </div>
                  )}
                </div>

                {/* Timeline Component */}
                <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-400" /> Audit Timeline
                  </h3>

                  <div className="relative border-l border-slate-800 pl-4 ml-2.5 space-y-5">
                    {/* Submission */}
                    <div className="relative">
                      <div className="absolute -left-6.5 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border border-slate-950" />
                      <span className="block text-xs font-bold text-white">Request Submitted</span>
                      <span className="block text-10px text-slate-500 mt-0.5">
                        {new Date(request.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Under Review */}
                    {request.status !== "SUBMITTED" && (
                      <div className="relative">
                        <div className="absolute -left-6.5 top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 border border-slate-950" />
                        <span className="block text-xs font-bold text-white">Review Started</span>
                        <span className="block text-10px text-slate-500 mt-0.5">
                          In review by {request.approvedBy || "Administrator"}
                        </span>
                      </div>
                    )}

                    {/* Completion Terminal States */}
                    {request.status === "ACTIVE" && (
                      <div className="relative">
                        <div className="absolute -left-6.5 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950" />
                        <span className="block text-xs font-bold text-emerald-400">Onboarding Completed</span>
                        <span className="block text-10px text-slate-500 mt-0.5">
                          {request.approvedAt ? new Date(request.approvedAt).toLocaleString() : ""}
                        </span>
                      </div>
                    )}

                    {request.status === "REJECTED" && (
                      <div className="relative">
                        <div className="absolute -left-6.5 top-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-950" />
                        <span className="block text-xs font-bold text-rose-450">Request Rejected</span>
                        <span className="block text-10px text-slate-500 mt-0.5">
                          {request.rejectedAt ? new Date(request.rejectedAt).toLocaleString() : ""}
                        </span>
                      </div>
                    )}

                    {request.status === "CANCELLED" && (
                      <div className="relative">
                        <div className="absolute -left-6.5 top-1.5 w-2.5 h-2.5 rounded-full bg-slate-500 border border-slate-950" />
                        <span className="block text-xs font-bold text-slate-450">Request Cancelled</span>
                        <span className="block text-10px text-slate-500 mt-0.5">
                          Cancelled by Super Admin
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dialog Component: APPROVAL MODAL */}
            {showApproveDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans">
                <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-in">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      🛡️ Onboard Academy Portal
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Verify configuration options. Submitting will execute the multi-step transaction.
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Institute Name:</span>
                      <span className="text-slate-200 font-semibold">{request.instituteName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Primary Admin User:</span>
                      <span className="text-slate-200 font-semibold">{request.ownerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Credentials Email:</span>
                      <span className="text-indigo-400 font-mono font-semibold">{request.email}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Subscription Plan */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Subscription Plan Tier
                      </label>
                      <select
                        value={approvePlan}
                        onChange={(e) => setApprovePlan(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="FREE">Free Tier</option>
                        <option value="BASIC">Basic Plan</option>
                        <option value="PROFESSIONAL">Professional Plan</option>
                        <option value="ENTERPRISE">Enterprise Tier</option>
                      </select>
                    </div>

                    {/* Trial Duration */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Trial Duration (Days)
                      </label>
                      <select
                        value={trialDuration}
                        onChange={(e) => setTrialDuration(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="14">14 Days Trial</option>
                        <option value="30">30 Days Trial</option>
                        <option value="90">90 Days Trial</option>
                      </select>
                    </div>
                  </div>

                  {/* Provision Checks checkboxes */}
                  <div className="space-y-2 border-t border-b border-slate-800 py-3 text-xs">
                    <label className="flex items-center gap-2.5 text-slate-300 font-medium">
                      <input
                        type="checkbox"
                        checked={createInst}
                        onChange={(e) => setCreateInst(e.target.checked)}
                        className="w-4 h-4 rounded accent-indigo-600 bg-slate-950 border-slate-800"
                      />
                      Create Dedicated Tenant (Institute)
                    </label>

                    <label className="flex items-center gap-2.5 text-slate-300 font-medium">
                      <input
                        type="checkbox"
                        checked={createAdmin}
                        onChange={(e) => setCreateAdmin(e.target.checked)}
                        className="w-4 h-4 rounded accent-indigo-600 bg-slate-950 border-slate-800"
                      />
                      Create User Account (Role: ADMIN)
                    </label>

                    <label className="flex items-center gap-2.5 text-slate-300 font-medium">
                      <input
                        type="checkbox"
                        checked={generatePass}
                        onChange={(e) => setGeneratePass(e.target.checked)}
                        className="w-4 h-4 rounded accent-indigo-600 bg-slate-950 border-slate-800"
                      />
                      Generate Hashed Temporary Credentials
                    </label>

                    <label className="flex items-center gap-2.5 text-slate-300 font-medium">
                      <input
                        type="checkbox"
                        checked={sendWelcome}
                        onChange={(e) => setSendWelcome(e.target.checked)}
                        className="w-4 h-4 rounded accent-indigo-600 bg-slate-950 border-slate-800"
                      />
                      Send welcome & subscription notifications (Resend)
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 text-xs pt-2">
                    <button
                      onClick={() => setShowApproveDialog(false)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleApproveOnboard}
                      disabled={actionLoading}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl flex items-center gap-1.5"
                    >
                      {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Approve & provision
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dialog Component: REJECT MODAL */}
            {showRejectDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans">
                <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-in">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      ❌ Reject Access Request
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Specify the grounds for rejecting this onboarding application.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Reason Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Reason Dropdown
                      </label>
                      <select
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                      >
                        <option value="Duplicate Institute">Duplicate Academy / Request</option>
                        <option value="Invalid Information">Invalid Information / Suspicious Email</option>
                        <option value="Business Decision">Business Decisions / Non-compliant</option>
                        <option value="Other">Other Reasons</option>
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Optional Notes
                      </label>
                      <textarea
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        rows={3}
                        placeholder="Provide details or comments explaining the decision..."
                        className="block w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 text-xs pt-2">
                    <button
                      onClick={() => setShowRejectDialog(false)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRejectOnboard}
                      disabled={actionLoading}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center gap-1.5"
                    >
                      {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Confirm Reject
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
