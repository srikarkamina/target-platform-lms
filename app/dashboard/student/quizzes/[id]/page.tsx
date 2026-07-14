"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import { Clock, ChevronLeft, ChevronRight, CheckSquare, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Question {
  id: string;
  question: string;
  options: any; // string[]
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  marks: number;
  order: number;
}

interface Attempt {
  id: string;
  quizId: string;
  status: string;
  startedAt: string;
  quiz: {
    title: string;
    description: string | null;
    timeLimit: number;
    passingMarks: number;
    totalMarks: number;
    questions: Question[];
  };
  answers: {
    questionId: string;
    selectedAnswers: any; // string[]
  }[];
}

export default function TakeQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: attemptId } = use(params);

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  // Form states
  const [selectedAnswersMap, setSelectedAnswersMap] = useState<Record<string, string[]>>({});
  const [saveStatusMap, setSaveStatusMap] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // in seconds
  const autoSubmitTriggered = useRef(false);

  // Fetch attempt details
  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/quiz-attempts/${attemptId}`);
        const attemptData = res.data as Attempt;

        if (attemptData.status === "SUBMITTED") {
          toast.success("This quiz has already been submitted.");
          router.push(`/dashboard/student/quizzes/${attemptId}/result`);
          return;
        }

        setAttempt(attemptData);

        // Populate selected answers
        const initialAnswers: Record<string, string[]> = {};
        const initialStatus: Record<string, "idle" | "saving" | "saved" | "error"> = {};
        
        attemptData.quiz.questions.forEach((q) => {
          const studentAns = attemptData.answers.find((a) => a.questionId === q.id);
          initialAnswers[q.id] = studentAns ? (studentAns.selectedAnswers as string[]) : [];
          initialStatus[q.id] = studentAns ? "saved" : "idle";
        });

        setSelectedAnswersMap(initialAnswers);
        setSaveStatusMap(initialStatus);

        // Initialize Timer
        const timeLimitMs = attemptData.quiz.timeLimit * 60 * 1000;
        const elapsedMs = Date.now() - new Date(attemptData.startedAt).getTime();
        const initialRemainingSecs = Math.max(0, Math.floor((timeLimitMs - elapsedMs) / 1000));
        setTimeLeft(initialRemainingSecs);

      } catch (err: any) {
        console.error(err);
        toast.error("Failed to load quiz attempt.");
        router.push("/dashboard/student/quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId, router]);

  // Submit Handler
  const executeSubmission = async (isAuto = false) => {
    if (submitting) return;
    try {
      setSubmitting(true);
      await api.post("/quiz-attempts/submit", { attemptId });
      toast.success(isAuto ? "Time's up! Quiz auto-submitted." : "Quiz submitted successfully!");
      router.push(`/dashboard/student/quizzes/${attemptId}/result`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit quiz. Please try again.");
      setSubmitting(false);
    }
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || loading || submitting) {
      if (timeLeft === 0 && !autoSubmitTriggered.current && !loading && !submitting) {
        autoSubmitTriggered.current = true;
        executeSubmission(true);
      }
      return;
    }

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timerInterval);
          if (!autoSubmitTriggered.current) {
            autoSubmitTriggered.current = true;
            executeSubmission(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [timeLeft, loading, submitting]);

  if (loading || !attempt) {
    return (
      <DashboardLayout>
      <DashboardPageContainer>
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-600">Loading quiz content & parameters...</p>
          </DashboardPageContainer>
    </DashboardLayout>
    );
  }

  const questions = attempt.quiz.questions;
  const currentQuestion = questions[activeIdx];
  const options = (currentQuestion.options as string[]) || [];

  const handleAnswerChange = async (questionId: string, selected: string[]) => {
    setSelectedAnswersMap((prev) => ({
      ...prev,
      [questionId]: selected,
    }));

    setSaveStatusMap((prev) => ({
      ...prev,
      [questionId]: "saving",
    }));

    try {
      await api.post("/quiz-attempts/save", {
        attemptId,
        questionId,
        selectedAnswers: selected,
      });

      setSaveStatusMap((prev) => ({
        ...prev,
        [questionId]: "saved",
      }));
    } catch (err) {
      console.error(err);
      setSaveStatusMap((prev) => ({
        ...prev,
        [questionId]: "error",
      }));
      toast.error("Auto-save failed. Check your network.");
    }
  };

  const handleCheckboxToggle = (option: string) => {
    const current = selectedAnswersMap[currentQuestion.id] || [];
    let updated;
    if (current.includes(option)) {
      updated = current.filter((item) => item !== option);
    } else {
      updated = [...current, option];
    }
    handleAnswerChange(currentQuestion.id, updated);
  };

  const formatTimer = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const isLowTime = timeLeft !== null && timeLeft < 60; // Less than 1 minute

  return (
    <DashboardLayout>
      <DashboardPageContainer>
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Quiz Attempt</span>
              <h1 className="text-2xl font-extrabold text-slate-800 mt-0.5">{attempt.quiz.title}</h1>
            </div>

            {/* Countdown Display */}
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl border font-bold text-lg shadow-sm transition-all ${
                  isLowTime
                    ? "bg-rose-50 border-rose-250 text-rose-600 animate-pulse"
                    : "bg-indigo-50 border-indigo-200 text-indigo-700"
                }`}
              >
                <Clock className={`h-5 w-5 ${isLowTime ? "text-rose-600" : "text-indigo-600"}`} />
                <span className="font-mono tracking-wide">{formatTimer(timeLeft)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column: Question Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative">
                {/* Question Info Bar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <span className="text-sm font-bold text-slate-700">
                    Question {activeIdx + 1} of {questions.length}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-500 border">
                      {currentQuestion.marks} {currentQuestion.marks === 1 ? "Mark" : "Marks"}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                        saveStatusMap[currentQuestion.id] === "saved"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : saveStatusMap[currentQuestion.id] === "saving"
                          ? "bg-blue-50 border-blue-250 text-blue-700"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}
                    >
                      {saveStatusMap[currentQuestion.id] === "saved" && "Saved"}
                      {saveStatusMap[currentQuestion.id] === "saving" && "Saving..."}
                      {saveStatusMap[currentQuestion.id] === "idle" && "Unsaved"}
                      {saveStatusMap[currentQuestion.id] === "error" && "Save failed"}
                    </span>
                  </div>
                </div>

                {/* Question Title */}
                <p className="text-base font-bold text-slate-900 leading-relaxed mb-6">
                  {currentQuestion.question}
                </p>

                {/* Question Choices Options */}
                <div className="space-y-3">
                  {options.map((option, idx) => {
                    const isSelected = (selectedAnswersMap[currentQuestion.id] || []).includes(option);
                    const letter = String.fromCharCode(65 + idx); // A, B, C, D...

                    return currentQuestion.questionType === "SINGLE_CHOICE" ? (
                      <label
                        key={idx}
                        onClick={() => handleAnswerChange(currentQuestion.id, [option])}
                        className={`flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/40 text-indigo-900 font-semibold"
                            : "border-slate-150 hover:bg-slate-50 text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${currentQuestion.id}`}
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4.5 w-4.5 text-indigo-600 border-slate-350 focus:ring-indigo-500/20"
                        />
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 border text-slate-500 font-bold text-xs uppercase">
                          {letter}
                        </span>
                        <span className="text-sm">{option}</span>
                      </label>
                    ) : (
                      <label
                        key={idx}
                        onClick={() => handleCheckboxToggle(option)}
                        className={`flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/40 text-indigo-900 font-semibold"
                            : "border-slate-150 hover:bg-slate-50 text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4.5 w-4.5 rounded text-indigo-600 border-slate-350 focus:ring-indigo-500/20"
                        />
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 border text-slate-500 font-bold text-xs uppercase">
                          {letter}
                        </span>
                        <span className="text-sm">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
                  disabled={activeIdx === 0}
                  className="inline-flex items-center gap-1 border border-slate-200 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-700 px-4 py-2.5 rounded-xl shadow-xs text-sm font-semibold transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={() => setActiveIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                  disabled={activeIdx === questions.length - 1}
                  className="inline-flex items-center gap-1 border border-slate-200 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-slate-700 px-4 py-2.5 rounded-xl shadow-xs text-sm font-semibold transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Right Column: Question Grid and Submission panel */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div>
                  <h3 className="font-extrabold text-slate-800">Question Palette</h3>
                  <p className="text-xs text-slate-400 mt-1">Jump to any question quickly</p>
                </div>

                {/* Grid items */}
                <div className="grid grid-cols-5 gap-2.5">
                  {questions.map((q, idx) => {
                    const isCurrent = idx === activeIdx;
                    const isAnswered = (selectedAnswersMap[q.id] || []).length > 0;

                    let classes = "";
                    if (isCurrent) {
                      classes = "ring-2 ring-indigo-600 bg-indigo-50 border-indigo-200 text-indigo-700 font-bold";
                    } else if (isAnswered) {
                      classes = "bg-emerald-50 border border-emerald-250 text-emerald-700 font-bold";
                    } else {
                      classes = "bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200";
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => setActiveIdx(idx)}
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-semibold transition-colors cursor-pointer ${classes}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legends */}
                <div className="border-t border-slate-100 pt-4 flex flex-wrap gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-slate-200"></span>
                    <span className="text-slate-500">Unanswered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-500">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-indigo-500"></span>
                    <span className="text-slate-500">Current</span>
                  </div>
                </div>

                {/* Submit panel */}
                <div className="border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-3 text-sm font-bold text-white shadow transition-all cursor-pointer"
                  >
                    <CheckSquare className="h-4.5 w-4.5" />
                    <span>Submit Quiz</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Submission confirmation modal */}
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl space-y-4">
                <div className="flex items-start gap-3 text-amber-600">
                  <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-lg">Submit Attempt?</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Are you sure you want to finalize your quiz attempt? You will not be able to edit your answers after submission.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      executeSubmission();
                    }}
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-xl text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
                  >
                    {submitting ? "Submitting..." : "Submit Quiz"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </DashboardPageContainer>
    </DashboardLayout>
  );
}
