import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { 
  User, 
  Users, 
  BookOpen, 
  ClipboardList, 
  HelpCircle, 
  Medal, 
  FileText, 
  Play, 
  Bell, 
  BarChart3 
} from "lucide-react";

interface SearchResultItemProps {
  item: any;
  type: string;
  userRole: string;
  isActive: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

const ENTITY_METADATA: Record<string, { label: string; icon: any; colorClass: string }> = {
  students: { label: "Student", icon: User, colorClass: "bg-blue-50 text-blue-750 border-blue-200" },
  faculty: { label: "Faculty", icon: Users, colorClass: "bg-purple-50 text-purple-750 border-purple-200" },
  courses: { label: "Course", icon: BookOpen, colorClass: "bg-indigo-50 text-indigo-750 border-indigo-200" },
  assignments: { label: "Assignment", icon: ClipboardList, colorClass: "bg-amber-50 text-amber-755 border-amber-200" },
  quizzes: { label: "Quiz", icon: HelpCircle, colorClass: "bg-rose-50 text-rose-750 border-rose-200" },
  certificates: { label: "Certificate", icon: Medal, colorClass: "bg-emerald-50 text-emerald-755 border-emerald-200" },
  certificateTemplates: { label: "Template", icon: FileText, colorClass: "bg-slate-100 text-slate-700 border-slate-300" },
  videos: { label: "Video", icon: Play, colorClass: "bg-sky-50 text-sky-750 border-sky-200" },
  studyMaterials: { label: "Material", icon: FileText, colorClass: "bg-teal-50 text-teal-750 border-teal-200" },
  notifications: { label: "Notification", icon: Bell, colorClass: "bg-red-50 text-red-750 border-red-200" },
  reports: { label: "Report", icon: BarChart3, colorClass: "bg-indigo-50 text-indigo-750 border-indigo-200" },
};

export default function SearchResultItem({
  item,
  type,
  userRole,
  isActive,
  onMouseEnter,
  onClick,
}: SearchResultItemProps) {
  const elementRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (isActive && elementRef.current) {
      elementRef.current.scrollIntoView({
        behavior: "auto",
        block: "nearest",
      });
    }
  }, [isActive]);

  const meta = ENTITY_METADATA[type] || { label: "Record", icon: FileText, colorClass: "bg-slate-50 text-slate-700 border-slate-200" };
  const Icon = meta.icon;

  const title = item.title || item.name || item.studentName || item.certificateNumber || "Untitled";
  const subtitle = item.description || item.email || item.code || item.message || null;

  const href = getEntityLink(item, type, userRole);

  return (
    <Link
      ref={elementRef}
      href={href}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`flex items-center gap-3.5 px-4 py-3 border-l-4 transition-all duration-150 outline-hidden select-none ${
        isActive
          ? "bg-indigo-50/70 border-indigo-600 text-indigo-950 font-medium"
          : "border-transparent text-slate-700 hover:bg-slate-50/80"
      }`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all ${
        isActive 
          ? "bg-indigo-600 border-indigo-550 text-white" 
          : "bg-slate-50 border-slate-200 text-slate-400"
      }`}>
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-extrabold text-sm truncate leading-tight">{title}</p>
          {item.courseCode && (
            <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-150 px-1 py-0.5 rounded uppercase font-mono tracking-wider shrink-0">
              {item.courseCode}
            </span>
          )}
        </div>
        {subtitle && (
          <p className={`text-xs truncate mt-0.5 font-medium ${
            isActive ? "text-indigo-700/80" : "text-slate-400"
          }`}>
            {subtitle}
          </p>
        )}
      </div>

      <span className={`rounded-lg border px-2 py-0.5 text-[9px] font-extrabold uppercase font-mono tracking-wider shrink-0 select-none ${meta.colorClass}`}>
        {meta.label}
      </span>
    </Link>
  );
}

export function getEntityLink(item: any, type: string, userRole: string): string {
  if (item.link) return item.link;

  switch (type) {
    case "students":
      return `/dashboard/students`;
    case "faculty":
      return `/dashboard`;
    case "courses":
      return userRole === "STUDENT" 
        ? `/dashboard/courses/${item.id}/learn` 
        : `/dashboard/courses/${item.id}`;
    case "assignments":
      return `/dashboard/assignments/${item.id}`;
    case "quizzes":
      return userRole === "STUDENT"
        ? `/dashboard/student/quizzes/${item.id}`
        : `/dashboard/quizzes`;
    case "certificates":
      return `/dashboard/certificates`;
    case "certificateTemplates":
      return `/dashboard/certificate-templates`;
    case "videos":
      return userRole === "STUDENT"
        ? `/dashboard/courses/${item.courseId}/learn/videos/${item.id}`
        : `/dashboard/videos`;
    case "studyMaterials":
      return `/dashboard/materials`;
    case "notifications":
      return `/dashboard/notifications`;
    default:
      return `/dashboard`;
  }
}
