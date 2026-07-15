"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Building,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

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
  status: string;
  createdAt: string;
}

export default function AccessRequestsListPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "10",
      });

      if (search) queryParams.append("search", search);
      if (status) queryParams.append("status", status);
      if (plan) queryParams.append("plan", plan);

      const res = await fetch(`/api/super-admin/access-requests?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to load access requests.");
      }

      setRequests(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      toast.error(err.message || "Could not fetch requests.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, plan]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  const getStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case "SUBMITTED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">Submitted</span>;
      case "UNDER_REVIEW":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">Under Review</span>;
      case "APPROVED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">Approved</span>;
      case "ONBOARDING":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">Onboarding</span>;
      case "ACTIVE":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Active</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">Rejected</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400">Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400">{statusStr}</span>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 relative">
          {/* Gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b_0%,transparent_50%)] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  🛡️ Access Requests
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Manage external institute registrations, trial parameters, and enterprise provisioning.
                </p>
              </div>
            </div>

            {/* Filter Panel */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl">
              <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by ID, institute name, email or owner..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm placeholder-slate-500 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap md:flex-nowrap gap-4 w-full md:w-auto">
                  {/* Status */}
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors w-full md:w-40"
                  >
                    <option value="">All Statuses</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="ONBOARDING">Onboarding</option>
                    <option value="ACTIVE">Active</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>

                  {/* Plan */}
                  <select
                    value={plan}
                    onChange={(e) => {
                      setPlan(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors w-full md:w-40"
                  >
                    <option value="">All Plans</option>
                    <option value="FREE">Free</option>
                    <option value="BASIC">Basic</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-indigo-600/10 w-full md:w-auto"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            {/* List Table */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
                <span className="text-slate-400 text-sm">Loading access requests...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-slate-800/80 rounded-2xl backdrop-blur-xl text-center p-6">
                <Building className="w-12 h-12 text-slate-600 mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No Access Requests found</h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  We couldn't find any submissions matching your search filters or status tags.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Desktop View */}
                <div className="hidden lg:block overflow-hidden bg-slate-900/20 border border-slate-800/80 rounded-2xl backdrop-blur-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-900/40">
                        <th className="p-4 pl-6">Reference No</th>
                        <th className="p-4">Institute Name</th>
                        <th className="p-4">Primary Contact</th>
                        <th className="p-4">Business Email</th>
                        <th className="p-4">Requested Plan</th>
                        <th className="p-4">Submitted Date</th>
                        <th className="p-4">Current Status</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {requests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-900/30 transition-colors text-sm">
                          <td className="p-4 pl-6 font-bold text-indigo-400 font-mono">
                            {req.requestNumber}
                          </td>
                          <td className="p-4 font-semibold text-white">
                            {req.instituteName}
                          </td>
                          <td className="p-4">
                            {req.ownerName}
                          </td>
                          <td className="p-4 text-slate-350">
                            {req.email}
                          </td>
                          <td className="p-4 font-semibold">
                            <span className="uppercase text-slate-300">{req.requestedPlan}</span>
                          </td>
                          <td className="p-4 text-slate-400 text-xs">
                            {new Date(req.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="p-4">
                            {getStatusBadge(req.status)}
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <Link
                              href={`/dashboard/super-admin/access-requests/${req.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg transition-colors border border-slate-700/60"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile/Tablet View (Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-xl hover:border-slate-700 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="block text-xs font-bold text-slate-500 font-mono">
                            {req.requestNumber}
                          </span>
                          <h4 className="text-base font-bold text-white mt-0.5">
                            {req.instituteName}
                          </h4>
                        </div>
                        {getStatusBadge(req.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 border-t border-b border-slate-800/60 py-3">
                        <div>
                          <span className="block text-slate-500 font-medium">Owner</span>
                          <span className="text-slate-300 font-semibold">{req.ownerName}</span>
                        </div>
                        <div>
                          <span className="block text-slate-500 font-medium">Email</span>
                          <span className="text-slate-300 font-semibold truncate block">{req.email}</span>
                        </div>
                        <div>
                          <span className="block text-slate-500 font-medium">Requested Plan</span>
                          <span className="text-slate-300 font-semibold uppercase">{req.requestedPlan}</span>
                        </div>
                        <div>
                          <span className="block text-slate-500 font-medium">Submitted</span>
                          <span className="text-slate-300 font-semibold">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Link
                          href={`/dashboard/super-admin/access-requests/${req.id}`}
                          className="flex items-center gap-1.5 justify-center w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-xl transition-colors border border-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center bg-slate-900/20 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-xl">
                    <span className="text-xs text-slate-500">
                      Showing page <span className="text-slate-300 font-semibold">{page}</span> of{" "}
                      <span className="text-slate-300 font-semibold">{totalPages}</span> ({total} requests)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-750"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={page === totalPages}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-750"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
