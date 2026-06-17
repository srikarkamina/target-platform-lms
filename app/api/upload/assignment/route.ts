import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  try {
    console.log("[UPLOAD ROUTE] Received request to upload assignment file.");

    // 1. Authenticate user
    const payload = await authenticateRequest(req);
    if (!payload) {
      console.warn("[UPLOAD ROUTE] Unauthorized: Invalid or missing token.");
      return NextResponse.json(
        { message: "Unauthorized: Invalid or missing token" },
        { status: 401 }
      );
    }
    console.log(`[UPLOAD ROUTE] Authenticated user: email="${payload.email}", role="${payload.role}", id="${payload.id}"`);

    // 2. Parse request form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      console.warn("[UPLOAD ROUTE] Bad Request: No file attached to the form data.");
      return NextResponse.json(
        { message: "No file uploaded" },
        { status: 400 }
      );
    }
    console.log(`[UPLOAD ROUTE] Processing file: name="${file.name}", size=${file.size} bytes, type="${file.type}"`);

    // 3. Validate file extension
    const ext = path.extname(file.name).toLowerCase().replace(".", "");
    const allowedExtensions = ["pdf", "doc", "docx", "ppt", "pptx", "zip", "rar"];

    if (!allowedExtensions.includes(ext)) {
      console.warn(`[UPLOAD ROUTE] Validation Failed: File type "${ext}" is not allowed.`);
      return NextResponse.json(
        { message: `Invalid file type. Allowed formats: ${allowedExtensions.join(", ").toUpperCase()}` },
        { status: 400 }
      );
    }
    console.log(`[UPLOAD ROUTE] Extension validation passed: "${ext}"`);

    // 4. Validate file size (300MB limit)
    const maxSize = 300 * 1024 * 1024;
    if (file.size > maxSize) {
      console.warn(`[UPLOAD ROUTE] Validation Failed: File size ${file.size} exceeds 300MB limit.`);
      return NextResponse.json(
        { message: "File size exceeds the 300MB limit" },
        { status: 400 }
      );
    }
    console.log("[UPLOAD ROUTE] Size validation passed (< 300MB)");

    // 5. Ensure directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "assignments");
    console.log(`[UPLOAD ROUTE] Saving file to directory: ${uploadsDir}`);
    await fs.mkdir(uploadsDir, { recursive: true });

    // 6. Generate unique filename and write to disk
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    console.log(`[UPLOAD ROUTE] Writing buffer to filePath: ${filePath}`);
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));
    console.log("[UPLOAD ROUTE] File successfully written to disk.");

    const fileUrl = `/uploads/assignments/${uniqueFileName}`;

    console.log(`[UPLOAD ROUTE] Successfully generated local URL path: ${fileUrl}`);

    return NextResponse.json(
      {
        success: true,
        url: fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || `application/${ext}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[UPLOAD ROUTE] CRITICAL ERROR DURING UPLOAD:", error);
    return NextResponse.json(
      { message: "Failed to upload file", error: String(error) },
      { status: 500 }
    );
  }
}
