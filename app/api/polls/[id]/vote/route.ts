import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { votePollSchema } from "@/lib/validations/poll";
import { logAction } from "@/lib/services/audit-service";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Role check: only students vote
    if (user.role !== "STUDENT") {
      return NextResponse.json({ message: "Forbidden: Only students can vote in polls" }, { status: 403 });
    }

    const poll = await prisma.poll.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        options: { where: { deletedAt: null } }
      }
    });

    if (!poll) {
      return NextResponse.json({ message: "Poll not found" }, { status: 404 });
    }

    // Tenant isolation
    if (poll.instituteId !== user.instituteId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Expiry check
    const now = new Date();
    if (new Date(poll.expiryDate) < now) {
      return NextResponse.json({ message: "Forbidden: This poll has expired and is closed" }, { status: 403 });
    }

    const body = await req.json();
    const validation = votePollSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { optionIds } = validation.data;

    // Single choice restriction check
    if (poll.type === "SINGLE_CHOICE" && optionIds.length > 1) {
      return NextResponse.json({ message: "Forbidden: Single choice polls only allow one selected option" }, { status: 400 });
    }

    // Check options match this poll
    const pollOptionIds = poll.options.map(o => o.id);
    const isValidOptions = optionIds.every(id => pollOptionIds.includes(id));
    if (!isValidOptions) {
      return NextResponse.json({ message: "Invalid poll option ID(s) provided" }, { status: 400 });
    }

    // Check duplicate voting
    const existingVotes = await prisma.pollVote.findMany({
      where: { pollId: params.id, userId: user.id, deletedAt: null }
    });

    if (existingVotes.length > 0) {
      if (!poll.allowVoteUpdate) {
        return NextResponse.json({ message: "Forbidden: You have already voted in this poll and vote updates are disabled" }, { status: 403 });
      }
    }

    await prisma.$transaction(async (tx) => {
      // If updating votes, soft delete previous votes
      if (existingVotes.length > 0) {
        await tx.pollVote.updateMany({
          where: { pollId: params.id, userId: user.id, deletedAt: null },
          data: { deletedAt: new Date() }
        });
      }

      // Create new votes
      const voteData = optionIds.map(optId => ({
        pollId: params.id,
        optionId: optId,
        userId: user.id,
        instituteId: poll.instituteId,
        createdBy: user.id
      }));

      await tx.pollVote.createMany({
        data: voteData
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId: poll.instituteId,
        action: "VOTE_POLL",
        module: "POLLS",
        entityType: "Poll",
        entityId: poll.id,
        description: `Voted in poll: "${poll.question}"`
      });
    });

    return NextResponse.json({ success: true, message: "Vote cast successfully" });
  } catch (error) {
    console.error("VOTE POLL ERROR:", error);
    return NextResponse.json({ message: "Failed to cast vote", error: String(error) }, { status: 500 });
  }
}
