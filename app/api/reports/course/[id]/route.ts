import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const allowedRoles = ["ADMIN", "SUPER_ADMIN", "FACULTY"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: Access denied" },
        { status: 403 }
      );
    }

    // Fetch the course to verify ownership/institute matching
    const course = await prisma.course.findUnique({
      where: { id, deletedAt: null },
      include: {
        faculty: { select: { name: true, email: true } },
        videos: { where: { published: true, deletedAt: null }, select: { id: true } },
        quizzes: { where: { deletedAt: null }, select: { id: true, title: true } },
        assignments: { where: { deletedAt: null }, select: { id: true, title: true } },
      },
    });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    // Tenant Isolation Check
    if (user.role !== "SUPER_ADMIN" && user.instituteId !== course.instituteId) {
      return NextResponse.json(
        { message: "Forbidden: You are not authorized to view reports for this course" },
        { status: 403 }
      );
    }

    // Faculty teaching check
    if (user.role === "FACULTY" && course.facultyId !== user.id) {
      return NextResponse.json(
        { message: "Forbidden: You do not teach this course" },
        { status: 403 }
      );
    }

    // Fetch enrollments for this course
    const enrollments = await prisma.enrollment.findMany({
      where: {
        batch: {
          courseId: course.id,
          deletedAt: null,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const studentIds = enrollments.map((e) => e.studentId);

    // Fetch progresses, quiz attempts, submissions, and certificates for these students in this course
    const [progressEntries, quizAttempts, submissions, certificates] = await Promise.all([
      prisma.progress.findMany({
        where: {
          userId: { in: studentIds },
          video: { courseId: course.id, published: true, deletedAt: null },
        },
      }),
      prisma.quizAttempt.findMany({
        where: {
          studentId: { in: studentIds },
          status: "SUBMITTED",
          quiz: { courseId: course.id, deletedAt: null },
        },
      }),
      prisma.submission.findMany({
        where: {
          studentId: { in: studentIds },
          assignment: { courseId: course.id, deletedAt: null },
        },
      }),
      prisma.certificate.findMany({
        where: {
          studentId: { in: studentIds },
          courseId: course.id,
          deletedAt: null,
        },
      }),
    ]);

    const totalVideos = course.videos.length;
    let completedEnrollmentsCount = 0;
    let totalProgressSum = 0;

    const studentStatsList = enrollments.map((enrollment) => {
      const student = enrollment.student;

      // Progress Calculation
      const completedVideos = progressEntries.filter(
        (p) => p.userId === student.id && p.completed
      ).length;
      const progressPercent =
        totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
      totalProgressSum += progressPercent;

      if (totalVideos > 0 && completedVideos === totalVideos) {
        completedEnrollmentsCount++;
      }

      // Quiz Performance
      const studentQuizAttempts = quizAttempts.filter((qa) => qa.studentId === student.id);
      const quizAttemptsCount = studentQuizAttempts.length;
      const avgQuizScore =
        quizAttemptsCount > 0
          ? Math.round(
              (studentQuizAttempts.reduce((sum, qa) => sum + qa.percentage, 0) /
                quizAttemptsCount) *
                10
            ) / 10
          : 0;

      // Assignment Submissions
      const studentSubmissions = submissions.filter((s) => s.studentId === student.id);
      const assignmentsSubmitted = studentSubmissions.length;

      // Certificate Status
      const studentCert = certificates.find((c) => c.studentId === student.id);
      let certificateStatus = "None";
      if (studentCert) {
        certificateStatus = studentCert.status === "ACTIVE" ? "Earned" : "Revoked";
      }

      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        progress: progressPercent,
        quizzesAttempted: quizAttemptsCount,
        averageQuizScore: avgQuizScore,
        assignmentsSubmitted,
        certificateStatus,
      };
    });

    const studentCount = enrollments.length;
    const completionRate =
      studentCount > 0
        ? Math.round((completedEnrollmentsCount / studentCount) * 1000) / 10
        : 0;
    const averageProgress =
      studentCount > 0
        ? Math.round((totalProgressSum / studentCount) * 10) / 10
        : 0;

    // Course Overall Quiz Averages
    const totalQuizAttempts = quizAttempts.length;
    const quizAverage =
      totalQuizAttempts > 0
        ? Math.round(
            (quizAttempts.reduce((sum, qa) => sum + qa.percentage, 0) /
              totalQuizAttempts) *
              10
          ) / 10
        : 0;

    // Course Overall Assignment Grading
    const gradedSubmissions = submissions.filter((s) => s.grade !== null);
    const averageAssignmentGrade =
      gradedSubmissions.length > 0
        ? Math.round(
            (gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) /
              gradedSubmissions.length) *
              10
          ) / 10
        : 0;

    return NextResponse.json({
      course: {
        id: course.id,
        courseCode: course.courseCode,
        title: course.title,
        faculty: course.faculty
          ? { name: course.faculty.name, email: course.faculty.email }
          : null,
      },
      stats: {
        totalStudents: studentCount,
        completedStudents: completedEnrollmentsCount,
        completionRate,
        averageProgress,
        quizzesCount: course.quizzes.length,
        quizAttempts: totalQuizAttempts,
        quizAverage,
        assignmentsCount: course.assignments.length,
        assignmentSubmissions: submissions.length,
        assignmentsGraded: gradedSubmissions.length,
        averageAssignmentGrade,
        certificatesCount: certificates.length,
      },
      students: studentStatsList,
    }, { status: 200 });

  } catch (error) {
    console.error("GET ADMIN COURSE DETAIL REPORT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to generate admin course details report" },
      { status: 500 }
    );
  }
}
