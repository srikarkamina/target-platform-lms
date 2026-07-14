import React, { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Users, CheckCircle2, Medal } from "lucide-react";

interface StudentPerformance {
  studentName: string;
  email: string;
  course: string;
  quizAverage: number;
  certificatesEarned: number;
  progressPercentage: number;
}

interface StudentTableProps {
  students: StudentPerformance[];
}

export default function StudentTable({ students }: StudentTableProps) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter students based on search string
  const filteredStudents = students.filter(
    (s) =>
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.course.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset page when search term changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header & Search */}
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <span>Student Performance Standings</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Review coursework progresses, quiz scores, and certificate standings sorted by highest progress %
          </p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, email, or course..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1">
        {paginatedStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 italic text-xs">
            No student performance records found matching your query.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full border-collapse text-left text-xs text-slate-650">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Student Profile</th>
                    <th className="px-6 py-4">Academic Course</th>
                    <th className="px-6 py-4 text-center">Quiz Average</th>
                    <th className="px-6 py-4 text-center">Certificates Earned</th>
                    <th className="px-6 py-4 text-right">Course Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                  {paginatedStudents.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-slate-800 text-sm">{s.studentName}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.email}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {s.course}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-850 text-sm">
                          {s.quizAverage > 0 ? `${s.quizAverage}%` : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-bold font-mono ${
                          s.certificatesEarned > 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-slate-50 text-slate-400 border border-slate-200"
                        }`}>
                          {s.certificatesEarned > 0 ? (
                            <>
                              <Medal className="h-3 w-3" />
                              <span>{s.certificatesEarned} Earned</span>
                            </>
                          ) : (
                            "None"
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-bold font-mono ${
                            s.progressPercentage === 100
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              : s.progressPercentage > 0
                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                : "bg-slate-50 text-slate-400 border border-slate-200"
                          }`}>
                            {s.progressPercentage === 100 && <CheckCircle2 className="h-3 w-3 text-indigo-650" />}
                            {s.progressPercentage}%
                          </span>
                          <div className="w-16 bg-slate-100 rounded-full h-1 overflow-hidden">
                            <div
                              className={`h-1 rounded-full ${
                                s.progressPercentage === 100 ? "bg-indigo-600" : "bg-blue-500"
                              }`}
                              style={{ width: `${s.progressPercentage}%` }}
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
            <div className="block md:hidden divide-y divide-slate-100 bg-white">
              {paginatedStudents.map((s, idx) => (
                <div key={idx} className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-800 text-sm truncate">{s.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{s.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-2xs font-bold font-mono ${
                        s.progressPercentage === 100
                          ? "bg-indigo-50 text-indigo-750 border border-indigo-150"
                          : s.progressPercentage > 0
                            ? "bg-blue-50 text-blue-750 border border-blue-150"
                            : "bg-slate-50 text-slate-555 border border-slate-200"
                      }`}>
                        {s.progressPercentage}%
                      </span>
                      <div className="w-12 bg-slate-100 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-1 rounded-full ${
                            s.progressPercentage === 100 ? "bg-indigo-600" : "bg-blue-500"
                          }`}
                          style={{ width: `${s.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                    <div className="space-y-1">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Academic Course</p>
                      <p className="font-bold text-slate-700 truncate" title={s.course}>{s.course}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Quiz Average</p>
                      <p className="font-bold text-slate-800 font-mono">
                        {s.quizAverage > 0 ? `${s.quizAverage}%` : "—"}
                      </p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Certificates Earned</p>
                      <div>
                        <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-2xs font-bold font-mono ${
                          s.certificatesEarned > 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-150"
                            : "bg-slate-50 text-slate-500 border border-slate-200"
                        }`}>
                          {s.certificatesEarned > 0 ? (
                            <>
                              <Medal className="h-3 w-3 text-emerald-650" />
                              <span>{s.certificatesEarned} Earned</span>
                            </>
                          ) : (
                            "None"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
          <p className="text-[11px] text-slate-500 font-bold font-mono uppercase tracking-wider">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStudents.length)} of {filteredStudents.length} Students
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-extrabold text-slate-700 font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
