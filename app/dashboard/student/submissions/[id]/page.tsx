"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  MessageSquare,
  Award,
  BookOpen,
  Clock
} from "lucide-react";
import toast from "react-hot-toast";

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  submittedAt: string;
  grade: number | null;
  feedback: string | null;
  assignment: {
    id: string;
    title: string;
    course: {
      id: string;
      title: string;
      courseCode: string;
    };
  };
}

export default function StudentSubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubmission = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/submissions/${submissionId}`);
      setSubmission(res.data);
    } catch (err: any) {
      console.error("Failed to load submission:", err);
      const status = err.response?.status;
      if (status === 401) {
        localStorage.removeItem("token");
        toast.error("Session expired. Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else if (status === 403) {
        setError("Access denied: You are not authorized to view this submission.");
        toast.error("Access denied.");
      } else {
        setError("Failed to load submission details.");
        toast.error("Failed to load submission.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submissionId) {
      fetchSubmission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans animate-pulse">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 space-y-6">
            <div className="h-6 w-32 bg-slate-200 rounded-md"></div>
            <div className="h-40 w-full bg-slate-200 rounded-2xl"></div>
            <div className="h-40 w-full bg-slate-200 rounded-2xl"></div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 flex flex-col items-center justify-center">
            <AlertCircle className="h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Submission Error</h3>
            <p className="text-sm text-slate-550 mt-1 mb-5">{error || "Submission not found."}</p>
            <Link
              href="/dashboard/student/submissions"
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Submissions</span>
            </Link>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6">
          {/* Back button */}
          <div>
            <Link
              href="/dashboard/student/submissions"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Submissions</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Col: Submission File and info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600 uppercase tracking-wide">
                    <BookOpen className="h-3.5 w-3.5" />
                    {submission.assignment.course.courseCode} — {submission.assignment.course.title}
                  </span>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    {submission.assignment.title}
                  </h1>
                </div>

                <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center gap-6 text-xs font-mono font-bold text-slate-550 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-slate-400" />
                    <span>Submitted: {new Date(submission.submittedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded File Detail */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800">Submitted Files</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate" title={submission.fileName || "File"}>
                        {submission.fileName || "Submitted assignment"}
                      </p>
                      {submission.fileSize && (
                        <p className="text-xs text-slate-400 font-normal mt-0.5">
                          Size: {(submission.fileSize / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                  </div>
                  <a
                    href={submission.fileUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <span>Download File</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Col: Grading & Feedback Card */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">Assessment</h3>
                  <p className="text-xs text-slate-450">Review grades and instructor comments</p>
                </div>

                {submission.grade !== null ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center space-y-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold tracking-wide text-emerald-800">
                      <Award className="h-4 w-4" />
                      Graded
                    </span>
                    <h2 className="text-4xl font-black text-emerald-800 tracking-tight">
                      {submission.grade} <span className="text-sm font-bold text-emerald-600">/ 100</span>
                    </h2>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center space-y-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold tracking-wide text-amber-800">
                      <Clock className="h-4 w-4 animate-pulse" />
                      Awaiting Grade
                    </span>
                    <p className="text-xs text-slate-500 font-medium">
                      Your coursework has been submitted and is currently queueing for faculty review.
                    </p>
                  </div>
                )}

                {/* Faculty Feedback Section */}
                <div className="space-y-2 border-t border-slate-100 pt-5">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 font-mono flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-indigo-500" />
                    <span>Faculty Feedback</span>
                  </h4>
                  {submission.feedback ? (
                    <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-4 text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                      {submission.feedback}
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-xs font-medium">
                      No feedback comments provided yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
