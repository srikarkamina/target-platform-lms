import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required").default("target_super_secret_key"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  RESEND_API_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  SUPER_ADMIN_EMAIL: z.string().optional(),
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
  console.error("❌ Invalid environment variables configuration:", JSON.stringify(envParsed.error.format(), null, 2));
  throw new Error("Invalid environment variables configuration. Please check your .env file.");
}

export const env = envParsed.data;

// Strict production readiness check
if (env.NODE_ENV === "production" && env.JWT_SECRET === "target_super_secret_key") {
  console.error("❌ SECURITY FAILURE: Running in production with the default JWT_SECRET is prohibited!");
  throw new Error("Production requires a strong, unique JWT_SECRET environment variable.");
}
