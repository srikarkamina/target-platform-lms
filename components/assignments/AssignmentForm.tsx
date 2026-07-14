"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle } from "lucide-react";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title cannot exceed 255 characters"),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable().or(z.string().length(0)),
  courseId: z.string().min(1, "Course is required"),
});

type FormData = z.infer<typeof schema>;

interface Course {
  id: string;
  title: string;
  courseCode: string;
}

interface AssignmentFormProps {
  initialData?: {
    id?: string;
    title: string;
    description?: string | null;
    dueDate?: string | Date | null;
    courseId: string;
  };
  courses: Course[];
  courseIdFixed?: string;
  onSubmit: (data: {
    title: string;
    description: string | null;
    dueDate: Date | null;
    courseId: string;
  }) => Promise<void> | void;
  onCancel?: () => void;
  loading?: boolean;
}

// Formats date/string to YYYY-MM-DDTHH:mm for datetime-local input
const formatForInput = (dateVal?: string | Date | null) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

export default function AssignmentForm({
  initialData,
  courses,
  courseIdFixed,
  onSubmit,
  onCancel,
  loading = false,
}: AssignmentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      dueDate: formatForInput(initialData?.dueDate),
      courseId: courseIdFixed || initialData?.courseId || (courses[0]?.id ?? ""),
    },
  });

  const onFormSubmit = (data: FormData) => {
    onSubmit({
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      courseId: courseIdFixed || data.courseId,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {Object.keys(errors).length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <div className="flex gap-2 font-semibold mb-1">
            <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5" />
            <span>Please fix the following validation errors:</span>
          </div>
          <ul className="list-disc list-inside text-rose-700 text-xs space-y-0.5">
            {errors.title && <li>{errors.title.message}</li>}
            {errors.courseId && <li>{errors.courseId.message}</li>}
            {errors.dueDate && <li>{errors.dueDate.message}</li>}
          </ul>
        </div>
      )}

      {/* Row 1: Course Selection (if not fixed) */}
      {!courseIdFixed && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Select Course *
          </label>
          <select
            {...register("courseId")}
            disabled={loading}
            className="w-full rounded-xl border border-slate-350 bg-white p-3 pr-10 shadow-sm focus:border-indigo-550 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          >
            <option value="" disabled>-- Select Course --</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                [{course.courseCode}] {course.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Row 2: Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Assignment Title *
        </label>
        <input
          type="text"
          {...register("title")}
          disabled={loading}
          placeholder="e.g. Midterm Programming Project"
          className="w-full rounded-xl border border-slate-350 p-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
        />
      </div>

      {/* Row 3: Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          {...register("description")}
          disabled={loading}
          rows={3}
          placeholder="Add details, instructions, or grading criteria for this assignment..."
          className="w-full rounded-xl border border-slate-350 p-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
        />
      </div>

      {/* Row 4: Due Date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Due Date
        </label>
        <input
          type="datetime-local"
          {...register("dueDate")}
          disabled={loading}
          className="w-full rounded-xl border border-slate-350 p-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white shadow hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {loading ? "Saving..." : initialData ? "Update Assignment" : "Create Assignment"}
        </button>
      </div>
    </form>
  );
}
