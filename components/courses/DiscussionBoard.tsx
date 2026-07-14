"use client";

import React, { useEffect, useState, useCallback } from "react";
import { 
  MessageSquare, Heart, Pin, Lock, Unlock, Plus, Trash2, CheckCircle, 
  Reply, CornerDownRight, Search, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

interface Creator {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ReplyItem {
  id: string;
  discussionId: string;
  parentId: string | null;
  content: string;
  isOfficialAnswer: boolean;
  createdBy: string;
  createdAt: string;
  creator: Creator;
  replies?: ReplyItem[];
}

interface Thread {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  locked: boolean;
  courseId: string;
  createdBy: string;
  creatorName: string;
  createdAt: string;
  creator: Creator;
  isLiked: boolean;
  likesCount: number;
  repliesCount: number;
}

interface DiscussionBoardProps {
  courseId: string;
  role: string;
  userId: string;
}

export default function DiscussionBoard({ courseId, role, userId }: DiscussionBoardProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Thread Creation/Editing
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [threadTitle, setThreadTitle] = useState("");
  const [threadContent, setThreadContent] = useState("");
  
  // Thread Detail View
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [replies, setReplies] = useState<ReplyItem[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [replyingToName, setReplyingToName] = useState("");

  const fetchThreads = useCallback(async (searchQuery?: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/courses/${courseId}/discussions`, {
        params: { search: searchQuery || undefined }
      });
      setThreads(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load discussion threads");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchThreads(search);
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadTitle.trim() || !threadContent.trim()) {
      toast.error("Title and Content are required");
      return;
    }

    try {
      await api.post(`/courses/${courseId}/discussions`, {
        title: threadTitle.trim(),
        content: threadContent.trim()
      });
      toast.success("Discussion thread created!");
      setShowCreateModal(false);
      setThreadTitle("");
      setThreadContent("");
      fetchThreads();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create thread");
    }
  };

  const handleLike = async (thread: Thread) => {
    try {
      if (thread.isLiked) {
        await api.delete(`/courses/${courseId}/discussions/${thread.id}/like`);
        setThreads(threads.map(t => t.id === thread.id ? { ...t, isLiked: false, likesCount: t.likesCount - 1 } : t));
      } else {
        await api.post(`/courses/${courseId}/discussions/${thread.id}/like`);
        setThreads(threads.map(t => t.id === thread.id ? { ...t, isLiked: true, likesCount: t.likesCount + 1 } : t));
      }
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    }
  };

  const handleTogglePin = async (thread: Thread) => {
    try {
      const updated = await api.patch(`/courses/${courseId}/discussions/${thread.id}`, {
        pinned: !thread.pinned
      });
      setThreads(threads.map(t => t.id === thread.id ? { ...t, pinned: updated.data.pinned } : t));
      toast.success(updated.data.pinned ? "Thread pinned!" : "Thread unpinned!");
    } catch (err) {
      console.error(err);
      toast.error("Pin action failed");
    }
  };

  const handleToggleLock = async (thread: Thread) => {
    try {
      const updated = await api.patch(`/courses/${courseId}/discussions/${thread.id}`, {
        locked: !thread.locked
      });
      setThreads(threads.map(t => t.id === thread.id ? { ...t, locked: updated.data.locked } : t));
      toast.success(updated.data.locked ? "Thread locked!" : "Thread unlocked!");
    } catch (err) {
      console.error(err);
      toast.error("Lock action failed");
    }
  };

  const handleDeleteThread = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this thread?")) return;
    try {
      await api.delete(`/courses/${courseId}/discussions/${id}`);
      toast.success("Thread deleted");
      if (activeThreadId === id) setActiveThreadId(null);
      fetchThreads();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete thread");
    }
  };

  const fetchReplies = async (threadId: string) => {
    try {
      setLoadingReplies(true);
      const res = await api.get(`/courses/${courseId}/discussions/${threadId}/replies`);
      
      // Organize flat replies list into tree hierarchy in memory
      const list: ReplyItem[] = res.data || [];
      const repliesMap = new Map<string, ReplyItem>();
      const tree: ReplyItem[] = [];

      list.forEach(r => {
        repliesMap.set(r.id, { ...r, replies: [] });
      });

      list.forEach(r => {
        const item = repliesMap.get(r.id)!;
        if (r.parentId) {
          const parent = repliesMap.get(r.parentId);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(item);
          } else {
            // Parent reply was probably deleted
            tree.push(item);
          }
        } else {
          tree.push(item);
        }
      });

      setReplies(tree);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load replies");
    } finally {
      setLoadingReplies(false);
    }
  };

  const selectThread = (threadId: string) => {
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
      setReplies([]);
    } else {
      setActiveThreadId(threadId);
      setReplyInput("");
      setReplyParentId(null);
      setReplyingToName("");
      fetchReplies(threadId);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThreadId) return;
    if (!replyInput.trim()) return;

    try {
      await api.post(`/courses/${courseId}/discussions/${activeThreadId}/replies`, {
        content: replyInput.trim(),
        parentId: replyParentId
      });
      toast.success("Reply posted!");
      setReplyInput("");
      setReplyParentId(null);
      setReplyingToName("");
      fetchReplies(activeThreadId);
      fetchThreads(); // Update reply counts
    } catch (err) {
      console.error(err);
      toast.error("Failed to post reply");
    }
  };

  const handleMarkOfficial = async (reply: ReplyItem, currentStatus: boolean) => {
    try {
      await api.post(`/courses/${courseId}/discussions/${activeThreadId}/replies`, {
        content: reply.content,
        parentId: reply.parentId,
        isOfficialAnswer: !currentStatus // Toggle official status
      });
      toast.success(!currentStatus ? "Marked as official answer!" : "Removed official status!");
      fetchReplies(activeThreadId!);
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    }
  };

  const isModerator = ["FACULTY", "ADMIN", "SUPER_ADMIN"].includes(role);
  const activeThread = threads.find(t => t.id === activeThreadId);

  // Recursively render nested replies
  const renderReplies = (items: ReplyItem[], depth = 0) => {
    return items.map((r) => {
      return (
        <div key={r.id} className="space-y-4" style={{ marginLeft: depth > 0 ? `${Math.min(depth * 16, 48)}px` : "0px" }}>
          <div className={`p-4 bg-slate-50 dark:bg-slate-850 border rounded-2xl text-left flex items-start gap-4 ${
            r.isOfficialAnswer ? "border-emerald-500 bg-emerald-500/5" : "border-slate-100 dark:border-slate-800"
          }`}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 font-bold text-xs uppercase">
              {r.creator.name.charAt(0)}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-850 dark:text-slate-150">{r.creator.name}</span>
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 px-1.5 py-0.5 rounded font-extrabold uppercase">{r.creator.role}</span>
                {r.isOfficialAnswer && (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
                    <CheckCircle className="h-3 w-3 fill-current" />
                    <span>Official Answer</span>
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-650 dark:text-slate-350 mt-1 leading-normal">
                {r.content}
              </p>
              <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-455 font-bold uppercase tracking-wide">
                <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                
                {/* Reply action button */}
                {(!activeThread?.locked || isModerator) && (
                  <button 
                    onClick={() => { setReplyParentId(r.id); setReplyingToName(r.creator.name); }}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 cursor-pointer border-none bg-transparent uppercase font-bold text-[10px]"
                  >
                    <Reply className="h-3 w-3" />
                    <span>Reply</span>
                  </button>
                )}

                {/* Mark as official answer for faculty */}
                {isModerator && (
                  <button 
                    onClick={() => handleMarkOfficial(r, r.isOfficialAnswer)}
                    className={`flex items-center gap-1 cursor-pointer border-none bg-transparent uppercase font-bold text-[10px] ${
                      r.isOfficialAnswer ? "text-rose-500" : "text-emerald-600"
                    }`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>{r.isOfficialAnswer ? "Demote" : "Mark Official"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Render children replies */}
          {r.replies && r.replies.length > 0 && (
            <div className="space-y-4 pt-1 border-l-2 border-slate-100 dark:border-slate-800 pl-4">
              {renderReplies(r.replies, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Search and create bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-550" />
          <input
            type="text"
            placeholder="Search discussions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" className="hidden" />
        </form>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold px-4 py-2.5 text-xs transition-colors shadow-sm shadow-indigo-100 border-none cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Discussion</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Threads List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">Discussion Threads</h3>
          
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
          ) : threads.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              No threads created yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {threads.map((t) => (
                <div
                  key={t.id}
                  onClick={() => selectThread(t.id)}
                  className={`p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-2xs transition-all cursor-pointer text-left hover:border-indigo-400 ${
                    activeThreadId === t.id ? "ring-2 ring-indigo-500 border-indigo-400" : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-snug break-all line-clamp-2">
                      {t.title}
                    </h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {t.pinned && <Pin className="h-3.5 w-3.5 text-indigo-600 fill-current" />}
                      {t.locked && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-normal">
                    {t.content}
                  </p>

                  <div className="flex items-center justify-between mt-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    <span>By {t.creatorName}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart className={`h-3 w-3 ${t.isLiked ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
                        <span>{t.likesCount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 text-slate-400" />
                        <span>{t.repliesCount}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Active Thread Detail */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">Thread View</h3>

          {!activeThreadId ? (
            <div className="bg-slate-50/50 dark:bg-slate-900/50 border border-dashed border-slate-250 dark:border-slate-800 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
              <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-xs text-slate-400 font-bold">Select a discussion thread to view replies.</p>
            </div>
          ) : !activeThread ? (
            <div className="text-center p-8 text-rose-500">Thread not found or deleted.</div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6 text-left">
              {/* Thread Header details */}
              <div className="flex items-start justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      {activeThread.creatorName} ({activeThread.creator.role})
                    </span>
                    <span className="text-[10px] text-slate-400">{new Date(activeThread.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-850 dark:text-slate-150 leading-snug">
                    {activeThread.title}
                  </h2>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-line mt-2">
                    {activeThread.content}
                  </p>
                </div>

                {/* Moderate settings for Moderator */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleLike(activeThread)}
                    disabled={activeThread.locked && !isModerator}
                    className={`p-2 border rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      activeThread.isLiked 
                        ? "bg-rose-50 border-rose-250 text-rose-500" 
                        : "bg-white dark:bg-slate-900 border-slate-200 hover:border-rose-400 text-slate-400 hover:text-rose-500"
                    }`}
                  >
                    <Heart className={`h-4.5 w-4.5 ${activeThread.isLiked ? "fill-current" : ""}`} />
                  </button>

                  {isModerator && (
                    <>
                      <button
                        onClick={() => handleTogglePin(activeThread)}
                        className={`p-2 border rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          activeThread.pinned 
                            ? "bg-indigo-50 border-indigo-250 text-indigo-650" 
                            : "bg-white border-slate-200 text-slate-400 hover:text-indigo-600"
                        }`}
                        title={activeThread.pinned ? "Unpin thread" : "Pin thread"}
                      >
                        <Pin className={`h-4.5 w-4.5 ${activeThread.pinned ? "fill-current" : ""}`} />
                      </button>
                      <button
                        onClick={() => handleToggleLock(activeThread)}
                        className={`p-2 border rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          activeThread.locked 
                            ? "bg-slate-100 border-slate-300 text-slate-700" 
                            : "bg-white border-slate-200 text-slate-400 hover:text-slate-700"
                        }`}
                        title={activeThread.locked ? "Unlock thread" : "Lock thread (Read-only)"}
                      >
                        {activeThread.locked ? <Lock className="h-4.5 w-4.5" /> : <Unlock className="h-4.5 w-4.5" />}
                      </button>
                    </>
                  )}

                  {(isModerator || activeThread.createdBy === userId) && (
                    <button
                      onClick={() => handleDeleteThread(activeThread.id)}
                      className="p-2 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Delete thread"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Replies Container */}
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Replies ({activeThread.repliesCount})</h4>
                
                {loadingReplies ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-indigo-650" /></div>
                ) : replies.length === 0 ? (
                  <p className="text-xs text-slate-450 dark:text-slate-500 italic">No replies posted yet. Be the first to answer!</p>
                ) : (
                  <div className="space-y-4">
                    {renderReplies(replies)}
                  </div>
                )}
              </div>

              {/* Post Reply Form */}
              {(!activeThread.locked || isModerator) ? (
                <form onSubmit={handlePostReply} className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  {replyParentId && (
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-850 px-3.5 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                        <CornerDownRight className="h-3.5 w-3.5 text-slate-400" />
                        Replying to: <span className="text-slate-800 dark:text-slate-200">{replyingToName}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => { setReplyParentId(null); setReplyingToName(""); }}
                        className="text-slate-400 hover:text-rose-500 font-extrabold text-sm border-none bg-transparent cursor-pointer"
                      >
                        &times;
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <input
                      type="text"
                      required
                      placeholder={replyParentId ? "Post a comment reply..." : "Add to the discussion..."}
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-2xs border-none cursor-pointer"
                    >
                      Post Reply
                    </button>
                  </div>
                </form>
              ) : (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center gap-2 text-slate-400 bg-slate-50 dark:bg-slate-850 px-4 py-3 rounded-2xl border">
                  <Lock className="h-4 w-4 shrink-0" />
                  <p className="text-xs font-semibold">This discussion thread is locked and read-only.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150 tracking-tight flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-650" />
                <span>New Discussion Thread</span>
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-slate-650 hover:bg-slate-50 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="p-6 space-y-6 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Topic Title *</label>
                <input
                  type="text"
                  required
                  placeholder="What is the topic you want to discuss?"
                  value={threadTitle}
                  onChange={(e) => setThreadTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-550 uppercase tracking-wide">Content / Details *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Elaborate on your topic or post your question..."
                  value={threadContent}
                  onChange={(e) => setThreadContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-750 font-bold border border-slate-200 dark:border-slate-800 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs border-none"
                >
                  Create Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
