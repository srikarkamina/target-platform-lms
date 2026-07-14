import React from "react";
import { FileText, Download } from "lucide-react";

interface FileAttachmentCardProps {
  fileName: string | null;
  fileUrl: string | null;
  fileSize?: number | string | null;
  submittedAt?: string | Date | null;
  mimeType?: string | null;
  extension?: string;
}

export default function FileAttachmentCard({
  fileName,
  fileUrl,
  fileSize,
  submittedAt,
  extension,
}: FileAttachmentCardProps) {
  const getExtension = (name: string) => {
    const parts = name.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  };

  const getFileTypeLabel = (ext: string) => {
    switch (ext) {
      case "doc":
      case "docx":
        return "Microsoft Word Document";
      case "pdf":
        return "PDF Document";
      case "ppt":
      case "pptx":
        return "PowerPoint Presentation";
      case "xls":
      case "xlsx":
        return "Excel Spreadsheet";
      case "zip":
      case "rar":
        return "Archive File";
      case "txt":
        return "Text Document";
      default:
        return "Document";
    }
  };

  const formatDate = (dateVal: string | Date) => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return String(dateVal);
    }
  };

  const formatSize = (bytes: number | null | undefined) => {
    if (bytes === null || bytes === undefined) return "";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const name = fileName || "attachment";
  const ext = extension || getExtension(name);
  const fileTypeLabel = getFileTypeLabel(ext);
  const sizeText = typeof fileSize === "number" ? formatSize(fileSize) : fileSize || "";

  let iconBg = "bg-slate-100 text-slate-600 border border-slate-200";
  if (ext === "pdf") {
    iconBg = "bg-rose-50 text-rose-600 border border-rose-100";
  } else if (ext === "doc" || ext === "docx") {
    iconBg = "bg-blue-50 text-blue-600 border border-blue-100";
  } else if (ext === "ppt" || ext === "pptx") {
    iconBg = "bg-amber-50 text-amber-600 border border-amber-100";
  } else if (ext === "xls" || ext === "xlsx") {
    iconBg = "bg-emerald-50 text-emerald-600 border border-emerald-100";
  } else if (ext === "zip" || ext === "rar") {
    iconBg = "bg-indigo-50 text-indigo-600 border border-indigo-100";
  }

  const formattedDate = submittedAt ? formatDate(submittedAt) : "";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-5 text-left font-sans">
      <div className="flex items-start gap-4">
        {/* Document Icon */}
        <div className={`p-3 rounded-xl shrink-0 ${iconBg} flex items-center justify-center`}>
          <FileText className="h-10 w-10 shrink-0" />
        </div>
        
        {/* Metadata Details */}
        <div className="min-w-0 flex-1 space-y-1">
          <h4 className="text-base font-bold text-slate-800 break-all leading-snug">
            {name}
          </h4>
          <p className="text-xs text-slate-500 font-semibold">
            {fileTypeLabel}
          </p>
          <p className="text-xs text-slate-400 font-medium">
            {sizeText}{sizeText && formattedDate ? " • " : ""}{formattedDate ? `Submitted ${formattedDate}` : ""}
          </p>
        </div>
      </div>
      
      {/* Centered Centric Download Action */}
      <a
        href={fileUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        download={name}
        className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 text-sm font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] transition-colors rounded-xl shadow-xs cursor-pointer border-none font-sans"
      >
        <Download className="h-4.5 w-4.5" />
        <span>Download File</span>
      </a>
    </div>
  );
}
