import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { uploadFile, getPublicUrl, supabaseAdmin } from "@/lib/supabase";
import { SubscriptionService } from "@/lib/services/subscription-service";

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

    // 2. Authorize role (Admin / Super Admin / Faculty)
    if (!["ADMIN", "SUPER_ADMIN", "FACULTY"].includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: Announcement creator permissions required" },
        { status: 403 }
      );
    }

    const instituteId = user.instituteId || "global";

    // 3. Parse formData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    // 4. Validate storage quota limit
    const canUpload = await SubscriptionService.checkStorageLimit(instituteId, file.size);
    if (!canUpload) {
      return NextResponse.json(
        { message: "Storage quota exceeded for this subscription plan. Please upgrade." },
        { status: 400 }
      );
    }

    // 5. Validate file size (30MB limit)
    const maxFileSize = 30 * 1024 * 1024;
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { message: "Maximum file size is 30 MB." },
        { status: 400 }
      );
    }

    // 6. Validate file type / extension
    const allowedExtensions = [
      "png", "jpg", "jpeg", "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip", "rar", "txt"
    ];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      return NextResponse.json(
        { message: `Invalid file type. Allowed formats: ${allowedExtensions.join(", ").toUpperCase()}` },
        { status: 400 }
      );
    }

    // 7. Ensure Supabase Bucket exists
    const bucketName = "attachments";
    try {
      await supabaseAdmin.storage.createBucket(bucketName, { public: true });
    } catch {
      // Ignored if bucket already exists
    }

    // 8. Upload to Supabase Storage
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueName = `${Date.now()}-${sanitizedName}`;
    const storagePath = `${instituteId}/announcements/${uniqueName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadFile(buffer, bucketName, storagePath, file.type || "application/octet-stream");

    // Take Usage Snapshot
    try {
      await SubscriptionService.takeUsageSnapshot(instituteId);
    } catch (snapshotErr) {
      console.error("Failed to record usage snapshot on announcement upload:", snapshotErr);
    }

    // Get public URL
    const publicUrl = getPublicUrl(bucketName, storagePath);

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream"
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ANNOUNCEMENT FILE UPLOAD ERROR:", error);
    return NextResponse.json(
      { message: "Failed to upload file attachment", error: String(error) },
      { status: 500 }
    );
  }
}
