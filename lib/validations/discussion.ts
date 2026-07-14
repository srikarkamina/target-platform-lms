import { z } from "zod";

export const createDiscussionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
});

export const updateDiscussionSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  pinned: z.boolean().optional(),
  locked: z.boolean().optional(),
});

export const createDiscussionReplySchema = z.object({
  content: z.string().min(1, "Content is required"),
  parentId: z.string().optional().nullable(),
  isOfficialAnswer: z.boolean().optional(),
});

export const getDiscussionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});
