/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
 *     responses:
 *       200:
 *         description: List of courses
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        institute: true,
        faculty: true,
      },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[POST /api/courses] Incoming payload:", body);

    const {
      title,
      description,
      courseCode,
      instituteId: bodyInstituteId,
      facultyId,
    } = body;

    // 1. Try to get instituteId from authenticated user
    let resolvedInstituteId = null;
    const payload = await authenticateRequest(req);
    console.log("[POST /api/courses] Authenticated payload:", payload);
    if (payload) {
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { instituteId: true }
      });
      resolvedInstituteId = dbUser?.instituteId;
      console.log("[POST /api/courses] User instituteId from DB:", resolvedInstituteId);
    }

    // 2. Fallback to first institute in db
    if (!resolvedInstituteId) {
      const firstInst = await prisma.institute.findFirst();
      resolvedInstituteId = firstInst?.id;
      console.log("[POST /api/courses] Fallback to first institute in DB:", resolvedInstituteId);
    }

    // 3. Fallback to body
    if (!resolvedInstituteId) {
      resolvedInstituteId = bodyInstituteId;
    }

    if (!resolvedInstituteId) {
      console.error("[POST /api/courses] Error: No instituteId could be resolved.");
      return NextResponse.json(
        { message: "Institute ID is required and could not be resolved" },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        courseCode,
        instituteId: resolvedInstituteId,
        facultyId,
      },
    });

    console.log("[POST /api/courses] Course created successfully:", course);

    return NextResponse.json(course, {
      status: 201,
    });
  } catch (error: any) {
    console.error("[POST /api/courses] Exception caught:");
    console.error("Error Message:", error.message);
    console.error("Stack Trace:", error.stack);
    console.error("Full Error Object:", error);

    return NextResponse.json(
      { message: "Failed to create course", details: error.message },
      { status: 500 }
    );
  }
}