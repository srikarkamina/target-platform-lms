import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { createPollSchema } from "@/lib/validations/poll";
import { logAction } from "@/lib/services/audit-service";
import { createNotifications } from "@/lib/services/notification-service";
import { NotificationType, NotificationPriority } from "@/app/generated/prisma/client";

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

    const instituteId = user.instituteId || "global";

    const where: any = {
      deletedAt: null,
      instituteId
    };

    const polls = await prisma.poll.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: { id: true, name: true }
        },
        options: {
          where: { deletedAt: null },
          include: {
            _count: {
              select: { votes: { where: { deletedAt: null } } }
            }
          }
        },
        votes: {
          where: { userId: user.id, deletedAt: null },
          select: { optionId: true }
        }
      }
    });

    const now = new Date();

    const formattedPolls = polls.map(p => {
      const isExpired = new Date(p.expiryDate) < now;
      const hasVoted = p.votes.length > 0;
      const votedOptionIds = p.votes.map(v => v.optionId);

      // Visibility of results:
      // Show results if user is Admin/Faculty, or if results are public, or if poll is expired.
      const showResults =
        ["ADMIN", "SUPER_ADMIN", "FACULTY"].includes(user.role) ||
        p.publicResults ||
        isExpired;

      return {
        id: p.id,
        question: p.question,
        type: p.type,
        anonymous: p.anonymous,
        publicResults: p.publicResults,
        allowVoteUpdate: p.allowVoteUpdate,
        expiryDate: p.expiryDate,
        isExpired,
        hasVoted,
        votedOptionIds,
        createdBy: p.createdBy,
        creatorName: p.creator.name,
        createdAt: p.createdAt,
        options: p.options.map(o => ({
          id: o.id,
          text: o.text,
          votesCount: showResults ? o._count.votes : 0
        }))
      };
    });

    return NextResponse.json(formattedPolls);
  } catch (error) {
    console.error("GET POLLS ERROR:", error);
    return NextResponse.json({ message: "Failed to fetch polls" }, { status: 500 });
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

    // Role verification
    if (!["ADMIN", "SUPER_ADMIN", "FACULTY"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden: Admin or Faculty access required" }, { status: 403 });
    }

    const instituteId = user.instituteId || "global";

    const body = await req.json();
    const validation = createPollSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { question, type, anonymous, publicResults, allowVoteUpdate, expiryDate, options } = validation.data;

    const newPoll = await prisma.$transaction(async (tx) => {
      const poll = await tx.poll.create({
        data: {
          question,
          type,
          anonymous: anonymous || false,
          publicResults: publicResults !== undefined ? publicResults : true,
          allowVoteUpdate: allowVoteUpdate || false,
          expiryDate,
          instituteId,
          createdBy: user.id,
          options: {
            create: options.map(opt => ({
              text: opt,
              instituteId,
              createdBy: user.id
            }))
          }
        },
        include: {
          options: true
        }
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId,
        action: "CREATE_POLL",
        module: "POLLS",
        entityType: "Poll",
        entityId: poll.id,
        description: `Created poll: ${question}`
      });

      return poll;
    });

    // Notify all students of the new poll
    const students = await prisma.user.findMany({
      where: { instituteId, role: "STUDENT", deletedAt: null },
      select: { id: true }
    });

    const studentIds = students.map(s => s.id);
    if (studentIds.length > 0) {
      await createNotifications({
        userIds: studentIds,
        instituteId,
        title: "New Poll Active",
        message: `An instructor posted a new poll: "${question}"`,
        type: NotificationType.POLL_CREATED,
        priority: NotificationPriority.NORMAL,
        actionUrl: `/dashboard/polls`
      }).catch(err => console.error("POLL CREATED NOTIFICATION ERROR:", err));
    }

    return NextResponse.json(newPoll, { status: 201 });
  } catch (error) {
    console.error("POST POLL ERROR:", error);
    return NextResponse.json({ message: "Failed to create poll", error: String(error) }, { status: 500 });
  }
}
