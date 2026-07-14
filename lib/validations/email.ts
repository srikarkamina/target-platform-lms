import { z } from "zod";

export const smtpSettingsSchema = z.object({
  smtpHost: z.string().min(1, "SMTP Host is required").nullable().optional(),
  smtpPort: z.preprocess(
    (val) => (typeof val === "string" ? parseInt(val, 10) : val),
    z.number().int().positive().nullable().optional()
  ),
  smtpUsername: z.string().min(1, "SMTP Username is required").nullable().optional(),
  smtpPassword: z.string().min(1, "SMTP Password is required").nullable().optional(),
  smtpEncryption: z.enum(["NONE", "SSL", "TLS"]).default("NONE").optional(),
  smtpSenderName: z.string().min(1, "Sender Name is required").nullable().optional(),
  smtpSenderEmail: z.string().email("Invalid sender email format").nullable().optional(),
  smtpReplyTo: z.string().email("Invalid reply-to email format").or(z.string().length(0)).nullable().optional(),
  emailNotificationsEnabled: z.boolean().default(false),
});

export const testEmailSchema = z.object({
  testEmailAddress: z.string().email("Invalid test email format"),
});

export const emailTemplateSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});
