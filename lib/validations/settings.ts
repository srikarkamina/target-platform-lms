import { z } from "zod";

export const instituteSettingsSchema = z.object({
  // Institute Info
  name: z.string().min(1, "Institute name is required").max(255).or(z.string().length(0)).nullable().optional(),
  address: z.string().max(255).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().email("Invalid email format").or(z.string().length(0)).nullable().optional(),
  website: z.string().url("Invalid website URL").or(z.string().length(0)).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),

  // Branding
  logoUrl: z.string().url("Invalid logo URL").or(z.string().length(0)).nullable().optional(),
  bannerUrl: z.string().url("Invalid banner URL").or(z.string().length(0)).nullable().optional(),
  faviconUrl: z.string().url("Invalid favicon URL").or(z.string().length(0)).nullable().optional(),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Primary color must be a valid hex code").or(z.string().length(0)).optional(),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Secondary color must be a valid hex code").or(z.string().length(0)).optional(),

  // Certificate Branding
  defaultSignatureImage: z.string().url("Invalid signature image URL").or(z.string().length(0)).nullable().optional(),
  defaultSealImage: z.string().url("Invalid seal image URL").or(z.string().length(0)).nullable().optional(),
  defaultCertificateTemplateId: z.string().uuid("Invalid certificate template ID format").or(z.string().length(0)).nullable().optional(),

  // Localization
  timezone: z.string().min(1, "Timezone is required").max(100).optional(),
  dateFormat: z.string().min(1, "Date format is required").max(50).optional(),
  language: z.string().min(1, "Language is required").max(10).optional(),

  // SMTP Configuration
  smtpHost: z.string().min(1, "SMTP Host is required").nullable().optional(),
  smtpPort: z.preprocess(
    (val) => (typeof val === "string" ? parseInt(val, 10) : val),
    z.number().int().positive().nullable().optional()
  ),
  smtpUsername: z.string().nullable().optional(),
  smtpPassword: z.string().nullable().optional(),
  smtpEncryption: z.enum(["NONE", "SSL", "TLS"]).default("NONE").optional(),
  smtpSenderName: z.string().nullable().optional(),
  smtpSenderEmail: z.string().email("Invalid sender email format").or(z.string().length(0)).nullable().optional(),
  smtpReplyTo: z.string().email("Invalid reply-to email format").or(z.string().length(0)).nullable().optional(),
  emailNotificationsEnabled: z.boolean().default(false).optional(),
});
