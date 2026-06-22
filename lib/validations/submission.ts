import { z } from "zod";

export const createSubmissionSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  fileUrl: z.string().min(1, "File URL is required"),
  fileName: z.string().min(1, "File Name is required"),
  mimeType: z.string().optional().nullable(),
  fileSize: z.number().int().nonnegative().optional().nullable(),
  studentId: z.string().optional().nullable(),
});

export const updateSubmissionSchema = z.object({
  grade: z.number().int().nonnegative().optional().nullable(),
  fileUrl: z.string().min(1, "File URL is required").optional(),
  fileName: z.string().min(1, "File Name is required").optional(),
  mimeType: z.string().optional().nullable(),
  fileSize: z.number().int().nonnegative().optional().nullable(),
  feedback: z.string().optional().nullable(),
});
