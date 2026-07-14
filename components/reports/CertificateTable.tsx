import React from "react";
import { Medal, BookOpen, CheckCircle, XCircle } from "lucide-react";

interface CertificateData {
  certificateId: string;
  certificateName: string;
  courseCode: string;
  courseTitle: string;
  issueDate: string | Date;
  verificationStatus: "Verified" | "Revoked";
  certificateNumber: string;
  certificateCode: string;
}

interface CertificateTableProps {
  certificates: CertificateData[];
}

export default function CertificateTable({ certificates }: CertificateTableProps) {
  const formatDate = (dateVal: string | Date) => {
    const date = new Date(dateVal);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (certificates.length === 0) {
    return (
      <div className="text-center p-12 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <Medal className="mx-auto h-12 w-12 text-slate-300 mb-3" />
        <h3 className="text-sm font-bold text-slate-800">No certificates earned</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Complete all lessons of a course to earn and view certificates of completion.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
            <tr>
              <th className="px-6 py-4">Certificate Name</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4 text-center">Certificate No.</th>
              <th className="px-6 py-4 text-center">Issue Date</th>
              <th className="px-6 py-4 text-right">Verification Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-750">
            {certificates.map((cert) => (
              <tr key={cert.certificateId} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900 leading-tight">{cert.certificateName}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                    <BookOpen className="h-3 w-3" />
                    <span>{cert.courseCode}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap font-mono text-slate-500">
                  {cert.certificateNumber}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap font-mono text-slate-700">
                  {formatDate(cert.issueDate)}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold tracking-wide border ${
                    cert.verificationStatus === "Verified"
                      ? "bg-emerald-50 text-emerald-750 border-emerald-200"
                      : "bg-rose-50 text-rose-750 border-rose-200"
                  }`}>
                    {cert.verificationStatus === "Verified" ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    <span>{cert.verificationStatus}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked List View */}
      <div className="block md:hidden divide-y divide-slate-100 bg-white">
        {certificates.map((cert) => (
          <div key={cert.certificateId} className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900 leading-tight">{cert.certificateName}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md mt-1.5 font-mono">
                  {cert.courseCode}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold tracking-wide border ${
                cert.verificationStatus === "Verified"
                  ? "bg-emerald-50 text-emerald-750 border-emerald-200"
                  : "bg-rose-50 text-rose-750 border-rose-200"
              }`}>
                <span>{cert.verificationStatus}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Certificate No.</p>
                <p className="font-bold text-slate-700 font-mono">{cert.certificateNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Issued On</p>
                <p className="font-bold text-slate-650 font-mono">{formatDate(cert.issueDate)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
