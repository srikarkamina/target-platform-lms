import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import {
  getInstituteSettings,
  updateInstituteSettings,
  deleteBrandingAsset,
} from "@/lib/services/settings-service";
import { instituteSettingsSchema } from "@/lib/validations/settings";
import { logAction } from "@/lib/services/audit-service";

/**
 * GET /api/institute/settings
 * Retrieve institute settings.
 * SUPER_ADMIN can view settings for any institute by passing an ?instituteId= query param.
 * ADMIN and FACULTY can view settings for their own institute.
 * STUDENT has no access.
 */
export async function GET(req: NextRequest) {
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

    // 2. Permission check: Admin, Super Admin allowed. Faculty, Student forbidden.
    const allowedRoles = ["SUPER_ADMIN", "ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: You are not authorized to view settings" },
        { status: 403 }
      );
    }

    // 3. Resolve instituteId
    const { searchParams } = new URL(req.url);
    const paramInstId = searchParams.get("instituteId");

    let targetInstituteId = user.instituteId;
    if (user.role === "SUPER_ADMIN" && paramInstId) {
      targetInstituteId = paramInstId;
    }

    if (!targetInstituteId) {
      return NextResponse.json(
        { message: "Bad Request: Target institute could not be resolved" },
        { status: 400 }
      );
    }

    // 4. Retrieve settings
    const settings = await getInstituteSettings(targetInstituteId);

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("GET INSTITUTE SETTINGS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch institute settings", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/institute/settings
 * Update settings.
 * SUPER_ADMIN can update settings for any institute.
 * ADMIN can update settings for their own institute.
 * FACULTY and STUDENT have no write access (403).
 */
export async function PUT(req: NextRequest) {
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

    // 2. Permission check: Only Admin and Super Admin can write settings.
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Only administrators can modify settings" },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // 3. Zod Input Validation
    const validationResult = instituteSettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Validation failed", errors: validationResult.error.issues },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // 4. Resolve and isolate target institute
    let targetInstituteId = user.instituteId;
    if (user.role === "SUPER_ADMIN") {
      // Super admin can specify instituteId in the body
      targetInstituteId = body.instituteId || user.instituteId;
    }

    if (!targetInstituteId) {
      return NextResponse.json(
        { message: "Forbidden: Target institute could not be resolved" },
        { status: 403 }
      );
    }

    // 5. Safe replacement of previous assets: compare before update
    const currentSettings = await getInstituteSettings(targetInstituteId);
    const assetKeys: Array<keyof typeof validatedData> = [
      "logoUrl",
      "bannerUrl",
      "faviconUrl",
      "defaultSignatureImage",
      "defaultSealImage",
    ];

    for (const key of assetKeys) {
      const incomingVal = validatedData[key];
      if (incomingVal !== undefined) {
        const currentVal = currentSettings[key as keyof typeof currentSettings] as string | null;

        // If the URL has changed (and isn't just empty), clean up the previous file
        if (currentVal && incomingVal !== currentVal) {
          await deleteBrandingAsset(currentVal);
        }
      }
    }

    // 6. Perform the settings update
    const updatedSettings = await updateInstituteSettings(targetInstituteId, validatedData);

    await logAction({
      req,
      userId: user.id,
      instituteId: targetInstituteId,
      action: "UPDATE",
      module: "SETTINGS",
      entityType: "InstituteSettings",
      entityId: updatedSettings.id,
      description: `Institute settings updated`,
      oldValues: currentSettings,
      newValues: updatedSettings,
      status: "SUCCESS",
    });

    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    console.error("PUT INSTITUTE SETTINGS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update institute settings", details: error.message },
      { status: 500 }
    );
  }
}
