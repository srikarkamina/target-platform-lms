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

    // 2. Authorize user (ADMIN or SUPER_ADMIN only)
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Tenant info
    const instituteId = user.instituteId || "global";

    // 3. Parse formData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // "background" or "signature"

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    // Verify storage quota limit
    const canUpload = await SubscriptionService.checkStorageLimit(instituteId, file.size);
    if (!canUpload) {
      return NextResponse.json(
        { message: "Storage quota exceeded for this subscription plan. Please upgrade." },
        { status: 400 }
      );
    }

    // 4. Validate file size (5MB limit)
    const maxFileSize = 5 * 1024 * 1024;
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { message: "File size exceeds the 5 MB limit" },
        { status: 400 }
      );
    }

    // 5. Validate file type (PNG, JPG, JPEG)
    const allowedMimes = ["image/png", "image/jpeg", "image/jpg"];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["png", "jpg", "jpeg"];

    if (!allowedMimes.includes(file.type) && (!fileExt || !allowedExtensions.includes(fileExt))) {
      return NextResponse.json(
        { message: "Invalid file type. Only PNG, JPG, and JPEG images are allowed." },
        { status: 400 }
      );
    }

    // 6. Ensure Supabase Bucket exists
    const bucketName = "certificate-assets";
    try {
      await supabaseAdmin.storage.createBucket(bucketName, { public: true });
    } catch {
      // Ignored if bucket already exists
    }

    // 7. Upload to Supabase Storage
    const subfolder = type === "signature" ? "signatures" : "backgrounds";
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueName = `${Date.now()}-${sanitizedName}`;
    const storagePath = `${instituteId}/${subfolder}/${uniqueName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await uploadFile(buffer, bucketName, storagePath, file.type || `image/${fileExt === "jpg" ? "jpeg" : fileExt}`);

    // Get public URL
    const publicUrl = getPublicUrl(bucketName, storagePath);

    try {
      await SubscriptionService.takeUsageSnapshot(instituteId);
    } catch (snapshotErr) {
      console.error("Failed to record usage snapshot on certificate upload:", snapshotErr);
    }

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
    console.error("CERTIFICATE ASSETS UPLOAD ERROR:", error);
    return NextResponse.json(
      { message: "Failed to upload certificate asset", error: String(error) },
      { status: 500 }
    );
  }
}
