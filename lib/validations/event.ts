import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().min(1, "Description is required").max(10000, "Description is too long"),
  venue: z.string().max(255, "Venue address is too long").optional().nullable(),
  onlineMeetingLink: z.string().url("Invalid online meeting link URL").or(z.string().length(0)).optional().nullable(),
  speaker: z.string().max(100, "Speaker name is too long").optional().nullable(),
  banner: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  registrationRequired: z.boolean().optional(),
  capacity: z.coerce.number().int().positive().optional().nullable(),
});

export const getEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  upcoming: z.string().transform((val) => val === "true" ? true : val === "false" ? false : undefined).optional(),
});
