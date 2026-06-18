import { z } from "zod";

export const questionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  options: z.array(z.string()).min(2, "At least 2 options are required"),
  correctAnswers: z.array(z.string()).min(1, "At least 1 correct answer is required"),
  questionType: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE"]),
  marks: z.number().int().positive("Question marks must be positive"),
  order: z.number().int().nonnegative("Order must be non-negative"),
}).refine((data) => {
  // Correct answers must exist in options
  return data.correctAnswers.every((ans) => data.options.includes(ans));
}, {
  message: "Correct answers must exist in the options list",
  path: ["correctAnswers"],
});

export const updateQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().min(1, "Question text is required"),
  options: z.array(z.string()).min(2, "At least 2 options are required"),
  correctAnswers: z.array(z.string()).min(1, "At least 1 correct answer is required"),
  questionType: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE"]),
  marks: z.number().int().positive("Question marks must be positive"),
  order: z.number().int().nonnegative("Order must be non-negative"),
}).refine((data) => {
  return data.correctAnswers.every((ans) => data.options.includes(ans));
}, {
  message: "Correct answers must exist in the options list",
  path: ["correctAnswers"],
});

export const createQuizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().max(1000).nullable().optional(),
  courseId: z.string().min(1, "Course ID is required"),
  timeLimit: z.number().int().positive("Time limit must be positive"),
  passingMarks: z.number().int().positive("Passing marks must be positive"),
  totalMarks: z.number().int().positive("Total marks must be positive"),
  isPublished: z.boolean().optional().default(false),
  questions: z.array(questionSchema).min(1, "At least one question is required"),
}).refine((data) => {
  // Passing marks cannot exceed total marks
  return data.passingMarks <= data.totalMarks;
}, {
  message: "Passing marks cannot exceed total marks",
  path: ["passingMarks"],
});

export const updateQuizSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().max(1000).nullable().optional(),
  courseId: z.string().min(1, "Course ID is required").optional(),
  timeLimit: z.number().int().positive("Time limit must be positive").optional(),
  passingMarks: z.number().int().positive("Passing marks must be positive").optional(),
  totalMarks: z.number().int().positive("Total marks must be positive").optional(),
  isPublished: z.boolean().optional(),
  questions: z.array(updateQuestionSchema).optional(),
});
