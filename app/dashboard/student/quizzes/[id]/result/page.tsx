"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Award, ArrowLeft, CheckCircle2, XCircle, Calendar, Clock, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Question {
  id: string;
  question: string;
  options: any; // string[]
  correctAnswers: any; // string[]
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  marks: number;
  order: number;
}

interface Attempt {
  id: string;
  quizId: string;
  score: number;
  percentage: number;
  passed: boolean;
  status: string;
  startedAt: string;
  submittedAt: string;
  quiz: {
    id: string;
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
    isCorrect: boolean;
  }[];
}

export default function QuizResultPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: attemptId } = use(params);

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/quiz-attempts/${attemptId}`);
        const data = res.data as Attempt;

        if (data.status !== "SUBMITTED") {
          toast.error("This quiz attempt is not submitted yet.");
          router.push(`/dashboard/student/quizzes/${attemptId}`);
          return;
        }

        setAttempt(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load quiz results.");
        router.push("/dashboard/student/quizzes");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId, router]);

  if (loading || !attempt) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 flex flex-col items-center justify-center p-12">
            <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-600">Fetching submission score report...</p>
          </main>
        </div>
      </div>
    );
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = (start: string, end: string) => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6 max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            href="/dashboard/student/quizzes"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to My Quizzes</span>
          </Link>

          {/* Results Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className={`p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
              attempt.passed
                ? "bg-emerald-50/30"
                : "bg-rose-50/20"
            }`}>
              <div className="space-y-1">
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Quiz Result</span>
                <h1 className="text-2xl font-extrabold text-slate-800">{attempt.quiz.title}</h1>
                <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                  {attempt.quiz.description || "Review your performance metrics, grades, and question choices detail below."}
                </p>
              </div>

              {/* Pass/Fail Status Banner */}
              <div className={`flex flex-col items-center justify-center px-6 py-4 rounded-2xl border-2 shrink-0 w-full md:w-auto text-center ${
                attempt.passed
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}>
                <span className="text-[11px] font-extrabold uppercase tracking-widest opacity-80">Grade Status</span>
                <h2 className="text-2xl font-black uppercase mt-0.5">{attempt.passed ? "PASSED" : "FAILED"}</h2>
              </div>
            </div>

            {/* Score Grid Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 text-center bg-slate-50/40">
              <div className="p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Score Obtained</p>
                <h3 className="text-xl font-extrabold text-slate-800 mt-1">
                  {attempt.score} <span className="text-sm text-slate-400 font-normal">/ {attempt.quiz.totalMarks}</span>
                </h3>
              </div>

              <div className="p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Percentage</p>
                <h3 className="text-xl font-extrabold text-slate-800 mt-1">
                  {attempt.percentage.toFixed(1)}%
                </h3>
              </div>

              <div className="p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passing Cutoff</p>
                <h3 className="text-xl font-extrabold text-slate-800 mt-1">
                  {attempt.quiz.passingMarks} <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Marks</span>
                </h3>
              </div>

              <div className="p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Time Taken</p>
                <h3 className="text-xl font-extrabold text-slate-800 mt-1">
                  {getDuration(attempt.startedAt, attempt.submittedAt)}
                </h3>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex flex-wrap gap-6 text-xs text-slate-500 font-semibold">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Submitted: {formatDateTime(attempt.submittedAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>Limit Allowed: {attempt.quiz.timeLimit} mins</span>
              </div>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Question & Answer Review</h2>
              <p className="text-xs text-slate-400 mt-0.5">Examine correct choices alongside your selected inputs</p>
            </div>

            {attempt.quiz.questions.map((question, qIdx) => {
              const studentAnswer = attempt.answers.find((a) => a.questionId === question.id);
              const selectedAnswers = studentAnswer ? (studentAnswer.selectedAnswers as string[]) : [];
              const correctAnswers = (question.correctAnswers as string[]) || [];
              const isCorrect = studentAnswer ? studentAnswer.isCorrect : false;
              const options = (question.options as string[]) || [];

              return (
                <div
                  key={question.id}
                  className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all ${
                    isCorrect ? "border-slate-200" : "border-rose-200"
                  }`}
                >
                  {/* Question Header */}
                  <div className={`p-4 border-b flex items-center justify-between gap-4 ${
                    isCorrect ? "bg-slate-50/50 border-slate-200" : "bg-rose-50/10 border-rose-100"
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-slate-200 text-slate-700 text-xs font-bold font-mono">
                        {qIdx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {question.questionType === "SINGLE_CHOICE" ? "Single Choice" : "Multiple Choice"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-500 border">
                        {isCorrect ? `${question.marks} / ${question.marks}` : `0 / ${question.marks}`} Marks
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                        isCorrect
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Correct</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Incorrect</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="p-6 space-y-4">
                    <p className="text-sm font-bold text-slate-800 leading-relaxed">
                      {question.question}
                    </p>

                    {/* Choices Rendering */}
                    <div className="space-y-2.5">
                      {options.map((option, oIdx) => {
                        const isSelected = selectedAnswers.includes(option);
                        const isCorrectOption = correctAnswers.includes(option);
                        const letter = String.fromCharCode(65 + oIdx);

                        let optionClass = "border-slate-200 text-slate-600";
                        let indicatorIcon = null;

                        if (isSelected && isCorrectOption) {
                          // Green highlight
                          optionClass = "border-emerald-500 bg-emerald-50/50 text-emerald-900 font-semibold";
                          indicatorIcon = <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />;
                        } else if (isSelected && !isCorrectOption) {
                          // Red highlight
                          optionClass = "border-rose-400 bg-rose-50/40 text-rose-905 font-semibold";
                          indicatorIcon = <XCircle className="h-4.5 w-4.5 text-rose-600" />;
                        } else if (!isSelected && isCorrectOption) {
                          // Subtle green border showing correct options
                          optionClass = "border-emerald-300 bg-emerald-50/10 text-emerald-800";
                          indicatorIcon = (
                            <span className="text-[10px] uppercase font-extrabold text-emerald-600 tracking-wider">
                              Correct answer
                            </span>
                          );
                        }

                        return (
                          <div
                            key={oIdx}
                            className={`flex items-center justify-between p-3.5 rounded-xl border-2 text-xs transition-colors ${optionClass}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded bg-slate-100 border text-slate-500 font-bold uppercase text-[10px]">
                                {letter}
                              </span>
                              <span>{option}</span>
                            </div>
                            {indicatorIcon}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanatory helper if unanswered */}
                    {selectedAnswers.length === 0 && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-amber-700 border border-amber-200 text-xs font-semibold">
                        <AlertCircle className="h-4 w-4" />
                        <span>You did not answer this question.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
