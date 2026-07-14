"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import QuizForm from "@/components/quizzes/QuizForm";
import { PlusCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Course {
  id: string;
  title: string;
  courseCode: string;
}

export default function CreateQuizPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchCoursesList = async () => {
      try {
        setLoadingCourses(true);
        const res = await api.get("/courses");
        if (active) {
          setCourses(res.data || []);
        }
      } catch (err) {
        console.error("Failed to load courses:", err);
        toast.error("Failed to load courses. Please refresh page.");
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCoursesList();
    return () => {
      active = false;
    };
  }, []);

  const handleCreateSubmit = async (formData: any) => {
    try {
      setSubmitting(true);
      await api.post("/quizzes", formData);
      toast.success("Quiz created successfully!");
      router.push("/dashboard/quizzes");
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.message) {
        toast.error(`Error: ${err.response.data.message}`);
      } else {
        toast.error("Failed to create quiz.");
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
              <PlusCircle className="h-8 w-8 text-indigo-600" />
              <span>Create New Quiz</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Add general quiz settings and build question choice models for students
            </p>
          </div>

          {loadingCourses ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[300px]">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm text-slate-500 font-medium">Loading courses...</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm">
              <QuizForm
                courses={courses}
                onSubmit={handleCreateSubmit}
                onCancel={() => router.push("/dashboard/quizzes")}
                loading={submitting}
              />
            </div>
          )}
        </DashboardPageContainer>
    </DashboardLayout>
  );
}
