import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { uploadFile, getPublicUrl, supabaseAdmin } from "@/lib/supabase";
import { SubscriptionService } from "@/lib/services/subscription-service";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid or missing token" },
        { status: 401 }
      );
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized: User not found" },
        { status: 401 }
      );
    }

    // 2. Authorize user (ADMIN or SUPER_ADMIN only)
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // 3. Parse formData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "logo", "banner", "favicon", "signature", "seal"

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    if (!type || !["logo", "banner", "favicon", "signature", "seal"].includes(type)) {
      return NextResponse.json(
        { message: "Invalid or missing upload type" },
        { status: 400 }
      );
    }

    // 4. Validate file size (30 MB limit)
    const maxFileSize = 30 * 1024 * 1024;
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { message: "Maximum file size is 30 MB." },
        { status: 400 }
      );
    }

    // 5. Validate file type (PNG, JPG, JPEG, ICO, GIF)
    const allowedMimes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/x-icon",
      "image/vnd.microsoft.icon",
      "image/gif",
    ];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["png", "jpg", "jpeg", "ico", "gif"];

    if (!allowedMimes.includes(file.type) || !fileExt || !allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { message: "Invalid file type. Only PNG, JPG, JPEG, ICO, and GIF images are allowed." },
        { status: 400 }
      );
    }

    // 6. Ensure Supabase Bucket exists
    const bucketName = "branding-assets";
    try {
      await supabaseAdmin.storage.createBucket(bucketName, { public: true });
    } catch {
      // Ignored if bucket already exists
    }

    // 7. Determine instituteId (Super Admin can upload for any, but defaults to global or target param)
    // For standard admins, it's their user.instituteId
    const { searchParams } = new URL(req.url);
    let targetInstituteId = user.instituteId || "global";
    if (user.role === "SUPER_ADMIN") {
      const paramInstId = searchParams.get("instituteId") || formData.get("instituteId") as string | null;
      if (paramInstId) {
        targetInstituteId = paramInstId;
      }
    }

    // Verify storage quota limit
    const canUpload = await SubscriptionService.checkStorageLimit(targetInstituteId, file.size);
    if (!canUpload) {
      return NextResponse.json(
        { message: "Storage quota exceeded for this subscription plan. Please upgrade." },
        { status: 400 }
      );
    }

    // 8. Upload to Supabase Storage
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueName = `${Date.now()}-${sanitizedName}`;
    const storagePath = `${targetInstituteId}/${type}/${uniqueName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Mimetype mapping for safety
    let mimeType = file.type;
    if (!mimeType && fileExt) {
      if (fileExt === "jpg") mimeType = "image/jpeg";
      else if (fileExt === "png") mimeType = "image/png";
      else if (fileExt === "ico") mimeType = "image/x-icon";
      else if (fileExt === "gif") mimeType = "image/gif";
      else mimeType = `image/${fileExt}`;
    }

    await uploadFile(buffer, bucketName, storagePath, mimeType);

    // Save size in settings
    const settingsFields: Record<string, string> = {
      logo: "logoSize",
      banner: "bannerSize",
      favicon: "faviconSize",
      signature: "defaultSignatureImageSize",
      seal: "defaultSealImageSize",
    };

    const targetField = settingsFields[type];
    if (targetField) {
      try {
        await prisma.instituteSettings.update({
          where: { instituteId: targetInstituteId },
          data: { [targetField]: file.size },
        });
      } catch (dbErr) {
        console.error(`Failed to update ${targetField} size in DB:`, dbErr);
      }
    }

    // Trigger Usage Snapshot
    try {
      await SubscriptionService.takeUsageSnapshot(targetInstituteId);
    } catch (snapshotErr) {
      console.error("Failed to record usage snapshot on branding upload:", snapshotErr);
    }

    // Get public URL
    const publicUrl = getPublicUrl(bucketName, storagePath);

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        storagePath,
        fileName: file.name,
        fileSize: file.size,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("BRANDING ASSETS UPLOAD ERROR:", error);
    return NextResponse.json(
      { message: "Failed to upload branding asset", error: String(error) },
      { status: 500 }
    );
  }
}
