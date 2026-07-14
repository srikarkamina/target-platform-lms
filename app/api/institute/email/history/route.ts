import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { EmailStatus, EmailType } from "@/app/generated/prisma/client";

export async function GET(req: NextRequest) {
  try {
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

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: You do not have permission to view email history" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const skip = (page - 1) * limit;

    const status = searchParams.get("status") as EmailStatus | null;
    const type = searchParams.get("type") as EmailType | null;
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Tenant Isolation
    let targetInstituteId = user.instituteId;
    const paramInstId = searchParams.get("instituteId");
    if (user.role === "SUPER_ADMIN" && paramInstId) {
      targetInstituteId = paramInstId;
    }

    const where: any = {};
    if (targetInstituteId) {
      where.instituteId = targetInstituteId;
    }

    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { recipientEmail: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [data, total] = await Promise.all([
      prisma.emailHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.emailHistory.count({ where }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("GET EMAIL HISTORY ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch email history", details: error.message },
      { status: 500 }
    );
  }
}
