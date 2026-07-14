import React, { useState, useEffect } from "react";
import { X, Check, Loader2, Image as ImageIcon } from "lucide-react";

interface Template {
  id: string;
  name: string;
  title: string;
  description?: string | null;
  backgroundImage?: string | null;
  signatureImage?: string | null;
  isActive: boolean;
}

interface TemplateFormProps {
  template?: Template | null;
  onSubmit: (data: {
    name: string;
    title: string;
    description?: string;
    backgroundImage?: string;
    signatureImage?: string;
    isActive?: boolean;
  }) => void;
  onClose: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export default function TemplateForm({
  template,
  onSubmit,
  onClose,
  isSubmitting,
  error: submitError,
}: TemplateFormProps) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [signatureImage, setSignatureImage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Upload States
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  // Initialize fields if editing
  useEffect(() => {
    if (template) {
      setName(template.name || "");
      setTitle(template.title || "");
      setDescription(template.description || "");
      setBackgroundImage(template.backgroundImage || "");
      setSignatureImage(template.signatureImage || "");
      setIsActive(template.isActive !== false);
    } else {
      setName("");
      setTitle("");
      setDescription("");
      setBackgroundImage("");
      setSignatureImage("");
      setIsActive(true);
    }
  }, [template]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "background" | "signature") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB)
    const maxFileSize = 5 * 1024 * 1024;
    if (file.size > maxFileSize) {
      setValidationError("File size exceeds the 5 MB limit");
      return;
    }

    // Validate format
    const allowedExts = ["png", "jpg", "jpeg"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExts.includes(ext)) {
      setValidationError("Invalid file format. Only PNG, JPG, and JPEG images are allowed.");
      return;
    }

    setValidationError(null);
    if (type === "background") setIsUploadingBackground(true);
    else setIsUploadingSignature(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/upload/certificate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Failed to upload file");
      }

      if (type === "background") {
        setBackgroundImage(resData.url);
      } else {
        setSignatureImage(resData.url);
      }
    } catch (err: any) {
      setValidationError(err.message || "Failed to upload file");
    } finally {
      if (type === "background") setIsUploadingBackground(false);
      else setIsUploadingSignature(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError("Template name is required");
      return;
    }
    if (!title.trim()) {
      setValidationError("Certificate title is required");
      return;
    }

    onSubmit({
      name: name.trim(),
      title: title.trim(),
      description: description.trim() || undefined,
      backgroundImage: backgroundImage.trim() || undefined,
      signatureImage: signatureImage.trim() || undefined,
      isActive,
    });
  };

  const displayError = validationError || submitError;
  const isEditing = !!template;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-lg font-black text-slate-900">{isEditing ? "Edit Template" : "Create Certificate Template"}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Customize layouts for course certificates</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {displayError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs font-bold text-rose-700">
              {displayError}
            </div>
          )}

          {/* Template Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard Completion Layout"
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Certificate Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Certificate Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Certificate of Achievement"
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description / Body Text</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Awarded for successfully completing the curriculum and assessments."
              rows={3}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Background Image Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Background Image (Optional)</label>
            {backgroundImage ? (
              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={backgroundImage}
                    alt="Background Preview"
                    className="h-16 w-16 object-cover rounded-xl border border-slate-200 bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-700 truncate">Background Preview</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[150px]" title={backgroundImage}>
                      {backgroundImage}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <label className="px-3 py-1.5 bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
                    Replace
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, "background")}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setBackgroundImage("")}
                    className="px-3 py-1.5 bg-rose-50 text-[10px] font-bold text-rose-600 hover:bg-rose-100/50 rounded-xl transition-all cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {isUploadingBackground ? (
                  <div className="w-full bg-slate-50 border border-dashed border-slate-350 rounded-2xl py-6 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 text-indigo-650 animate-spin" />
                    <span className="text-[10px] text-slate-400 font-bold">Uploading background frame...</span>
                  </div>
                ) : (
                  <label className="w-full bg-slate-50 hover:bg-slate-100/50 border border-dashed border-slate-350 rounded-2xl py-6 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group">
                    <ImageIcon className="h-5 w-5 text-slate-400 group-hover:text-indigo-650 transition-colors" />
                    <span className="text-xs font-bold text-indigo-650">Choose Background Image</span>
                    <span className="text-[10px] text-slate-400 font-semibold">PNG, JPG, JPEG (Max 5MB)</span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, "background")}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Signature Image Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Signature Image (Optional)</label>
            {signatureImage ? (
              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={signatureImage}
                    alt="Signature Preview"
                    className="h-16 w-16 object-contain rounded-xl border border-slate-200 bg-white p-1"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-700 truncate">Signature Preview</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[150px]" title={signatureImage}>
                      {signatureImage}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <label className="px-3 py-1.5 bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
                    Replace
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, "signature")}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setSignatureImage("")}
                    className="px-3 py-1.5 bg-rose-50 text-[10px] font-bold text-rose-600 hover:bg-rose-100/50 rounded-xl transition-all cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {isUploadingSignature ? (
                  <div className="w-full bg-slate-50 border border-dashed border-slate-350 rounded-2xl py-6 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 text-indigo-650 animate-spin" />
                    <span className="text-[10px] text-slate-400 font-bold">Uploading signature image...</span>
                  </div>
                ) : (
                  <label className="w-full bg-slate-50 hover:bg-slate-100/50 border border-dashed border-slate-350 rounded-2xl py-6 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group">
                    <ImageIcon className="h-5 w-5 text-slate-400 group-hover:text-indigo-650 transition-colors" />
                    <span className="text-xs font-bold text-indigo-650">Choose Signature Image</span>
                    <span className="text-[10px] text-slate-400 font-semibold">PNG, JPG, JPEG (Max 5MB)</span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => handleFileUpload(e, "signature")}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Is Active Toggle */}
          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4.5 w-4.5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="isActive" className="text-sm font-bold text-slate-700 select-none cursor-pointer">
              Active and ready for use
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-605 hover:bg-slate-50 transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingBackground || isUploadingSignature}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100 disabled:opacity-50 cursor-pointer text-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {isEditing ? "Update Template" : "Create Template"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
