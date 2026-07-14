import { prisma } from "@/lib/prisma";
import { InstituteSettings } from "@/app/generated/prisma/client";
import { encrypt } from "@/lib/crypto";

/**
 * Initializes default settings for an institute if they don't already exist.
 */
export async function initializeInstituteSettings(instituteId: string): Promise<InstituteSettings> {
  const existing = await prisma.instituteSettings.findUnique({
    where: { instituteId },
  });

  if (existing) {
    return existing;
  }

  try {
    return await prisma.instituteSettings.create({
      data: {
        instituteId,
        primaryColor: "#0f172a",
        secondaryColor: "#3b82f6",
        timezone: "UTC",
        dateFormat: "YYYY-MM-DD",
        language: "en",
      },
    });
  } catch (err) {
    const backup = await prisma.instituteSettings.findUnique({
      where: { instituteId },
    });
    if (backup) {
      return backup;
    }
    throw err;
  }
}

/**
 * Retrieves the settings for an institute, initializing them if they do not exist.
 */
export async function getInstituteSettings(instituteId: string): Promise<InstituteSettings> {
  const settings = await prisma.instituteSettings.findUnique({
    where: { instituteId },
  });

  const resolved = settings ? settings : await initializeInstituteSettings(instituteId);

  // Mask password before returning to client
  if (resolved.smtpPassword) {
    resolved.smtpPassword = "••••••••";
  }

  return resolved;
}

/**
 * Updates the settings for an institute.
 */
export async function updateInstituteSettings(
  instituteId: string,
  data: Partial<Omit<InstituteSettings, "id" | "instituteId" | "createdAt" | "updatedAt">>
): Promise<InstituteSettings> {
  // Ensure settings are initialized first
  await getInstituteSettings(instituteId);

  const updateData: any = { ...data };

  // Secure password handling
  if (updateData.smtpPassword !== undefined) {
    if (updateData.smtpPassword === "••••••••" || !updateData.smtpPassword) {
      // Keep existing password
      delete updateData.smtpPassword;
    } else {
      // Encrypt new password
      updateData.smtpPassword = encrypt(updateData.smtpPassword);
    }
  }

  const updated = await prisma.instituteSettings.update({
    where: { instituteId },
    data: updateData,
  });

  // Mask password before returning to client
  if (updated.smtpPassword) {
    updated.smtpPassword = "••••••••";
  }

  return updated;
}

/**
 * Safely deletes a branding asset from Supabase storage if it matches the expected bucket.
 */
export async function deleteBrandingAsset(url: string, bucket: string = "branding-assets"): Promise<void> {
  if (!url) return;
  try {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = url.indexOf(marker);
    if (markerIndex !== -1) {
      const storagePath = url.substring(markerIndex + marker.length);
      const { deleteFile } = await import("@/lib/supabase");
      await deleteFile(bucket, storagePath);
      console.log(`Successfully cleaned up old asset from storage: ${storagePath}`);
    }
  } catch (err) {
    console.error(`Failed to delete old asset in storage for URL: ${url}`, err);
  }
}
