import React, { useState } from "react";
import { Search, BookOpen } from "lucide-react";

interface CourseAnalytic {
  id: string;
  courseCode: string;
  courseName: string;
  studentsEnrolled: number;
  certificatesIssued: number;
  averageQuizScore: number;
  completionPercentage: number;
}

interface CourseTableProps {
  courses: CourseAnalytic[];
}

export default function CourseTable({ courses }: CourseTableProps) {
  const [search, setSearch] = useState("");

  const filteredCourses = courses.filter(
    (c) =>
      c.courseName.toLowerCase().includes(search.toLowerCase()) ||
      c.courseCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header & Search */}
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <span>Course Performance Registry</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Aggregated learning and completion analytics for all active curriculum courses
          </p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by course name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1">
        {filteredCourses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 italic text-xs">
            No course records found matching your query.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full border-collapse text-left text-xs text-slate-655">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Course Info</th>
                    <th className="px-6 py-4 text-center">Students Enrolled</th>
                    <th className="px-6 py-4 text-center">Certificates Issued</th>
                    <th className="px-6 py-4 text-center">Average Quiz Score</th>
                    <th className="px-6 py-4 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                  {filteredCourses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                          {c.courseCode}
                        </span>
                        <p className="font-extrabold text-slate-800 text-sm mt-1.5">{c.courseName}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-slate-700 text-sm">
                        {c.studentsEnrolled}
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-slate-700 text-sm">
                        {c.certificatesIssued}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-800 text-sm">
                          {c.averageQuizScore > 0 ? `${c.averageQuizScore}%` : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-bold font-mono ${
                            c.completionPercentage >= 70
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : c.completionPercentage >= 35
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-slate-50 text-slate-400 border border-slate-200"
                          }`}>
                            {c.completionPercentage}%
                          </span>
                          <div className="w-16 bg-slate-100 rounded-full h-1 overflow-hidden">
                            <div
                              className={`h-1 rounded-full ${
                                c.completionPercentage >= 70 ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${c.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="block md:hidden divide-y divide-slate-150 bg-white">
              {filteredCourses.map((c) => (
                <div key={c.id} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                        {c.courseCode}
                      </span>
                      <p className="font-extrabold text-slate-800 text-sm mt-1.5 leading-snug truncate" title={c.courseName}>
                        {c.courseName}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-2xs font-bold font-mono ${
                        c.completionPercentage >= 70
                          ? "bg-emerald-50 text-emerald-750 border border-emerald-150"
                          : c.completionPercentage >= 35
                            ? "bg-amber-50 text-amber-750 border border-amber-150"
                            : "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}>
                        {c.completionPercentage}%
                      </span>
                      <div className="w-12 bg-slate-100 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-1 rounded-full ${
                            c.completionPercentage >= 70 ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${c.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                    <div className="space-y-1">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] leading-tight">Students</p>
                      <p className="font-bold text-slate-705 font-mono text-sm">{c.studentsEnrolled}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] leading-tight">Certificates</p>
                      <p className="font-bold text-slate-705 font-mono text-sm">{c.certificatesIssued}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] leading-tight">Quiz Avg</p>
                      <p className="font-bold text-slate-800 font-mono text-sm">
                        {c.averageQuizScore > 0 ? `${c.averageQuizScore}%` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
