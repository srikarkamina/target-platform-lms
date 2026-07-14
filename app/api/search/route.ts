import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { validateSearchParams } from "@/lib/validations/search";
import { SearchService } from "@/lib/search/search-service";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid or missing authentication token" },
        { status: 401 }
      );
    }

    // 2. Resolve Authorized User Profile (instituteId & Role check)
    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: User account not found" },
        { status: 401 }
      );
    }

    // 3. Extract & Validate Query Parameters
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const type = searchParams.get("type");

    const validation = validateSearchParams({ q, page, limit, type });
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 4. Execute Search
    const searchService = SearchService.getInstance();
    const result = await searchService.search(validation.data, user);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Global search API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
