import { z } from "zod";

export const createInstituteSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().min(2, "Code must be at least 2 characters").max(50),
  email: z.string().email("Invalid email format"),
  phone: z.string().max(20).or(z.string().length(0)).nullable().optional(),
  address: z.string().max(500).or(z.string().length(0)).nullable().optional(),
  website: z.string().url("Invalid website URL").or(z.string().length(0)).nullable().optional(),
  logo: z.string().url("Invalid logo URL").or(z.string().length(0)).nullable().optional(),
  city: z.string().max(100).or(z.string().length(0)).nullable().optional(),
  state: z.string().max(100).or(z.string().length(0)).nullable().optional(),
  country: z.string().max(100).or(z.string().length(0)).nullable().optional(),
  pincode: z.string().max(20).or(z.string().length(0)).nullable().optional(),
  adminName: z.string().min(1, "Admin Name is required").max(255),
  adminEmail: z.string().email("Invalid admin email format"),
  temporaryPassword: z.string().min(6, "Temporary Password must be at least 6 characters"),
  planId: z.string().min(1, "Subscription Plan is required"),
  
  // Custom overrides (optional)
  maxStudents: z.number().nullable().optional(),
  maxFaculty: z.number().nullable().optional(),
  maxCourses: z.number().nullable().optional(),
  storageLimitGB: z.number().nullable().optional(),
  certificateLimit: z.number().nullable().optional(),
  trialDays: z.number().nullable().optional(),
});

export const updateInstituteSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).optional(),
  logo: z.string().url("Invalid logo URL").or(z.string().length(0)).nullable().optional(),
});
