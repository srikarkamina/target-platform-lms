"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import CertificateStats from "@/components/certificates/CertificateStats";
import CertificateTable from "@/components/certificates/CertificateTable";
import CertificateForm from "@/components/certificates/CertificateForm";
import TemplatePreview from "@/components/certificates/TemplatePreview";
import { Plus, Search, RefreshCw, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Course {
  id: string;
  title: string;
  courseCode: string;
}

interface Template {
  id: string;
  name: string;
  title: string;
  description?: string | null;
  backgroundImage?: string | null;
  signatureImage?: string | null;
  isActive: boolean;
}

interface Certificate {
  id: string;
  certificateNumber: string;
  certificateCode: string;
  issueDate: string;
  status: "ACTIVE" | "REVOKED";
  student: {
    name: string;
    email: string;
  };
  course: {
    title: string;
    courseCode: string;
  };
  template: {
    id: string;
    name: string;
    title: string;
    backgroundImage?: string | null;
    signatureImage?: string | null;
  };
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [role, setRole] = useState<string | null>(null);

  // Filtering states
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Action states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Preview Modal
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);

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

  // Fetch all dependencies
  const fetchDependencies = async () => {
    if (role === "STUDENT") return;
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [studentsRes, coursesRes, templatesRes] = await Promise.all([
        fetch("/api/students", { headers }),
        fetch("/api/courses", { headers }),
        fetch("/api/certificate-templates", { headers }),
      ]);

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }
      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setCourses(coursesData);
      }
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.filter((t: Template) => t.isActive));
      }
    } catch (err) {
      console.error("Failed to load select dropdown dependencies:", err);
    }
  };

  // Fetch certificates
  const fetchCertificates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      if (role === "STUDENT") {
        const res = await fetch("/api/reports/student/certificates", { headers });
        if (!res.ok) {
          throw new Error("Failed to fetch student certificates");
        }
        const data = await res.json();
        const transformed: Certificate[] = data.map((cert: any) => ({
          id: cert.certificateId,
          certificateNumber: cert.certificateNumber,
          certificateCode: cert.certificateCode,
          issueDate: cert.issueDate,
          status: cert.verificationStatus === "Verified" ? "ACTIVE" : "REVOKED",
          student: {
            name: "",
            email: "",
          },
          course: {
            title: cert.courseTitle,
            courseCode: cert.courseCode,
          },
          template: {
            id: "",
            name: cert.certificateName,
            title: cert.certificateName,
          },
        }));
        setCertificates(transformed);
      } else {
        // Build query string
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (courseFilter) params.append("courseId", courseFilter);
        if (statusFilter) params.append("status", statusFilter);

        const res = await fetch(`/api/certificates?${params.toString()}`, { headers });
        if (!res.ok) {
          throw new Error("Failed to fetch certificates");
        }
        const data = await res.json();
        setCertificates(data);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching certificates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.role) {
        setRole(payload.role);
      } else {
        setRole("STUDENT");
      }
    } else {
      setRole("STUDENT");
    }
  }, []);

  useEffect(() => {
    if (role === null) return;
    if (role !== "STUDENT") {
      fetchDependencies();
    }
    fetchCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseFilter, statusFilter, role]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCertificates();
  };

  // Generate certificate submit
  const handleGenerateSubmit = async (data: {
    studentId: string;
    courseId: string;
    templateId: string;
    completionDate?: string;
  }) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/certificates/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || "Failed to generate certificate");
      }

      setIsFormOpen(false);
      fetchCertificates();
    } catch (err: any) {
      setSubmitError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Revoke/Soft-delete
  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke and delete this certificate? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/certificates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to revoke certificate");
      }

      toast.success("Certificate revoked successfully!");
      fetchCertificates();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleView = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`/api/certificates/${id}`, { headers });
      if (!res.ok) {
        throw new Error("Failed to load certificate details");
      }
      const data = await res.json();
      setPreviewCert(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load certificate details");
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/certificates/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to download certificate");
      }
      await handleView(id);
    } catch (err: any) {
      toast.error(err.message || "Download failed");
    }
  };

  // Compute stats
  const total = certificates.length;
  const active = certificates.filter((c) => c.status === "ACTIVE").length;
  const revoked = certificates.filter((c) => c.status === "REVOKED").length;
  const templatesCount = templates.length;

  return (
    <DashboardLayout>
      <DashboardPageContainer>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {role === "STUDENT" ? "My Certificates" : "Certificate Registry"}
              </h1>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                {role === "STUDENT"
                  ? "View and download your earned completion certificates."
                  : "Issue learning credentials, manage validity records, and monitor student achievements."}
              </p>
            </div>
            {(role === "ADMIN" || role === "SUPER_ADMIN") && (
              <button
                onClick={() => {
                  setSubmitError(null);
                  setIsFormOpen(true);
                }}
                className="px-5 py-3 rounded-2xl bg-indigo-650 hover:bg-indigo-700 text-sm font-bold text-white transition-all duration-200 flex items-center gap-1.5 shadow-sm shadow-indigo-100 cursor-pointer"
              >
                <Plus className="h-4.5 w-4.5" /> Issue Certificate
              </button>
            )}
          </div>

          {/* Stats */}
          {role !== "STUDENT" && (
            <CertificateStats total={total} active={active} revoked={revoked} templatesCount={templatesCount} />
          )}

          {/* Search/Filters */}
          {role !== "STUDENT" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-center gap-4">
              <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search certificate number or student name..."
                  className="w-full bg-slate-50 hover:bg-slate-100/75 focus:bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              </form>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:ml-auto">
                {/* Course Filter */}
                <select
                  value={courseFilter}
                  onChange={(e) => setCourseFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="">All Courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="REVOKED">Revoked</option>
                </select>

                <button
                  onClick={fetchCertificates}
                  className="p-2.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Refresh certificates"
                >
                  <RefreshCw className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          )}

          {/* Main Error */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 flex items-start gap-2.5 text-sm font-semibold">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error loading certificates</p>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Table */}
          <CertificateTable
            certificates={certificates}
            isLoading={isLoading}
            onRevoke={handleRevoke}
            onView={handleView}
            onDownload={handleDownload}
            isAdmin={role !== "STUDENT"}
            canRevoke={role === "ADMIN" || role === "SUPER_ADMIN"}
          />
      </DashboardPageContainer>

      {/* Form Modal */}
      {isFormOpen && (
        <CertificateForm
          students={students}
          courses={courses}
          templates={templates}
          onSubmit={handleGenerateSubmit}
          onClose={() => setIsFormOpen(false)}
          isSubmitting={isSubmitting}
          error={submitError}
        />
      )}

      {/* Preview Modal */}
      {previewCert && (
        <TemplatePreview
          template={{
            name: previewCert.template.name,
            title: previewCert.template.title,
            backgroundImage: previewCert.template.backgroundImage,
            signatureImage: previewCert.template.signatureImage,
          }}
          studentName={previewCert.student.name}
          courseTitle={previewCert.course.title}
          issueDate={previewCert.issueDate}
          certificateNumber={previewCert.certificateNumber}
          status={previewCert.status}
          onClose={() => setPreviewCert(null)}
        />
      )}
    </DashboardLayout>
  );
}
