import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(255),
  title: z.string().min(1, "Certificate title is required").max(255),
  description: z.string().max(1000).nullable().optional(),
  backgroundImage: z.string().url("Invalid background image URL").or(z.string().length(0)).nullable().optional(),
  signatureImage: z.string().url("Invalid signature image URL").or(z.string().length(0)).nullable().optional(),
  isActive: z.boolean().default(true).optional(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(255).optional(),
  title: z.string().min(1, "Certificate title is required").max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  backgroundImage: z.string().url("Invalid background image URL").or(z.string().length(0)).nullable().optional(),
  signatureImage: z.string().url("Invalid signature image URL").or(z.string().length(0)).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const generateCertificateSchema = z.object({
  studentId: z.string().uuid("Invalid student ID format"),
  courseId: z.string().uuid("Invalid course ID format"),
  templateId: z.string().uuid("Invalid template ID format"),
  completionDate: z.preprocess(
    (val) => (typeof val === "string" && val ? new Date(val) : val),
    z.date().optional()
  ),
});
