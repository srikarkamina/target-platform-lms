import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";

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
        { message: "Unauthorized: User not found in database" },
        { status: 401 }
      );
    }

    if (user.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Forbidden: Only students can access student reports" },
        { status: 403 }
      );
    }

    // 1. Get Enrollments (Courses student is actively enrolled in)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: user.id,
        batch: {
          deletedAt: null,
          course: {
            deletedAt: null,
          },
        },
      },
      select: {
        batch: {
          select: {
            courseId: true,
          },
        },
      },
    });

    const enrolledCourseIds = enrollments.map((e) => e.batch.courseId);

    // 2. Fetch Assignments in Enrolled Courses along with Student's Submissions
    const assignments = await prisma.assignment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        deletedAt: null,
      },
      include: {
        course: {
          select: {
            courseCode: true,
          },
        },
        submissions: {
          where: {
            studentId: user.id,
          },
          orderBy: {
            submittedAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 3. Map Assignments to Analytics
    const reports = assignments.map((assignment) => {
      const submission = assignment.submissions[0] || null;

      let submissionStatus: "Graded" | "Submitted" | "Pending" = "Pending";
      if (submission) {
        submissionStatus = submission.grade !== null ? "Graded" : "Submitted";
      }

      return {
        assignmentId: assignment.id,
        assignmentName: assignment.title,
        courseCode: assignment.course.courseCode,
        submissionStatus,
        grade: submission ? submission.grade : null,
        submissionDate: submission ? submission.submittedAt : null,
        feedback: submission ? submission.feedback : null,
      };
    });

    return NextResponse.json(reports, { status: 200 });

  } catch (error) {
    console.error("GET STUDENT ASSIGNMENT ANALYTICS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch student assignment analytics" },
      { status: 500 }
    );
  }
}
