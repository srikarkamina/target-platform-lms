import React, { useState } from "react";
import { BookOpen, Search, ArrowRight } from "lucide-react";

interface CourseReportData {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  facultyName: string;
  studentCount: number;
  completionRate: number;
  averageProgress: number;
  averageQuizScore: number;
  submissionRate: number;
  quizzesCount: number;
  assignmentsCount: number;
}

interface CourseAnalyticsTableProps {
  courses: CourseReportData[];
  onViewDetails: (courseId: string) => void;
}

export default function CourseAnalyticsTable({
  courses,
  onViewDetails,
}: CourseAnalyticsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = courses.filter(
    (c) =>
      c.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.facultyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search Header toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by course title, code, or faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
        <div className="text-xs text-slate-500 font-bold font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          {filteredCourses.length} of {courses.length} courses
        </div>
      </div>

      {/* Table view */}
      {filteredCourses.length === 0 ? (
        <div className="text-center p-16 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No courses found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "No course records match your search criteria. Try modifying your filters."
              : "No course records exist in this academy reports list."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Course Info</th>
                  <th className="px-6 py-4">Faculty</th>
                  <th className="px-6 py-4 text-center">Students</th>
                  <th className="px-6 py-4 text-center">Avg Progress</th>
                  <th className="px-6 py-4 text-center">Graduation</th>
                  <th className="px-6 py-4 text-center">Quiz Avg</th>
                  <th className="px-6 py-4 text-center">Submission Rate</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-750">
                {filteredCourses.map((c) => (
                  <tr key={c.courseId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 leading-tight">{c.courseTitle}</p>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md mt-1.5 font-mono">
                        {c.courseCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {c.facultyName}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap font-mono text-slate-800 font-bold">
                      {c.studentCount}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-mono font-bold text-slate-700">{c.averageProgress}%</span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${c.averageProgress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-xs font-bold font-mono ${
                        c.completionRate >= 80
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : c.completionRate >= 40
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            : "bg-slate-50 text-slate-500 border border-slate-200"
                      }`}>
                        {c.completionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap font-mono font-bold text-slate-800">
                      {c.averageQuizScore > 0 ? `${c.averageQuizScore}%` : "—"}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap font-mono font-bold text-slate-850">
                      {c.submissionRate > 0 ? `${c.submissionRate}%` : "—"}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onViewDetails(c.courseId)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                      >
                        <span>Drill-down</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
