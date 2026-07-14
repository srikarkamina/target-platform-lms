import { z } from "zod";

export const createDoubtSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200, "Subject is too long"),
  description: z.string().min(1, "Description is required").max(10000, "Description is too long"),
  courseId: z.string().min(1, "Course ID is required"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  anonymous: z.boolean().optional(),
  attachmentUrl: z.string().optional().nullable(),
  attachmentName: z.string().optional().nullable(),
});

export const updateDoubtSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  assignedToId: z.string().optional().nullable(),
});

export const createDoubtReplySchema = z.object({
  content: z.string().min(1, "Reply content is required").max(5000, "Reply content is too long"),
});

export const getDoubtsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.string().optional(),
  priority: z.string().optional(),
  courseId: z.string().optional(),
});
