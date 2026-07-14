"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import TemplateForm from "@/components/certificates/TemplateForm";
import TemplatePreview from "@/components/certificates/TemplatePreview";
import { Plus, Eye, Edit2, Trash2, ShieldCheck, ShieldAlert, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Template {
  id: string;
  name: string;
  title: string;
  description?: string | null;
  backgroundImage?: string | null;
  signatureImage?: string | null;
  isActive: boolean;
}

export default function CertificateTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Preview state
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

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

  // Fetch templates
  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/certificate-templates", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await res.json();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching templates");
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
        if (payload.role === "ADMIN" || payload.role === "SUPER_ADMIN") {
          fetchTemplates();
        } else {
          setIsLoading(false);
        }
      }
    }
  }, []);

  // Form Submit (Create / Edit)
  const handleFormSubmit = async (data: {
    name: string;
    title: string;
    description?: string;
    backgroundImage?: string;
    signatureImage?: string;
    isActive?: boolean;
  }) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const token = localStorage.getItem("token");
      const isEditing = !!editingTemplate;
      const url = isEditing
        ? `/api/certificate-templates/${editingTemplate.id}`
        : "/api/certificate-templates";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || "Failed to save template");
      }

      setIsFormOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err: any) {
      setSubmitError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete/Soft-delete template
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template? Active certificates issued under it won't be deleted, but this template won't be available for new issues.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/certificate-templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete template");
      }

      toast.success("Template deleted successfully!");
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Toggle active status
  const handleToggleActive = async (template: Template) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/certificate-templates/${template.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: !template.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to toggle template status");
      }

      toast.success("Template status updated successfully!");
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (role !== null && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return (
      <DashboardLayout>
        <DashboardPageContainer>
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 mb-4">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-slate-150">Access Denied</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
              Certificate templates management is restricted to administrators. You do not have permissions to view this resource.
            </p>
          </div>
        </DashboardPageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardPageContainer>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Certificate Templates</h1>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Configure layouts, background frames, and authorized signatures to issue beautiful credentials.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setSubmitError(null);
                setIsFormOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white transition-all duration-200 flex items-center gap-1.5 shadow-sm shadow-indigo-100 cursor-pointer"
            >
              <Plus className="h-4.5 w-4.5" /> Create Template
            </button>
          </div>

          {/* Main Error */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 flex items-start gap-2.5 text-sm font-semibold">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error loading templates</p>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Loading Grid State */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs animate-pulse space-y-4">
                  <div className="h-5 bg-slate-200 rounded-md w-2/3"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-full"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-1/2"></div>
                  <div className="pt-4 flex justify-between">
                    <div className="h-8 bg-slate-200 rounded-lg w-16"></div>
                    <div className="h-8 bg-slate-200 rounded-lg w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs max-w-2xl mx-auto">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Plus className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mt-4">No templates configured</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Create your first certificate template layout, add signature details, and configure the background to begin issuing certificates.
              </p>
            </div>
          ) : (
            /* Template Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between p-6 space-y-4"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-1">{template.name}</h3>
                      <button
                        onClick={() => handleToggleActive(template)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer select-none ${
                          template.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100/50"
                        }`}
                        title="Click to toggle active state"
                      >
                        {template.isActive ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Active
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Inactive
                          </>
                        )}
                      </button>
                    </div>

                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mt-2">{template.title}</h4>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {template.description || "No description provided."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setPreviewTemplate(template)}
                      className="px-3.5 py-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTemplate(template);
                          setSubmitError(null);
                          setIsFormOpen(true);
                        }}
                        className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer"
                        title="Edit Template"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer"
                        title="Delete Template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </DashboardPageContainer>

      {/* Form Modal */}
      {isFormOpen && (
        <TemplateForm
          template={editingTemplate}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTemplate(null);
          }}
          isSubmitting={isSubmitting}
          error={submitError}
        />
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreview
          template={{
            name: previewTemplate.name,
            title: previewTemplate.title,
            description: previewTemplate.description,
            backgroundImage: previewTemplate.backgroundImage,
            signatureImage: previewTemplate.signatureImage,
          }}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </DashboardLayout>
  );
}
