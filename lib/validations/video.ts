import { z } from "zod";

export const createVideoSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).nullable().optional(),
  videoUrl: z.string().url("Invalid video URL"),
  storagePath: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.number().int().nonnegative().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  duration: z.number().int().nonnegative().nullable().optional(),
  sortOrder: z.number().int().default(0),
  published: z.boolean().default(true).optional(),
  courseId: z.string().min(1, "Course ID is required"),
});

export const updateVideoSchema = z.object({
  title: z.string().min(1, "Title is required").max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  videoUrl: z.string().url("Invalid video URL").optional(),
  storagePath: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
  fileSize: z.number().int().nonnegative().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  duration: z.number().int().nonnegative().nullable().optional(),
  sortOrder: z.number().int().optional(),
  published: z.boolean().optional(),
});

export const uploadVideoSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().int().max(2 * 1024 * 1024 * 1024, "Maximum video size is 2GB"),
  mimeType: z.string().refine(
    (mime) => ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska", "video/mov"].includes(mime) || 
              mime.startsWith("video/"),
    "Only MP4, WebM, and MOV video files are allowed"
  ),
});
