import React from "react";
import { Eye, ShieldAlert, Calendar, User, BookOpen, Hash, Download } from "lucide-react";

interface Certificate {
  id: string;
  certificateNumber: string;
  certificateCode: string;
  issueDate: string | Date;
  status: "ACTIVE" | "REVOKED";
  student: {
    name: string;
    email: string;
  };
  course: {
    title: string;
    courseCode: string;
  };
}

interface CertificateTableProps {
  certificates: Certificate[];
  isLoading: boolean;
  onRevoke: (id: string) => void;
  onView: (id: string) => void;
  onDownload?: (id: string) => void;
  isAdmin?: boolean;
  canRevoke?: boolean;
}

export default function CertificateTable({
  certificates,
  isLoading,
  onRevoke,
  onView,
  onDownload,
  isAdmin = true,
  canRevoke = true,
}: CertificateTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-6 font-sans">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-4 bg-slate-200 rounded-md"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-4 bg-slate-200 rounded-md col-span-2"></div>
                <div className="h-4 bg-slate-200 rounded-md col-span-1"></div>
              </div>
              <div className="h-4 bg-slate-200 rounded-md"></div>
            </div>
            <div className="h-4 bg-slate-200 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs font-sans">
        <AwardFallbackIcon />
        <h3 className="text-lg font-bold text-slate-800 mt-4">No certificates found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          We could not find any issued certificates. Try adjusting your search query, status filters, or issue a new certificate.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs font-sans">
      {/* Desktop view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4">Certificate Details</th>
              {isAdmin && <th className="px-6 py-4">Student</th>}
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Issue Date</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {certificates.map((cert) => (
              <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-slate-400" />
                    {cert.certificateNumber}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Code: {cert.certificateCode}</div>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-805">{cert.student.name}</div>
                    <div className="text-xs text-slate-500">{cert.student.email}</div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800 line-clamp-1">{cert.course.title}</div>
                  <div className="text-xs text-slate-400 font-medium">{cert.course.courseCode}</div>
                  {!isAdmin && cert.status === "REVOKED" && (
                    <div className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5 mt-1 inline-flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      This certificate has been revoked by the issuing institute.
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {new Date(cert.issueDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                        cert.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${cert.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"}`} />
                      {cert.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* View Button */}
                    <button
                      onClick={() => onView(cert.id)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="View Certificate"
                    >
                      <Eye className="h-4.5 w-4.5" />
                    </button>

                    {/* Download Button */}
                    {cert.status === "ACTIVE" ? (
                      <button
                        onClick={() => onDownload && onDownload(cert.id)}
                        className="p-1.5 hover:bg-slate-100 text-indigo-650 hover:text-indigo-900 rounded-lg transition-colors cursor-pointer"
                        title="Download / Print Certificate"
                      >
                        <Download className="h-4.5 w-4.5" />
                      </button>
                    ) : (
                      /* Only show disabled download in student portal (when !isAdmin) */
                      !isAdmin && (
                        <div className="relative group inline-block">
                          <button
                            disabled
                            className="p-1.5 text-slate-300 cursor-not-allowed rounded-lg opacity-50"
                          >
                            <Download className="h-4.5 w-4.5" />
                          </button>
                          {/* Animated Tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 bg-slate-900 text-white text-xs rounded-xl shadow-xl p-3 z-50 whitespace-normal min-w-[220px] text-left leading-normal border border-slate-800">
                            <div className="font-extrabold text-[10px] uppercase tracking-wider text-rose-450 border-b border-slate-800 pb-1 mb-1">
                              Download unavailable
                            </div>
                            <div className="font-bold text-[10px] text-slate-350">
                              This certificate has been revoked by the issuing institute.
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                          </div>
                        </div>
                      )
                    )}

                    {/* Revoke Button */}
                    {canRevoke && cert.status === "ACTIVE" && (
                      <button
                        onClick={() => onRevoke(cert.id)}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Revoke Certificate"
                      >
                        <ShieldAlert className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className="block md:hidden divide-y divide-slate-100">
        {certificates.map((cert) => (
          <div key={cert.id} className="p-5 hover:bg-slate-50/50 transition-colors space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold border ${
                    cert.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {cert.status}
                </span>
                <h4 className="font-black text-slate-900 text-sm mt-1">{cert.certificateNumber}</h4>
                <p className="text-2xs text-slate-400 mt-0.5">Code: {cert.certificateCode}</p>
              </div>
              <div className="flex items-center gap-1">
                {/* View Button */}
                <button
                  onClick={() => onView(cert.id)}
                  className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl cursor-pointer"
                  title="View"
                >
                  <Eye className="h-4.5 w-4.5" />
                </button>

                {/* Download Button */}
                {cert.status === "ACTIVE" ? (
                  <button
                    onClick={() => onDownload && onDownload(cert.id)}
                    className="p-2 hover:bg-slate-100 text-indigo-650 hover:text-indigo-900 rounded-xl cursor-pointer"
                    title="Download"
                  >
                    <Download className="h-4.5 w-4.5" />
                  </button>
                ) : (
                  /* Only show disabled download in student portal (when !isAdmin) */
                  !isAdmin && (
                    <div className="relative group inline-block">
                      <button
                        disabled
                        className="p-2 text-slate-300 cursor-not-allowed rounded-xl opacity-50"
                      >
                        <Download className="h-4.5 w-4.5" />
                      </button>
                      {/* Animated Tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 bg-slate-900 text-white text-xs rounded-xl shadow-xl p-3 z-50 whitespace-normal min-w-[220px] text-left leading-normal border border-slate-800">
                        <div className="font-extrabold text-[10px] uppercase tracking-wider text-rose-450 border-b border-slate-800 pb-1 mb-1">
                          Download unavailable
                        </div>
                        <div className="font-bold text-[10px] text-slate-355">
                          This certificate has been revoked by the issuing institute.
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                      </div>
                    </div>
                  )
                )}

                {/* Revoke Button */}
                {canRevoke && cert.status === "ACTIVE" && (
                  <button
                    onClick={() => onRevoke(cert.id)}
                    className="p-2 hover:bg-rose-50 text-rose-600 rounded-xl cursor-pointer"
                    title="Revoke"
                  >
                    <ShieldAlert className="h-4.5 w-4.5" />
                  </button>
                )}
              </div>
            </div>

            <div className={`grid ${isAdmin ? "grid-cols-2" : "grid-cols-1"} gap-3 text-xs`}>
              {isAdmin && (
                <div className="space-y-1">
                  <span className="text-2xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <User className="h-3 w-3" /> Student
                  </span>
                  <p className="font-bold text-slate-700 line-clamp-1">{cert.student.name}</p>
                </div>
              )}
              <div className="space-y-1">
                <span className="text-2xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> Course
                </span>
                <p className="font-bold text-slate-700 line-clamp-1">{cert.course.title}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-2xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Issue Date
                </span>
                <p className="font-bold text-slate-700">
                  {new Date(cert.issueDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {!isAdmin && cert.status === "REVOKED" && (
              <div className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded p-2 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                This certificate has been revoked by the issuing institute.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AwardFallbackIcon() {
  return (
    <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
      <Eye className="h-6 w-6" />
    </div>
  );
}
