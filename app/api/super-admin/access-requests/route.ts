import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { AccessRequestService } from "@/lib/services/access-request.service";
import { AccessRequestStatus } from "@/app/generated/prisma/client";

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as AccessRequestStatus) || undefined;
    const plan = searchParams.get("plan") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const result = await AccessRequestService.getRequests({
      search,
      status,
      plan,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[GET SUPER ADMIN ACCESS REQUESTS ERROR]", error);
    return NextResponse.json(
      { message: "Failed to load access requests." },
      { status: 500 }
    );
  }
}
