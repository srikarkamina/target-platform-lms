import { z } from "zod";

export const startAttemptSchema = z.object({
  quizId: z.string().uuid("Invalid Quiz ID format"),
});

export const saveAnswerSchema = z.object({
  attemptId: z.string().uuid("Invalid Attempt ID format"),
  questionId: z.string().uuid("Invalid Question ID format"),
  selectedAnswers: z.array(z.string()).min(1, "At least one answer selection is required"),
});

export const submitAttemptSchema = z.object({
  attemptId: z.string().uuid("Invalid Attempt ID format"),
});
