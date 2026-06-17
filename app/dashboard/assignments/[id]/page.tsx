"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Loader2, 
  GraduationCap 
} from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | Date | null;
  courseId: string;
  createdAt: string;
  course: {
    id: string;
    title: string;
    courseCode: string;
  };
}

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
}

const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx", "zip", "rar"];
const MAX_FILE_SIZE = 300 * 1024 * 1024; // 300MB

export default function StudentAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  // File Input State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Decode JWT to get Student ID
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.id) {
        setStudentId(payload.id);
      }
    }
  }, []);

  const fetchData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      // 1. Fetch assignment details
      const assignmentRes = await api.get(`/assignments/${assignmentId}`);
      setAssignment(assignmentRes.data);

      // 2. Fetch existing submissions
      const submissionsRes = await api.get(`/submissions?assignmentId=${assignmentId}&studentId=${studentId}`);
      if (Array.isArray(submissionsRes.data) && submissionsRes.data.length > 0) {
        setSubmission(submissionsRes.data[0]);
      }
    } catch (err) {
      console.error("Failed to load assignment detail:", err);
      toast.error("Failed to load assignment details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, studentId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log(`[CLIENT ASSIGNMENT PAGE] Selected file: "${file.name}", size=${file.size} bytes, type="${file.type}"`);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
      console.warn(`[CLIENT ASSIGNMENT PAGE] File validation failed: extension "${ext}" not allowed.`);
      toast.error(`Invalid file type. Allowed formats: ${ALLOWED_EXTENSIONS.join(", ").toUpperCase()}`);
      setSelectedFile(null);
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      console.warn(`[CLIENT ASSIGNMENT PAGE] File validation failed: size ${file.size} exceeds 300MB limit.`);
      toast.error("File exceeds 300MB limit.");
      setSelectedFile(null);
      e.target.value = "";
      return;
    }

    console.log("[CLIENT ASSIGNMENT PAGE] File validation passed.");
    setSelectedFile(file);
  };

  const handleUploadAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    try {
      setSubmitting(true);
      console.log(`[CLIENT ASSIGNMENT PAGE] Initiating upload for "${selectedFile.name}"...`);

      // 1. Upload file
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await api.post("/upload/assignment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("[CLIENT ASSIGNMENT PAGE] Upload response data:", JSON.stringify(uploadRes.data, null, 2));

      const { url, fileName, mimeType, fileSize } = uploadRes.data;

      // 2. Submit to Submissions API
      const payload = {
        assignmentId,
        fileUrl: url,
        fileName,
        mimeType,
        fileSize,
        studentId,
      };

      console.log("[CLIENT ASSIGNMENT PAGE] Sending submission payload to API:", JSON.stringify(payload, null, 2));

      if (submission) {
        // Update existing submission before grading
        console.log(`[CLIENT ASSIGNMENT PAGE] Updating submissionId="${submission.id}"...`);
        const putRes = await api.put(`/submissions/${submission.id}`, payload);
        console.log("[CLIENT ASSIGNMENT PAGE] PUT Submission success response:", JSON.stringify(putRes.data, null, 2));
        toast.success("Submission updated successfully!");
      } else {
        // Create new submission
        console.log("[CLIENT ASSIGNMENT PAGE] Creating new submission...");
        const postRes = await api.post("/submissions", payload);
        console.log("[CLIENT ASSIGNMENT PAGE] POST Submission success response:", JSON.stringify(postRes.data, null, 2));
        toast.success("Assignment submitted successfully!");
      }

      setSelectedFile(null);
      fetchData();
    } catch (err) {
      console.error("[CLIENT ASSIGNMENT PAGE] Submission failed with error:", err);
      toast.error("Failed to submit assignment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    if (!submission) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
          <Clock className="h-3.5 w-3.5" />
          Not Submitted
        </span>
      );
    }
    if (submission.grade !== null) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-250">
          <CheckCircle className="h-3.5 w-3.5" />
          Graded
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
        <CheckCircle className="h-3.5 w-3.5" />
        Submitted
      </span>
    );
  };

  const isOverdue = () => {
    if (!assignment?.dueDate) return false;
    return new Date(assignment.dueDate).getTime() < Date.now();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 space-y-6 font-sans">
            <div className="h-6 w-32 bg-slate-200 rounded-md animate-pulse"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-10 w-2/3 bg-slate-200 rounded-xl animate-pulse"></div>
                <div className="h-6 w-48 bg-slate-200 rounded-md animate-pulse"></div>
                <div className="h-32 w-full bg-slate-200 rounded-2xl animate-pulse"></div>
              </div>
              <div className="h-64 bg-slate-200 rounded-2xl animate-pulse"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 flex flex-col items-center justify-center font-sans">
            <AlertCircle className="h-12 w-12 text-slate-350 mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Assignment Not Found</h3>
            <p className="text-sm text-slate-550 mt-1 mb-5">This coursework assignment does not exist or has been deleted.</p>
            <Link
              href="/dashboard/assignments"
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Assignments</span>
            </Link>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6 font-sans">
          {/* Back link */}
          <div>
            <Link
              href="/dashboard/assignments"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Assignments</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Area: Assignment details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600 uppercase tracking-wide">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {assignment.course.courseCode} — {assignment.course.title}
                  </span>
                  <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-snug">
                    {assignment.title}
                  </h1>
                </div>

                {assignment.description ? (
                  <div className="pt-2 text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                    {assignment.description}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-sm">No instructions provided.</p>
                )}

                <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center gap-6 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-slate-400" />
                    <span>Posted: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                  </div>
                  {assignment.dueDate && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-slate-400" />
                      <span>
                        Due:{" "}
                        <span className={isOverdue() ? "text-rose-600 font-extrabold" : "text-slate-750"}>
                          {new Date(assignment.dueDate).toLocaleString()}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Area: Submission panel */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">Submission Status</h3>
                  <p className="text-xs text-slate-550">Upload and submit your coursework file</p>
                </div>

                <div className="flex justify-start">{getStatusBadge()}</div>

                {submission && submission.grade !== null && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <p className="text-[10px] uppercase font-extrabold text-emerald-800 tracking-widest font-mono">Grade Assigned</p>
                    <h2 className="text-3xl font-black text-emerald-800 mt-1">{submission.grade} / 100</h2>
                  </div>
                )}

                {/* Submission File Info */}
                {submission && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs text-slate-655">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-500 uppercase tracking-wide">Submitted File:</span>
                      <a
                        href={submission.fileUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="text-indigo-600 hover:underline flex items-center gap-0.5 font-bold"
                        title="Download uploaded file"
                      >
                        <span>Download</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="truncate font-semibold text-slate-800 flex items-center gap-1.5">
                      <FileText className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <span className="truncate">{submission.fileName || "Submitted assignment"}</span>
                    </p>
                    {submission.fileSize && (
                      <p className="text-[10px] text-slate-450">
                        Size: {(submission.fileSize / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      Submitted on: {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Form to submit / edit */}
                {(!submission || submission.grade === null) && (
                  <form onSubmit={handleUploadAndSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Attachment *
                      </label>
                      <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-slate-100/70 p-6 transition-colors cursor-pointer text-xs font-semibold text-slate-600">
                        <FileText className="h-6 w-6 text-slate-400" />
                        <span>Choose File</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Allowed: PDF, DOC, DOCX, PPT, PPTX, ZIP, RAR (max 300MB)
                        </span>
                        <input
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar"
                        />
                      </label>

                      {selectedFile && (
                        <div className="text-xs font-semibold text-slate-700 mt-3 truncate bg-indigo-50 border border-indigo-150 p-3 rounded-xl flex items-center gap-2">
                          <FileText className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-indigo-750">{selectedFile.name}</p>
                            <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                              Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedFile || submitting}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-xs font-extrabold text-white shadow-sm transition-colors cursor-pointer disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed border-none"
                    >
                      {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                      <span>{submission ? "Update Submission" : "Upload Assignment"}</span>
                    </button>
                  </form>
                )}

                {submission && submission.grade !== null && (
                  <div className="text-center text-xs text-slate-400 italic font-medium">
                    This assignment has been graded. Changes are no longer allowed.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
