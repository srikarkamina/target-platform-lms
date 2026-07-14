import { z } from "zod";

export const submitFeedbackSchema = z.object({
  category: z.enum(["PLATFORM", "BUG_REPORT", "SUGGESTION", "OTHER"]),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  comments: z.string().min(1, "Comments/description is required").max(5000, "Comments are too long"),
  anonymous: z.boolean().optional(),
});

export const getFeedbackQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
});
