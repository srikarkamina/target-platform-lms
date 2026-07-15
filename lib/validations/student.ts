import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or less"),
  email: z.string().email("Invalid email address").max(255, "Email must be 255 characters or less"),
  phone: z.string().max(20).or(z.string().length(0)).nullable().optional(),
  courseIds: z.array(z.string()).min(1, "At least one course enrollment is required"),
  instituteId: z.string().nullable().optional(),
});

export const updateStudentSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or less").optional(),
  email: z.string().email("Invalid email address").max(255, "Email must be 255 characters or less").optional(),
  phone: z.string().max(20).or(z.string().length(0)).nullable().optional(),
  courseIds: z.array(z.string()).min(1, "At least one course enrollment is required").optional(),
  instituteId: z.string().nullable().optional(),
});
