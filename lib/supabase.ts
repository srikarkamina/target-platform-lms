import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key";

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SERVICE_ROLE_EXISTS:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log(
  "SERVICE_ROLE_PREFIX:",
  process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 15)
);

console.log("[Supabase Initialization] URL:", supabaseUrl);

console.log("[Supabase Initialization] Anon Key loaded:", supabaseAnonKey !== "placeholder-anon-key" ? `yes (starts with ${supabaseAnonKey.substring(0, 10)})` : "no");
console.log("[Supabase Initialization] Service Role Key loaded:", supabaseServiceKey !== "placeholder-service-key" ? `yes (starts with ${supabaseServiceKey.substring(0, 10)})` : "no");

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
  console.log(`[Supabase Upload] Attempting upload to bucket: "${bucket}", path: "${path}"`);
  console.log(`[Supabase Upload] Client URL: "${supabaseUrl}"`);
  console.log(`[Supabase Upload] Using Service Key: "${supabaseServiceKey.substring(0, 10)}..." (Length: ${supabaseServiceKey.length})`);

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
  console.log("[Supabase Upload] Upload success data:", data);
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


