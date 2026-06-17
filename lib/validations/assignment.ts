import { z } from "zod";

export const createAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  courseId: z.string().min(1, "Course ID is required"),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  courseId: z.string().min(1, "Course ID is required").optional(),
});
