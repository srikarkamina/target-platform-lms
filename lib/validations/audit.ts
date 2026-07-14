import { z } from "zod";

export const auditLogQuerySchema = z.object({
  page: z.preprocess(
    (val) => (typeof val === "string" ? parseInt(val, 10) : val),
    z.number().int().positive().default(1)
  ),
  limit: z.preprocess(
    (val) => (typeof val === "string" ? parseInt(val, 10) : val),
    z.number().int().positive().max(100).default(20)
  ),
  search: z.string().optional(),
  action: z.string().optional(),
  module: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(["SUCCESS", "FAILURE"]).optional(),
  startDate: z.string().datetime({ message: "Invalid startDate format" }).or(z.string().length(0)).nullable().optional(),
  endDate: z.string().datetime({ message: "Invalid endDate format" }).or(z.string().length(0)).nullable().optional(),
  instituteId: z.string().optional(),
});
