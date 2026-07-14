import React from "react";
import { X, Award, ShieldCheck, ShieldAlert, Printer } from "lucide-react";

interface Template {
  name: string;
  title: string;
  description?: string | null;
  backgroundImage?: string | null;
  signatureImage?: string | null;
}

interface TemplatePreviewProps {
  template: Template;
  studentName?: string;
  courseTitle?: string;
  issueDate?: string | Date;
  certificateNumber?: string;
  status?: "ACTIVE" | "REVOKED";
  onClose: () => void;
}

export default function TemplatePreview({
  template,
  studentName = "Alex Mercer",
  courseTitle = "Advanced Multi-Tenant Systems Engineering",
  issueDate = new Date(),
  certificateNumber = "CERT-2026-XXXXXX",
  status = "ACTIVE",
  onClose,
}: TemplatePreviewProps) {
  const formattedDate = new Date(issueDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = () => {
    if (status === "REVOKED") return;
    window.print();
  };

  const isRevoked = status === "REVOKED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 font-sans print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-200 print:shadow-none print:border-none print:rounded-none">
        
        {/* Header - Hidden in Print */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" />
            <span className="font-black text-slate-800 text-sm tracking-tight">Certificate Viewer</span>
          </div>
          <div className="flex items-center gap-2">
            {!isRevoked && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print / Save PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Warning Banner for Revoked Certificates - Hidden in Print */}
        {isRevoked && (
          <div className="bg-rose-50 border-b border-rose-150 px-6 py-4 flex items-start gap-3 print:hidden shrink-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-rose-850 uppercase tracking-widest">Certificate Revoked</h4>
              <p className="text-xs text-rose-600 font-bold mt-0.5">
                This certificate has been revoked by the issuing institute and is no longer valid. Downloads, printing, and sharing have been disabled.
              </p>
            </div>
          </div>
        )}

        {/* Certificate Landscape Box */}
        <div className="p-8 flex items-center justify-center bg-slate-100/50 print:bg-white print:p-0 overflow-y-auto">
          {isRevoked ? (
            /* Revoked Overlay print blocker */
            <div className="hidden print:flex flex-col items-center justify-center text-center p-12">
              <ShieldAlert className="h-16 w-16 text-rose-600 mb-4" />
              <h1 className="text-2xl font-black text-slate-900">CERTIFICATE REVOKED</h1>
              <p className="text-sm text-slate-500 mt-2">This credential is no longer valid and cannot be printed.</p>
            </div>
          ) : null}

          <div
            id="certificate-print-area"
            className={`relative w-full aspect-[1.414/1] max-w-3xl bg-white border-8 md:border-[16px] border-double border-indigo-950 p-4 sm:p-8 md:p-12 flex flex-col justify-between items-center text-center shadow-lg print:shadow-none print:border-indigo-950 ${isRevoked ? "print:hidden opacity-75 grayscale-[50%]" : ""}`}
            style={
              template.backgroundImage
                ? {
                    backgroundImage: `url(${template.backgroundImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {/* Top Badge */}
            <div className="flex flex-col items-center">
              <Award className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-indigo-900 mb-1 md:mb-2" />
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">TARGET LMS Network</p>
            </div>

            {/* Main Content */}
            <div className="space-y-1.5 sm:space-y-3 md:space-y-4 my-auto">
              <h1 className="text-xs sm:text-2xl md:text-3xl font-serif font-black text-indigo-950 tracking-wide uppercase leading-tight">
                {template.title || "Certificate of Excellence"}
              </h1>
              <p className="text-[8px] sm:text-xs font-medium text-slate-400 italic">This is proudly presented to</p>
              <h2 className="text-sm sm:text-2xl md:text-3xl font-sans font-black text-slate-900 tracking-tight border-b sm:border-b-2 border-indigo-950/20 pb-0.5 sm:pb-2 max-w-xs sm:max-w-lg mx-auto">
                {studentName}
              </h2>
              <p className="text-[9px] sm:text-xs md:text-sm text-slate-500 max-w-xs sm:max-w-md mx-auto leading-relaxed">
                {template.description || "for successfully meeting all academic requirements, assessments, and practical implementations for the curriculum of"}
              </p>
              <h3 className="text-xs sm:text-base md:text-lg font-bold text-indigo-900 tracking-tight">{courseTitle}</h3>
            </div>

            {/* Bottom Signature & Verification Info */}
            <div className="w-full flex justify-between items-end mt-2 md:mt-4">
              {/* Verification Info */}
              <div className="text-left space-y-0.5 sm:space-y-1">
                <span className="flex items-center gap-1 text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <ShieldCheck className="h-3 sm:h-3.5 sm:w-3.5 text-indigo-600" /> Secure Verification
                </span>
                <p className="text-[9px] sm:text-xs font-black text-slate-800 tracking-tight">{certificateNumber}</p>
                <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Issued: {formattedDate}</p>
              </div>

              {/* Signature */}
              <div className="flex flex-col items-center">
                {template.signatureImage ? (
                  <img
                    src={template.signatureImage}
                    alt="Authorized Signature"
                    className="h-6 sm:h-12 md:h-14 object-contain max-w-[80px] sm:max-w-[150px] mb-0.5 sm:mb-1"
                  />
                ) : (
                  <div className="h-6 sm:h-12 w-20 sm:w-32 border-b sm:border-b-2 border-slate-300 border-dashed mb-0.5 sm:mb-1" />
                )}
                <span className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Authorized Dean</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
