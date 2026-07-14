import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (env.NODE_ENV !== "production") {
  console.log("[Supabase Initialization] URL:", supabaseUrl);
}

// Client for use in standard browser context
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);

// Client for use in server endpoints/components
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

// Admin client using service role key (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function uploadFile(
  file: Buffer | Blob | ArrayBuffer,
  bucket: string,
  path: string,
  contentType?: string
) {
  if (env.NODE_ENV !== "production") {
    console.log(`[Supabase Upload] Attempting upload to bucket: "${bucket}", path: "${path}"`);
  }

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType,
    });
  if (error) {
    console.error("[Supabase Upload] Error response:", JSON.stringify(error, null, 2));
    throw error;
  }
  return data;
}

export async function deleteFile(bucket: string, path: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([path]);
  if (error) {
    console.error("Supabase Storage Delete Error:", error);
    throw error;
  }
  return data;
}

export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}


