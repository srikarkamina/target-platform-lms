import { z } from "zod";

export const createInstituteSchema = z.object({
  name: z.string().min(1, "Institute Name is required").max(255),
  adminName: z.string().min(1, "Admin Name is required").max(255),
  adminEmail: z.string().email("Invalid admin email format"),
  adminPhone: z.string().max(20).or(z.string().length(0)).nullable().optional(),
  logo: z.string().url("Invalid logo URL").or(z.string().length(0)).nullable().optional(),
  promoteConfirmed: z.boolean().optional(),
});

export const updateInstituteSchema = z.object({
  name: z.string().min(1, "Institute Name is required").max(255),
  adminName: z.string().min(1, "Admin Name is required").max(255),
  adminEmail: z.string().email("Invalid admin email format"),
  adminPhone: z.string().max(20).or(z.string().length(0)).nullable().optional(),
  logo: z.string().url("Invalid logo URL").or(z.string().length(0)).nullable().optional(),
  promoteConfirmed: z.boolean().optional(),
});
