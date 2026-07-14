import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeCourseAccess } from "@/lib/authorization";
import { createDiscussionSchema, getDiscussionsQuerySchema } from "@/lib/validations/discussion";
import { logAction } from "@/lib/services/audit-service";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const courseId = params.id;
  try {
    const authResult = await authorizeCourseAccess(req, courseId, ["STUDENT", "FACULTY", "ADMIN", "SUPER_ADMIN"]);
    if (authResult.status !== 200) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const user = authResult.user!;
    const instituteId = user.instituteId || "global";

    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validation = getDiscussionsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { page, limit, search } = validation.data;

    const where: any = {
      courseId,
      deletedAt: null,
      instituteId
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } }
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.discussion.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { pinned: "desc" },
          { createdAt: "desc" }
        ],
        include: {
          creator: {
            select: { id: true, name: true, email: true, role: true }
          },
          _count: {
            select: {
              replies: { where: { deletedAt: null } },
              likes: { where: { deletedAt: null } }
            }
          },
          likes: {
            where: { userId: user.id, deletedAt: null },
            select: { id: true }
          }
        }
      }),
      prisma.discussion.count({ where })
    ]);

    // Format data to indicate if current user liked the thread
    const formattedData = data.map((d) => ({
      ...d,
      isLiked: d.likes.length > 0,
      likesCount: d._count.likes,
      repliesCount: d._count.replies,
      likes: undefined,
      _count: undefined
    }));

    return NextResponse.json({
      data: formattedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("GET DISCUSSIONS ERROR:", error);
    return NextResponse.json({ message: "Failed to fetch discussions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const courseId = params.id;
  try {
    const authResult = await authorizeCourseAccess(req, courseId, ["STUDENT", "FACULTY", "ADMIN", "SUPER_ADMIN"]);
    if (authResult.status !== 200) {
      return NextResponse.json({ message: authResult.message }, { status: authResult.status });
    }

    const user = authResult.user!;
    const instituteId = user.instituteId || "global";

    const body = await req.json();
    const validation = createDiscussionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { title, content } = validation.data;

    const newDiscussion = await prisma.$transaction(async (tx) => {
      const discussion = await tx.discussion.create({
        data: {
          courseId,
          instituteId,
          title,
          content,
          createdBy: user.id
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId,
        action: "CREATE_DISCUSSION",
        module: "DISCUSSIONS",
        entityType: "Discussion",
        entityId: discussion.id,
        description: `Created discussion thread: ${title} in course ${courseId}`,
        newValues: discussion
      });

      return discussion;
    });

    return NextResponse.json(newDiscussion, { status: 201 });
  } catch (error) {
    console.error("POST DISCUSSION ERROR:", error);
    return NextResponse.json({ message: "Failed to create discussion thread" }, { status: 500 });
  }
}
