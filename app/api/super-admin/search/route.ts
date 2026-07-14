import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { SearchService } from "@/lib/search/search-service";

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
    const query = searchParams.get("q") || "";

    if (!query) {
      return NextResponse.json({
        institutes: [],
        students: [],
        faculty: [],
        courses: [],
      });
    }

    const searchService = SearchService.getInstance();
    const result = await searchService.search(
      {
        q: query,
        page: 1,
        limit: 5,
      },
      user
    );

    return NextResponse.json({
      institutes: result.data.institutes || [],
      students: result.data.students || [],
      faculty: result.data.faculty || [],
      courses: result.data.courses || [],
    });
  } catch (error) {
    console.error("[SUPER ADMIN GLOBAL SEARCH GET]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
