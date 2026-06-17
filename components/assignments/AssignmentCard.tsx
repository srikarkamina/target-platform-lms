"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, Edit2, Trash2, BookOpen } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | Date | null;
  courseId: string;
  createdAt: string;
  course: {
    id: string;
    title: string;
    courseCode: string;
  };
}

interface AssignmentCardProps {
  assignment: Assignment;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
  isManagementRole?: boolean;
}

export default function AssignmentCard({
  assignment,
  onEdit,
  onDelete,
  isManagementRole = false,
}: AssignmentCardProps) {
  const formatDueDate = (dateVal?: string | Date | null) => {
    if (!dateVal) return "No due date";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "No due date";

    // Format like "Jun 18, 2026 at 5:00 PM"
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const [overdue, setOverdue] = useState(false);

  useEffect(() => {
    if (assignment.dueDate) {
      const d = new Date(assignment.dueDate);
      if (!isNaN(d.getTime())) {
        setTimeout(() => {
          setOverdue(d.getTime() < Date.now());
        }, 0);
      }
    }
  }, [assignment.dueDate]);

  return (
    <div className="bg-white rounded-2xl border border-slate-150 p-6 flex flex-col hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between gap-4 mb-3">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600 uppercase tracking-wide">
          <BookOpen className="h-3 w-3" />
          {assignment.course.courseCode}
        </span>

        {assignment.dueDate && (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              overdue
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            <Clock className="h-3 w-3" />
            {overdue ? "Overdue" : "Active"}
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
        {assignment.title}
      </h3>

      <p className="text-slate-500 text-sm mt-2 line-clamp-3 flex-1 mb-4">
        {assignment.description || "No instructions provided."}
      </p>

      <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-auto">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
          <span>Due: </span>
          <span className={`font-semibold ${overdue ? "text-rose-600" : "text-slate-700"}`}>
            {formatDueDate(assignment.dueDate)}
          </span>
        </div>

        {isManagementRole ? (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => onEdit(assignment)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
              title="Edit Assignment"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(assignment)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
              title="Delete Assignment"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link
            href={`/dashboard/assignments/${assignment.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4.5 py-2.5 text-xs font-extrabold text-white shadow-sm transition-colors cursor-pointer self-end sm:self-auto"
          >
            <span>View & Submit</span>
          </Link>
        )}
      </div>
    </div>
  );
}
