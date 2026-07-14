import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be 255 characters or less"),
  description: z.string().max(2000, "Description must be 2000 characters or less").nullable().optional(),
  courseCode: z.string().min(1, "Course code is required").max(50, "Course code must be 50 characters or less"),
  facultyId: z.string().nullable().optional(),
  instituteId: z.string().nullable().optional(),
});

export const updateCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title must be 255 characters or less").optional(),
  description: z.string().max(2000, "Description must be 2000 characters or less").nullable().optional(),
  courseCode: z.string().min(1, "Course code is required").max(50, "Course code must be 50 characters or less").optional(),
  facultyId: z.string().nullable().optional(),
  instituteId: z.string().nullable().optional(),
});
