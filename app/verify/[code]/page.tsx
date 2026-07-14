import React from "react";
import { prisma } from "@/lib/prisma";
import { ShieldCheck, ShieldAlert, Award, Calendar, User, BookOpen, Building2 } from "lucide-react";

interface VerifyPageProps {
  params: Promise<{ code: string }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { code } = await params;

  // Search by code, number, or ID
  const cert = await prisma.certificate.findFirst({
    where: {
      OR: [
        { certificateCode: code },
        { certificateNumber: code },
        { id: code },
      ],
      deletedAt: null,
    },
    include: {
      student: {
        select: {
          name: true,
          email: true,
        },
      },
      course: {
        select: {
          title: true,
          courseCode: true,
        },
      },
      institute: {
        select: {
          name: true,
        },
      },
    },
  });

  const formattedDate = cert
    ? new Date(cert.issueDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      {/* Top Header Logo */}
      <header className="py-6 px-8 border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <Award className="h-7 w-7 text-indigo-600" />
          <span className="text-lg font-black text-slate-850 tracking-tight">TARGET Verification Portal</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col animate-in fade-in duration-300">
          
          {!cert ? (
            /* CASE 1: Certificate Not Found */
            <div className="p-8 md:p-12 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-black text-slate-900">Credential Not Found</h2>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  The certificate code <span className="font-mono font-bold text-indigo-650 bg-indigo-50 px-1 rounded">{code}</span> could not be found or validated. Check the URL parameters for errors.
                </p>
              </div>
            </div>
          ) : cert.status === "REVOKED" ? (
            /* CASE 2: Certificate Revoked */
            <>
              {/* Alert Status Banner */}
              <div className="bg-rose-50 border-b border-rose-150 p-6 md:p-8 text-center space-y-3 shrink-0">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 animate-pulse">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-rose-800 bg-rose-200/50 border border-rose-200 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                    Status: REVOKED
                  </span>
                  <h2 className="text-xl font-black text-rose-950 mt-1">Certificate Revoked</h2>
                  <p className="text-xs text-rose-600 font-bold max-w-sm mx-auto leading-relaxed">
                    Warning: This certificate has been revoked by the issuing institute. This certificate should not be considered valid.
                  </p>
                </div>
              </div>

              {/* Revoked Credentials Details Listing */}
              <div className="p-6 md:p-8 space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                  Historical Records
                </h3>
                <div className="space-y-4 text-xs font-medium text-slate-700">
                  <div className="flex gap-4">
                    <Building2 className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-450 uppercase text-[9px] tracking-wider font-bold">Issuing Academy</p>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">{cert.institute.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <User className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-450 uppercase text-[9px] tracking-wider font-bold">Recipient Student</p>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">{cert.student.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <BookOpen className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-450 uppercase text-[9px] tracking-wider font-bold">Curriculum Course</p>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">[{cert.course.courseCode}] {cert.course.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-450 uppercase text-[9px] tracking-wider font-bold">Date of Issue</p>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">{formattedDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* CASE 3: Certificate Verified / Active */
            <>
              {/* Success Status Banner */}
              <div className="bg-emerald-50 border-b border-emerald-150 p-6 md:p-8 text-center space-y-3 shrink-0">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-200/50 border border-emerald-250 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                    Status: VERIFIED & ACTIVE
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">Certificate Authenticated</h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                    This certificate is verified as an authentic, active credential issued by {cert.institute.name}.
                  </p>
                </div>
              </div>

              {/* Verified Certificate Details */}
              <div className="p-6 md:p-8 space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                  Credential Details
                </h3>
                <div className="space-y-4 text-xs font-medium text-slate-700">
                  <div className="flex gap-4">
                    <Building2 className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-450 uppercase text-[9px] tracking-wider font-bold">Issuing Academy</p>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">{cert.institute.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <User className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-450 uppercase text-[9px] tracking-wider font-bold">Recipient Student</p>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">{cert.student.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <BookOpen className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-450 uppercase text-[9px] tracking-wider font-bold">Curriculum Course</p>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">[{cert.course.courseCode}] {cert.course.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-450 uppercase text-[9px] tracking-wider font-bold">Date of Issue</p>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">{formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 border-t border-slate-100 pt-4">
                    <Award className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-450 uppercase text-[9px] tracking-wider font-bold">Certificate ID / Number</p>
                      <p className="font-mono font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 rounded px-2 py-1 mt-1 block w-fit text-xs">
                        {cert.certificateNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      {/* Bottom Footer Info */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
        © {new Date().getFullYear()} TARGET LMS. All Rights Reserved.
      </footer>
    </div>
  );
}
