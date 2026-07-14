"use client";

import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import LoadingState from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import { 
  Vote, Plus, Trash2, Clock, 
  CheckCircle2, BarChart2,
  CheckSquare, Square, Info
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

interface PollOption {
  id: string;
  text: string;
  votesCount: number;
}

interface Poll {
  id: string;
  question: string;
  type: string; // SINGLE_CHOICE, MULTIPLE_CHOICE
  anonymous: boolean;
  publicResults: boolean;
  allowVoteUpdate: boolean;
  expiryDate: string;
  isExpired: boolean;
  hasVoted: boolean;
  votedOptionIds: string[];
  createdBy: string;
  creatorName: string;
  createdAt: string;
  options: PollOption[];
}

export default function PollsPage() {
  const [role, setRole] = useState<string>("STUDENT");
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  // New Poll Form Fields
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [question, setQuestion] = useState("");
  const [pollType, setPollType] = useState("SINGLE_CHOICE");
  const [expiryDate, setExpiryDate] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [anonymous, setAnonymous] = useState(false);
  const [publicResults, setPublicResults] = useState(true);
  const [allowVoteUpdate, setAllowVoteUpdate] = useState(false);
  const [submittingPoll, setSubmittingPoll] = useState(false);

  // Student voting selected options mapping { pollId: string[] }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [votingMap, setVotingMap] = useState<Record<string, boolean>>({});

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const fetchUserRole = useCallback(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        setRole(payload.role || "STUDENT");
      }
    }
  }, []);

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/polls");
      setPolls(res.data || []);
      
      // Initialize selected options for voted/unvoted polls
      const preselected: Record<string, string[]> = {};
      (res.data || []).forEach((p: Poll) => {
        preselected[p.id] = p.votedOptionIds || [];
      });
      setSelectedOptions(preselected);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load polls");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserRole();
    fetchPolls();
  }, [fetchUserRole, fetchPolls]);

  const handleAddOptionField = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOptionField = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleOptionTextChange = (idx: number, text: string) => {
    const updated = [...options];
    updated[idx] = text;
    setOptions(updated);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      toast.error("Question text is required");
      return;
    }

    const cleanOptions = options.map(o => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      toast.error("At least 2 poll options are required");
      return;
    }

    if (!expiryDate) {
      toast.error("Expiry date is required");
      return;
    }

    try {
      setSubmittingPoll(true);
      await api.post("/polls", {
        question: question.trim(),
        type: pollType,
        expiryDate: new Date(expiryDate),
        options: cleanOptions,
        anonymous,
        publicResults,
        allowVoteUpdate
      });

      toast.success("Poll created successfully");
      setShowCreateModal(false);
      setQuestion("");
      setPollType("SINGLE_CHOICE");
      setExpiryDate("");
      setOptions(["", ""]);
      setAnonymous(false);
      setPublicResults(true);
      setAllowVoteUpdate(false);
      fetchPolls();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create poll");
    } finally {
      setSubmittingPoll(false);
    }
  };

  const handleOptionSelect = (pollId: string, type: string, optionId: string) => {
    const currentSelected = selectedOptions[pollId] || [];
    if (type === "SINGLE_CHOICE") {
      setSelectedOptions({
        ...selectedOptions,
        [pollId]: [optionId]
      });
    } else {
      if (currentSelected.includes(optionId)) {
        setSelectedOptions({
          ...selectedOptions,
          [pollId]: currentSelected.filter(id => id !== optionId)
        });
      } else {
        setSelectedOptions({
          ...selectedOptions,
          [pollId]: [...currentSelected, optionId]
        });
      }
    }
  };

  const handleVoteSubmit = async (pollId: string) => {
    const selection = selectedOptions[pollId] || [];
    if (selection.length === 0) {
      toast.error("Please select at least one option to vote.");
      return;
    }

    try {
      setVotingMap(prev => ({ ...prev, [pollId]: true }));
      await api.post(`/polls/${pollId}/vote`, {
        optionIds: selection
      });
      toast.success("Vote registered successfully!");
      fetchPolls();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to cast vote");
    } finally {
      setVotingMap(prev => ({ ...prev, [pollId]: false }));
    }
  };

  const isStaff = ["FACULTY", "ADMIN", "SUPER_ADMIN"].includes(role);

  return (
    <DashboardLayout>
      <DashboardPageContainer>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 dark:bg-slate-950 p-6 rounded-3xl border border-slate-850 shadow-sm text-left">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-650 text-white">
              <Vote className="h-6 w-6 text-white" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                Polls & Opinions
              </h1>
              <p className="text-xs text-slate-200 mt-1">
                Participate in active surveys, share opinions on campus topics, and track live statistics.
              </p>
            </div>
          </div>

          {isStaff && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 text-xs transition-colors shadow-sm shadow-indigo-100 dark:shadow-none border-none cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Poll</span>
            </button>
          )}
        </div>

        {/* Content list */}
        {loading ? (
          <LoadingState message="Fetching surveys..." />
        ) : polls.length === 0 ? (
          <EmptyState title="No Active Polls" description="There are no polls currently active in this institute." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {polls.map((p) => {
              const totalVotes = p.options.reduce((acc, curr) => acc + curr.votesCount, 0);
              const isClosed = p.isExpired;
              
              // Determine if we show voting inputs or poll results
              // For staff: always show results. For students: show results if voted or closed, unless results are private.
              const showResults = isStaff || p.isExpired || (p.hasVoted && p.publicResults);
              
              // Enable submission button
              const canSubmitVote = !isClosed && (!p.hasVoted || p.allowVoteUpdate);
              
              return (
                <div 
                  key={p.id} 
                  className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-xs text-left space-y-5 flex flex-col justify-between ${
                    isClosed ? "border-slate-200 dark:border-slate-850 opacity-85" : "border-slate-200 dark:border-slate-800 hover:border-indigo-400"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                        isClosed 
                          ? "bg-slate-50 text-slate-500 border-slate-200" 
                          : "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400"
                      }`}>
                        {isClosed ? "Closed" : "Active"}
                      </span>
                      
                      <span className="text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                        {p.type === "SINGLE_CHOICE" ? "Single Choice" : "Multiple Choice"}
                      </span>

                      {p.allowVoteUpdate && (
                        <span className="text-[9px] font-extrabold uppercase bg-indigo-50 text-indigo-650 px-2 py-1 rounded-md border border-indigo-150">
                          Resubmission Allowed
                        </span>
                      )}
                    </div>

                    {/* Question text */}
                    <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 leading-snug">
                      {p.question}
                    </h3>

                    {/* Options list */}
                    {showResults ? (
                      /* ================= RESULTS STATE ================= */
                      <div className="space-y-3.5 pt-2">
                        {p.options.map((opt) => {
                          const pct = totalVotes > 0 ? (opt.votesCount / totalVotes) * 100 : 0;
                          const userSelected = p.votedOptionIds.includes(opt.id);
                          return (
                            <div key={opt.id} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                                <span className="flex items-center gap-1.5 min-w-0">
                                  {userSelected && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                                  <span className="truncate">{opt.text}</span>
                                </span>
                                <span className="shrink-0 font-bold ml-2">{opt.votesCount} votes ({Math.round(pct)}%)</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 dark:bg-slate-805 rounded-full overflow-hidden relative">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    userSelected ? "bg-emerald-600" : "bg-indigo-650"
                                  }`} 
                                  style={{ width: `${pct}%` }} 
                                />
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex items-center gap-2 pt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <BarChart2 className="h-4 w-4 text-slate-400" />
                          <span>Total participation: {totalVotes} votes</span>
                        </div>
                      </div>
                    ) : (
                      /* ================= VOTING STATE (Student selection) ================= */
                      <div className="space-y-2.5 pt-2">
                        {p.options.map((opt) => {
                          const isSelected = (selectedOptions[p.id] || []).includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleOptionSelect(p.id, p.type, opt.id)}
                              className={`w-full p-3.5 border rounded-2xl flex items-center justify-between text-xs font-semibold transition-all hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-850/50 cursor-pointer ${
                                isSelected 
                                  ? "bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-550 text-indigo-700 dark:text-indigo-400" 
                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350"
                              }`}
                            >
                              <span>{opt.text}</span>
                              <span className="shrink-0 ml-4">
                                {p.type === "SINGLE_CHOICE" ? (
                                  <span className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${
                                    isSelected ? "border-indigo-650 bg-indigo-650 text-white" : "border-slate-300"
                                  }`}>
                                    {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                                  </span>
                                ) : (
                                  isSelected ? <CheckSquare className="h-4.5 w-4.5 text-indigo-650" /> : <Square className="h-4.5 w-4.5 text-slate-300" />
                                )}
                              </span>
                            </button>
                          );
                        })}

                        {p.hasVoted && !p.publicResults && (
                          <div className="flex items-start gap-2 bg-slate-50 p-3.5 border border-slate-200 rounded-2xl text-[11px] text-slate-500 font-medium">
                            <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                            <span>Your vote is cast. Results for this poll are private and will only become visible after the poll has closed.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer vote submit buttons */}
                  <div className="pt-5 border-t border-slate-100 dark:border-slate-850 flex flex-wrap items-center justify-between gap-4 mt-5">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{isClosed ? "Closed on" : "Closes:"} {new Date(p.expiryDate).toLocaleString()}</span>
                    </div>

                    {!isStaff && canSubmitVote && (
                      <button
                        type="button"
                        onClick={() => handleVoteSubmit(p.id)}
                        disabled={votingMap[p.id]}
                        className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition-colors border-none cursor-pointer flex items-center gap-1.5"
                      >
                        {votingMap[p.id] ? "Voting..." : p.hasVoted ? "Change Vote" : "Submit Vote"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs font-sans">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-200 max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 dark:border-slate-805 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150 tracking-tight flex items-center gap-2">
                  <Vote className="h-5 w-5 text-indigo-650" />
                  <span>Create Opinion Poll</span>
                </h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-650 hover:bg-slate-50 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreatePoll} className="p-6 space-y-6 text-left overflow-y-auto flex-1">
                {/* Question */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Question / Survey *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter the survey question (e.g. Do you prefer online classes?)..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-855 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Poll Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Poll Type</label>
                    <select
                      value={pollType}
                      onChange={(e) => setPollType(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="SINGLE_CHOICE">Single Choice (Radio Buttons)</option>
                      <option value="MULTIPLE_CHOICE">Multiple Choice (Checkboxes)</option>
                    </select>
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Expiry Date *</label>
                    <input
                      type="datetime-local"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Options constructor */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Poll Options (Min 2) *</label>
                    <button
                      type="button"
                      onClick={handleAddOptionField}
                      className="text-xs font-bold text-indigo-650 hover:text-indigo-700 bg-transparent border-none cursor-pointer uppercase tracking-wider"
                    >
                      + Add Option
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {options.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          placeholder={`Option #${idx + 1}`}
                          value={opt}
                          onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                          className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-855 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionField(idx)}
                            className="p-2 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-450 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Configuration boxes */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="h-4 w-4 rounded-sm text-indigo-650 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Anonymous Poll (Hide students name from votes)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={publicResults}
                      onChange={(e) => setPublicResults(e.target.checked)}
                      className="h-4 w-4 rounded-sm text-indigo-650 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Public Results (Allow students to view summary before close)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allowVoteUpdate}
                      onChange={(e) => setAllowVoteUpdate(e.target.checked)}
                      className="h-4 w-4 rounded-sm text-indigo-650 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Allow vote updates (Let students modify their choice)</span>
                  </label>
                </div>

                {/* Submit actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-808">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-750 font-bold border border-slate-200 dark:border-slate-800 rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPoll}
                    className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs border-none"
                  >
                    {submittingPoll ? "Creating..." : "Publish Survey"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardPageContainer>
    </DashboardLayout>
  );
}
