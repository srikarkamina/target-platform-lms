import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { submitFeedbackSchema, getFeedbackQuerySchema } from "@/lib/validations/feedback";
import { logAction } from "@/lib/services/audit-service";

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Role verification: Only Admins (Institute Admins) and Super Admins can access
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden: Administrative access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validation = getFeedbackQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { page, limit, category, priority, status } = validation.data;
    const search = searchParams.get("search");

    const where: any = { deletedAt: null };

    // Tenant Isolation: Institute Admins can only see feedback from their own institute
    if (user.role !== "SUPER_ADMIN") {
      where.instituteId = user.instituteId;
    }

    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (status) where.status = status;

    if (search) {
      where.comments = { contains: search, mode: "insensitive" };
    }

    const skip = (page - 1) * limit;

    const [data, total, statusAggregations, categoryAggregations, priorityAggregations] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
            select: { id: true, name: true, email: true, role: true }
          },
          institute: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.feedback.count({ where }),
      prisma.feedback.groupBy({
        by: ["status"],
        where,
        _count: { id: true }
      }),
      prisma.feedback.groupBy({
        by: ["category"],
        where,
        _count: { id: true }
      }),
      prisma.feedback.groupBy({
        by: ["priority"],
        where,
        _count: { id: true }
      })
    ]);

    // Format aggregations
    const statusCounts: Record<string, number> = { PENDING: 0, REVIEWED: 0, RESOLVED: 0 };
    statusAggregations.forEach(agg => {
      statusCounts[agg.status] = agg._count.id;
    });

    const categoryCounts: Record<string, number> = { PLATFORM: 0, BUG_REPORT: 0, SUGGESTION: 0, OTHER: 0 };
    categoryAggregations.forEach(agg => {
      categoryCounts[agg.category] = agg._count.id;
    });

    const priorityCounts: Record<string, number> = { LOW: 0, NORMAL: 0, HIGH: 0, URGENT: 0 };
    priorityAggregations.forEach(agg => {
      priorityCounts[agg.priority] = agg._count.id;
    });

    // Anonymize creators for anonymous submissions
    const sanitizedData = data.map(item => {
      if (item.anonymous) {
        return {
          ...item,
          creator: {
            id: "",
            name: "Anonymous Admin",
            email: "",
            role: "ADMIN"
          }
        };
      }
      return item;
    });

    return NextResponse.json({
      data: sanitizedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      analytics: {
        totalCount: total,
        statusCounts,
        categoryCounts,
        priorityCounts
      }
    });
  } catch (error) {
    console.error("GET FEEDBACK ERROR:", error);
    return NextResponse.json({ message: "Failed to fetch feedbacks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only Institute Admins can submit platform feedback to Super Admin
    if (user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Only Institute Admins can submit feedback" }, { status: 403 });
    }

    const instituteId = user.instituteId || "global";

    const body = await req.json();
    const validation = submitFeedbackSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { category, priority, comments, anonymous } = validation.data;

    const newFeedback = await prisma.$transaction(async (tx) => {
      const feedback = await tx.feedback.create({
        data: {
          type: category, // maintain legacy field
          category,
          priority,
          comments,
          anonymous: anonymous || false,
          status: "PENDING",
          instituteId,
          createdBy: user.id
        }
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId,
        action: "SUBMIT_FEEDBACK",
        module: "FEEDBACK",
        entityType: "Feedback",
        entityId: feedback.id,
        description: `Submitted platform feedback: ${category} (${priority})`
      });

      return feedback;
    });

    return NextResponse.json(newFeedback, { status: 201 });
  } catch (error) {
    console.error("POST FEEDBACK ERROR:", error);
    return NextResponse.json({ message: "Failed to submit feedback", error: String(error) }, { status: 500 });
  }
}
