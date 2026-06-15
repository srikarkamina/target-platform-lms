/**
 * @swagger
 * /api/upload/video:
 *   post:
 *     summary: Upload a video file to Supabase Storage
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 url:
 *                   type: string
 *                 storagePath:
 *                   type: string
 *                 fileName:
 *                   type: string
 *                 fileSize:
 *                   type: integer
 *                 mimeType:
 *                   type: string
 *       400:
 *         description: Invalid request or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { uploadFile, getPublicUrl } from "@/lib/supabase";
import { uploadVideoSchema } from "@/lib/validations/video";
import { getAuthorizedUser } from "@/lib/authorization";

export async function POST(req: NextRequest) {
  try {
    console.log("[Video Upload API] Incoming headers:");
    req.headers.forEach((val, key) => {
      if (key === "authorization") {
        console.log(`  ${key}: Bearer ${val.substring(7, 17)}...`);
      } else {
        console.log(`  ${key}: ${val}`);
      }
    });

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
        { message: "Unauthorized: User not found in database" },
        { status: 401 }
      );
    }

    // 2. Authorize user (ADMIN only)
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Tenant info
    const instituteId = user.instituteId || "global";

    // 3. Parse and extract file from FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }

    // 4. Validate file using uploadVideoSchema
    const validationResult = uploadVideoSchema.safeParse({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    });

    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues[0]?.message || "Invalid file format";
      return NextResponse.json({ message: errorMsg }, { status: 400 });
    }

    // 5. Upload to Supabase Storage
    const bucketName = process.env.SUPABASE_VIDEO_BUCKET || "course-videos";
    
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;
    const storagePath = `${instituteId}/${uniqueFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload using service role admin client
    await uploadFile(buffer, bucketName, storagePath, file.type);

    // Get public URL
    const publicUrl = getPublicUrl(bucketName, storagePath);

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        storagePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("VIDEO UPLOAD ERROR:", error);
    return NextResponse.json(
      { message: "Failed to upload video", error: String(error) },
      { status: 500 }
    );
  }
}
