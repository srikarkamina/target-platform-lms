import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().min(1, "Description is required").max(10000, "Description is too long"),
  category: z.enum(["GENERAL", "ACADEMIC", "EXAM", "HOLIDAY", "PLACEMENT", "EVENTS", "EMERGENCY"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  publishDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional().nullable(),
  active: z.boolean().optional(),
  pinned: z.boolean().optional(),
  targetAudience: z.enum(["EVERYONE", "STUDENTS", "FACULTY", "COURSE", "BATCH"]),
  courseId: z.string().optional().nullable(),
  batchId: z.string().optional().nullable(),
  attachments: z.array(
    z.object({
      fileUrl: z.string().url("Invalid file URL"),
      fileName: z.string().min(1, "File name is required").max(255, "File name is too long"),
      mimeType: z.string().optional().nullable(),
      fileSize: z.number().int().positive().optional().nullable(),
    })
  ).optional(),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export const getAnnouncementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  targetAudience: z.string().optional(),
  active: z.string().transform((val) => val === "true" ? true : val === "false" ? false : undefined).optional(),
  pinned: z.string().transform((val) => val === "true" ? true : val === "false" ? false : undefined).optional(),
});
