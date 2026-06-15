import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeVideoAccess } from "@/lib/authorization";

export async function POST(req: Request) {
  try {
    // 1. Parse request payload
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { videoId, completed } = body;

    // 2. Validate request data
    if (!videoId || typeof videoId !== "string") {
      return NextResponse.json(
        { message: "Validation error: videoId must be a non-empty string" },
        { status: 400 }
      );
    }

    if (typeof completed !== "boolean") {
      return NextResponse.json(
        { message: "Validation error: completed must be a boolean" },
        { status: 400 }
      );
    }

    // 3. Authorize video access for student, faculty, admin, super_admin
    const auth = await authorizeVideoAccess(req, videoId, ["STUDENT", "FACULTY", "ADMIN", "SUPER_ADMIN"]);
    if (auth.status !== 200) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    const user = auth.user!;

    // 4. Upsert watch progress for user-video relation
    const progress = await prisma.progress.upsert({
      where: {
        userId_videoId: {
          userId: user.id,
          videoId: videoId,
        },
      },
      update: {
        completed: completed,
      },
      create: {
        userId: user.id,
        videoId: videoId,
        completed: completed,
      },
    });

    return NextResponse.json(progress, { status: 200 });
  } catch (error) {
    console.error("POST PROGRESS UPDATE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update video progress" },
      { status: 500 }
    );
  }
}
