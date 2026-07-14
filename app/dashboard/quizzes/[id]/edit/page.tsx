"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import QuizForm from "@/components/quizzes/QuizForm";
import { Edit2, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Course {
  id: string;
  title: string;
  courseCode: string;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswers: string[];
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  marks: number;
  order: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  timeLimit: number;
  passingMarks: number;
  totalMarks: number;
  isPublished: boolean;
  questions: Question[];
}

interface EditQuizPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditQuizPage({ params }: EditQuizPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [courses, setCourses] = useState<Course[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [coursesRes, quizRes] = await Promise.all([
          api.get("/courses"),
          api.get(`/quizzes/${id}`),
        ]);

        if (active) {
          setCourses(coursesRes.data || []);
          setQuiz(quizRes.data);
        }
      } catch (err: any) {
        console.error("Failed to load quiz metadata:", err);
        setError(err.response?.data?.message || "Failed to load quiz details. It may have been deleted.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [id]);

  const handleEditSubmit = async (formData: any) => {
    try {
      setSubmitting(true);
      await api.put(`/quizzes/${id}`, formData);
      toast.success("Quiz updated successfully!");
      router.push("/dashboard/quizzes");
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.message) {
        toast.error(`Error: ${err.response.data.message}`);
      } else {
        toast.error("Failed to update quiz.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardPageContainer maxWidth="max-w-4xl">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <Edit2 className="h-8 w-8 text-indigo-600" />
              <span>Edit Quiz</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Modify assessment details, manage options, and sync changes to student scopes
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[300px]">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm text-slate-500 font-medium">Loading quiz details...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center space-y-4 max-w-lg mx-auto">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Failed to Load Quiz</h3>
                <p className="text-sm text-slate-500 mt-1">{error}</p>
              </div>
              <div>
                <button
                  onClick={() => router.push("/dashboard/quizzes")}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow transition-colors cursor-pointer"
                >
                  Return to Quizzes
                </button>
              </div>
            </div>
          ) : quiz ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <QuizForm
                initialData={{
                  title: quiz.title,
                  description: quiz.description,
                  courseId: quiz.courseId,
                  timeLimit: quiz.timeLimit,
                  passingMarks: quiz.passingMarks,
                  totalMarks: quiz.totalMarks,
                  isPublished: quiz.isPublished,
                  questions: quiz.questions.map((q) => ({
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    correctAnswers: q.correctAnswers,
                    questionType: q.questionType,
                    marks: q.marks,
                    order: q.order,
                  })),
                }}
                courses={courses}
                onSubmit={handleEditSubmit}
                onCancel={() => router.push("/dashboard/quizzes")}
                loading={submitting}
              />
            </div>
          ) : null}
        </DashboardPageContainer>
    </DashboardLayout>
  );
}
