import React, { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Course {
  id: string;
  title: string;
  courseCode: string;
}

interface Template {
  id: string;
  name: string;
}

interface CertificateFormProps {
  students: Student[];
  courses: Course[];
  templates: Template[];
  onSubmit: (data: { studentId: string; courseId: string; templateId: string; completionDate?: string }) => void;
  onClose: () => void;
  isSubmitting: boolean;
  error?: string | null;
}

export default function CertificateForm({
  students,
  courses,
  templates,
  onSubmit,
  onClose,
  isSubmitting,
  error: submitError,
}: CertificateFormProps) {
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().substring(0, 10));
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!studentId) {
      setValidationError("Please select a student");
      return;
    }
    if (!courseId) {
      setValidationError("Please select a course");
      return;
    }
    if (!templateId) {
      setValidationError("Please select a template");
      return;
    }

    onSubmit({
      studentId,
      courseId,
      templateId,
      completionDate: completionDate || undefined,
    });
  };

  const displayError = validationError || submitError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-900">Issue New Certificate</h3>
            <p className="text-xs text-slate-500 mt-0.5">Programmatically generate record based on course completion</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {displayError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs font-bold text-rose-700">
              {displayError}
            </div>
          )}

          {/* Student Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Student</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Choose Student --</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </div>

          {/* Course Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Choose Course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} ({course.courseCode})
                </option>
              ))}
            </select>
          </div>

          {/* Template Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Certificate Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Choose Template --</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Completion Date Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Completion Date (Optional)</label>
            <input
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100 disabled:opacity-50 cursor-pointer text-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Generate Certificate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
