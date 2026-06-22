"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, AlertCircle, HelpCircle } from "lucide-react";

interface Course {
  id: string;
  title: string;
  courseCode: string;
}

interface Question {
  id?: string;
  question: string;
  options: string[];
  correctAnswers: string[];
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  marks: number | "";
  order: number;
}

interface QuizFormProps {
  initialData?: {
    title: string;
    description?: string | null;
    courseId: string;
    timeLimit: number;
    passingMarks: number;
    totalMarks: number;
    isPublished: boolean;
    questions: Question[];
  };
  courses: Course[];
  onSubmit: (data: any) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
}

export default function QuizForm({
  initialData,
  courses,
  onSubmit,
  onCancel,
  loading = false,
}: QuizFormProps) {
  // Local Form States
  const parseNumericInput = (val: string): number | "" => {
    if (val === "") return "";
    const num = Number(val);
    if (isNaN(num)) return "";
    return num >= 0 ? num : 0;
  };

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [courseId, setCourseId] = useState(initialData?.courseId || (courses[0]?.id ?? ""));
  const [timeLimit, setTimeLimit] = useState<number | "">(initialData ? initialData.timeLimit : "");
  const [passingMarks, setPassingMarks] = useState<number | "">(initialData ? initialData.passingMarks : "");
  const [totalMarks, setTotalMarks] = useState<number | "">(initialData ? initialData.totalMarks : "");
  const [isPublished, setIsPublished] = useState(initialData?.isPublished ?? false);

  const [questions, setQuestions] = useState<Question[]>(
    initialData?.questions && initialData.questions.length > 0
      ? initialData.questions.map(q => ({ ...q, marks: q.marks }))
      : [
          {
            question: "",
            options: ["Option 1", "Option 2"],
            correctAnswers: ["Option 1"],
            questionType: "SINGLE_CHOICE",
            marks: "",
            order: 0,
          },
        ]
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Synchronize first course selection if courses list finishes loading late
  useEffect(() => {
    if (!courseId && courses.length > 0) {
      setCourseId(courses[0].id);
    }
  }, [courses, courseId]);

  // General Validation check before submitting
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    const errors: string[] = [];

    if (!title.trim()) {
      errors.push("Quiz title is required.");
    }
    if (!courseId) {
      errors.push("Course selection is required.");
    }
    if (timeLimit === "" || Number(timeLimit) <= 0) {
      errors.push("Time limit must be a positive number.");
    }
    if (passingMarks === "" || Number(passingMarks) <= 0) {
      errors.push("Passing marks must be a positive number.");
    }
    if (totalMarks === "" || Number(totalMarks) <= 0) {
      errors.push("Total marks must be a positive number.");
    }
    if (passingMarks !== "" && totalMarks !== "" && Number(passingMarks) > Number(totalMarks)) {
      errors.push("Passing marks cannot exceed total marks.");
    }

    if (questions.length === 0) {
      errors.push("At least one question is required.");
    }

    questions.forEach((q, idx) => {
      const qNum = idx + 1;
      if (!q.question.trim()) {
        errors.push(`Question ${qNum}: Question text is required.`);
      }
      if (q.marks === "" || Number(q.marks) <= 0) {
        errors.push(`Question ${qNum}: Marks must be a positive number.`);
      }
      if (q.options.length < 2) {
        errors.push(`Question ${qNum}: Must have at least 2 options.`);
      }
      // Check for empty option descriptions
      const hasEmptyOption = q.options.some((opt) => !opt.trim());
      if (hasEmptyOption) {
        errors.push(`Question ${qNum}: All options must have text.`);
      }
      // Check correctAnswers selection
      if (q.correctAnswers.length === 0) {
        errors.push(`Question ${qNum}: Must have at least 1 correct answer selected.`);
      }
      // Verify correct answers are contained within options
      const invalidAnswers = q.correctAnswers.filter((ans) => !q.options.includes(ans));
      if (invalidAnswers.length > 0) {
        errors.push(`Question ${qNum}: Selected correct answer must match one of the options text.`);
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Submit paylod
    onSubmit({
      title,
      description: description || null,
      courseId,
      timeLimit: Number(timeLimit),
      passingMarks: Number(passingMarks),
      totalMarks: Number(totalMarks),
      isPublished,
      questions: questions.map((q, idx) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswers: q.correctAnswers,
        questionType: q.questionType,
        marks: Number(q.marks),
        order: idx,
      })),
    });
  };

  // Question manipulation handlers
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: ["Option 1", "Option 2"],
        correctAnswers: ["Option 1"],
        questionType: "SINGLE_CHOICE",
        marks: "",
        order: questions.length,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, idx) => idx !== index);
    setQuestions(updated);
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === questions.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setQuestions(updated);
  };

  const updateQuestionText = (index: number, val: string) => {
    const updated = [...questions];
    updated[index].question = val;
    setQuestions(updated);
  };

  const updateQuestionType = (index: number, type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE") => {
    const updated = [...questions];
    updated[index].questionType = type;
    // Reset correctAnswers choice to fit the new selection pattern
    if (type === "SINGLE_CHOICE" && updated[index].correctAnswers.length > 1) {
      updated[index].correctAnswers = [updated[index].correctAnswers[0]];
    }
    setQuestions(updated);
  };

  const updateQuestionMarks = (index: number, val: number | "") => {
    const updated = [...questions];
    updated[index].marks = val;
    setQuestions(updated);
  };

  const addQuestionBelow = (index: number) => {
    const newQuestion = {
      question: "",
      options: ["Option 1", "Option 2"],
      correctAnswers: ["Option 1"],
      questionType: "SINGLE_CHOICE" as const,
      marks: "" as const,
      order: index + 1,
    };

    const updated = [...questions];
    updated.splice(index + 1, 0, newQuestion);

    const renumbered = updated.map((q, idx) => ({
      ...q,
      order: idx,
    }));

    setQuestions(renumbered);
  };

  // Option handlers
  const addOption = (qIdx: number) => {
    const updated = [...questions];
    const optNum = updated[qIdx].options.length + 1;
    updated[qIdx].options.push(`Option ${optNum}`);
    setQuestions(updated);
  };

  const updateOptionText = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions];
    const oldText = updated[qIdx].options[optIdx];
    updated[qIdx].options[optIdx] = val;

    // If the old text was correct, keep it aligned with the new text
    updated[qIdx].correctAnswers = updated[qIdx].correctAnswers.map((ans) =>
      ans === oldText ? val : ans
    );
    setQuestions(updated);
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    const textToRemove = updated[qIdx].options[optIdx];
    updated[qIdx].options = updated[qIdx].options.filter((_, idx) => idx !== optIdx);

    // Remove from correct answers if it was listed
    updated[qIdx].correctAnswers = updated[qIdx].correctAnswers.filter(
      (ans) => ans !== textToRemove
    );

    // Auto select first option if correct answers list empty
    if (updated[qIdx].correctAnswers.length === 0 && updated[qIdx].options.length > 0) {
      updated[qIdx].correctAnswers = [updated[qIdx].options[0]];
    }

    setQuestions(updated);
  };

  const toggleCorrectAnswer = (qIdx: number, optionText: string) => {
    const updated = [...questions];
    const q = updated[qIdx];

    if (q.questionType === "SINGLE_CHOICE") {
      q.correctAnswers = [optionText];
    } else {
      if (q.correctAnswers.includes(optionText)) {
        // Only allow unselecting if there are other correct answers
        if (q.correctAnswers.length > 1) {
          q.correctAnswers = q.correctAnswers.filter((ans) => ans !== optionText);
        }
      } else {
        q.correctAnswers.push(optionText);
      }
    }
    setQuestions(updated);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-8 max-w-4xl mx-auto font-sans">
      {/* Alert Errors box */}
      {validationErrors.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex gap-2 font-bold mb-2">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>Please resolve the following layout issues:</span>
          </div>
          <ul className="list-disc list-inside text-rose-700 text-xs space-y-1 ml-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-indigo-500" />
          <span>Quiz Information & Parameters</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Quiz Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Module 3 JavaScript Scope and Closures"
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 p-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-slate-50/20"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Description / Instructions
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Provide instructions, formulas, or general information for this quiz..."
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 p-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-slate-50/20"
            />
          </div>

          {/* Course */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Associated Course *
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
            >
              <option value="" disabled>-- Select Course --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  [{course.courseCode}] {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Time Limit (Minutes) *
            </label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseNumericInput(e.target.value))}
              placeholder="e.g. 30"
              min={1}
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 p-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-slate-50/20"
            />
          </div>

          {/* Total Marks */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Total Marks *
            </label>
            <input
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(parseNumericInput(e.target.value))}
              placeholder="e.g. 20"
              min={1}
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 p-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-slate-50/20"
            />
          </div>

          {/* Passing Marks */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Passing Marks Required *
            </label>
            <input
              type="number"
              value={passingMarks}
              onChange={(e) => setPassingMarks(parseNumericInput(e.target.value))}
              placeholder="e.g. 10"
              min={1}
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 p-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-slate-50/20"
            />
          </div>

          {/* Published Toggle */}
          <div className="md:col-span-2 flex items-center gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <input
              id="published-toggle"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              disabled={loading}
              className="h-4.5 w-4.5 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="published-toggle" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
              Publish immediately (Make this quiz available to students enrolled in the course)
            </label>
          </div>
        </div>
      </div>

      {/* Questions Builder Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Questions Builder</h2>
            <p className="text-xs text-slate-400 mt-0.5">Define quiz questions, options, and grading weights</p>
          </div>
          <button
            type="button"
            onClick={addQuestion}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-55 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors cursor-pointer disabled:bg-slate-50 disabled:opacity-50"
          >
            <Plus className="h-4 w-4 text-slate-500" />
            <span>Add Question</span>
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-350">
            <p className="text-slate-500 font-medium">No questions added yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click &quot;Add Question&quot; to begin building your quiz.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative transition-shadow hover:shadow-sm"
              >
                {/* Question Toolbar Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-extrabold text-indigo-600">
                    {qIdx + 1}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveQuestion(qIdx, "up")}
                      disabled={loading || qIdx === 0}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-55 disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(qIdx, "down")}
                      disabled={loading || qIdx === questions.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-55 disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      disabled={loading || questions.length <= 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 disabled:opacity-30 cursor-pointer"
                      title="Remove Question"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Question Text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Question Text *
                    </label>
                    <textarea
                      value={q.question}
                      onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                      placeholder="Write your question here..."
                      disabled={loading}
                      rows={2}
                      className="w-full rounded-xl border border-slate-300 p-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-slate-50/10"
                    />
                  </div>

                  {/* Question Type and Marks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Question Type *
                      </label>
                      <select
                        value={q.questionType}
                        onChange={(e) => updateQuestionType(qIdx, e.target.value as any)}
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                      >
                        <option value="SINGLE_CHOICE">Single Choice (Radio Buttons)</option>
                        <option value="MULTIPLE_CHOICE">Multiple Choice (Checkboxes)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Marks *
                      </label>
                      <input
                        type="number"
                        value={q.marks}
                        onChange={(e) => updateQuestionMarks(qIdx, parseNumericInput(e.target.value))}
                        placeholder="e.g. 5"
                        min={1}
                        disabled={loading}
                        className="w-full rounded-xl border border-slate-300 p-2.5 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm bg-slate-50/10"
                      />
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Options & Answers *
                      </label>
                      <button
                        type="button"
                        onClick={() => addOption(qIdx)}
                        disabled={loading}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Option</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correctAnswers.includes(opt);
                        return (
                          <div key={optIdx} className="flex items-center gap-2">
                            {/* Correct Indicator: Radio or Checkbox */}
                            {q.questionType === "SINGLE_CHOICE" ? (
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={isCorrect}
                                onChange={() => toggleCorrectAnswer(qIdx, opt)}
                                disabled={loading}
                                className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                title="Mark as Correct Option"
                              />
                            ) : (
                              <input
                                type="checkbox"
                                checked={isCorrect}
                                onChange={() => toggleCorrectAnswer(qIdx, opt)}
                                disabled={loading}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                title="Toggle correctness"
                              />
                            )}

                            {/* Option input text */}
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                              disabled={loading}
                              placeholder={`Option ${optIdx + 1}`}
                              className={`flex-1 rounded-xl border p-2 shadow-sm focus:outline-none focus:ring-1 text-sm bg-slate-50/5 ${
                                isCorrect
                                  ? "border-emerald-300 bg-emerald-50/10 focus:ring-emerald-500 focus:border-emerald-500"
                                  : "border-slate-300 focus:ring-indigo-500 focus:border-indigo-500"
                              }`}
                            />

                            {/* Option delete button */}
                            <button
                              type="button"
                              onClick={() => removeOption(qIdx, optIdx)}
                              disabled={loading || q.options.length <= 2}
                              className="p-2 border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl disabled:opacity-20 cursor-pointer"
                              title="Delete Option"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Question Below Button */}
                  <div className="border-t border-slate-100 pt-4 mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => addQuestionBelow(qIdx)}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50 text-indigo-700 px-4.5 py-2.5 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Question Below</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Submission Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-55 transition-colors cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-extrabold text-white shadow-md hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {loading ? "Saving..." : initialData ? "Save Changes" : "Create Quiz"}
        </button>
      </div>
    </form>
  );
}
