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

    const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: Only administrators can access admin reports" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    let instituteId = user.instituteId;

    if (user.role === "SUPER_ADMIN") {
      const queryInstituteId = searchParams.get("instituteId");
      if (queryInstituteId) {
        instituteId = queryInstituteId;
      }
    } else {
      if (!instituteId) {
        return NextResponse.json(
          { message: "Forbidden: User has no institute association" },
          { status: 403 }
        );
      }
    }

    // 1. Where filters configuration for multi-tenancy
    const studentWhere: any = { role: "STUDENT", deletedAt: null };
    const facultyWhere: any = { role: "FACULTY", deletedAt: null };
    const courseWhere: any = { deletedAt: null };
    const quizWhere: any = { deletedAt: null };
    const attemptWhere: any = { status: "SUBMITTED" };
    const assignmentWhere: any = { deletedAt: null };
    const submissionWhere: any = {};
    const pendingSubmissionWhere: any = { grade: null };
    const certWhere: any = { deletedAt: null };
    const activeCertWhere: any = { deletedAt: null, status: "ACTIVE" };
    const revokedCertWhere: any = { deletedAt: null, status: "REVOKED" };

    const enrollmentWhere: any = {
      batch: {
        deletedAt: null,
        course: {
          deletedAt: null,
        },
      },
    };

    if (instituteId) {
      studentWhere.instituteId = instituteId;
      facultyWhere.instituteId = instituteId;
      courseWhere.instituteId = instituteId;
      quizWhere.instituteId = instituteId;
      attemptWhere.quiz = { instituteId };
      assignmentWhere.course = { instituteId };
      submissionWhere.assignment = { course: { instituteId } };
      pendingSubmissionWhere.assignment = { course: { instituteId } };
      certWhere.instituteId = instituteId;
      activeCertWhere.instituteId = instituteId;
      revokedCertWhere.instituteId = instituteId;
      enrollmentWhere.batch.course.instituteId = instituteId;
    }

    // 2. Fetch parallel counts and aggregations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeStudentsWhere = {
      ...studentWhere,
      enrollments: {
        some: {
          batch: {
            deletedAt: null,
          },
        },
      },
    };

    const newStudentsWhere = {
      ...studentWhere,
      createdAt: { gte: thirtyDaysAgo },
    };

    const publishedCourseWhere = {
      ...courseWhere,
      videos: {
        some: {
          published: true,
          deletedAt: null,
        },
      },
    };

    const [
      totalStudents,
      activeStudents,
      newStudents,
      totalFaculty,
      totalCourses,
      publishedCourses,
      totalQuizzes,
      totalAttempts,
      quizAgg,
      totalAssignments,
      totalSubmissions,
      pendingReviews,
      totalCertificates,
      activeCertificates,
      revokedCertificates,
    ] = await Promise.all([
      prisma.user.count({ where: studentWhere }),
      prisma.user.count({ where: activeStudentsWhere }),
      prisma.user.count({ where: newStudentsWhere }),
      prisma.user.count({ where: facultyWhere }),
      prisma.course.count({ where: courseWhere }),
      prisma.course.count({ where: publishedCourseWhere }),
      prisma.quiz.count({ where: quizWhere }),
      prisma.quizAttempt.count({ where: attemptWhere }),
      prisma.quizAttempt.aggregate({
        where: attemptWhere,
        _avg: {
          percentage: true,
        },
      }),
      prisma.assignment.count({ where: assignmentWhere }),
      prisma.submission.count({ where: submissionWhere }),
      prisma.submission.count({ where: pendingSubmissionWhere }),
      prisma.certificate.count({ where: certWhere }),
      prisma.certificate.count({ where: activeCertWhere }),
      prisma.certificate.count({ where: revokedCertWhere }),
    ]);

    const draftCourses = Math.max(0, totalCourses - publishedCourses);
    const averageQuizScore = quizAgg._avg.percentage !== null ? Math.round(quizAgg._avg.percentage * 10) / 10 : 0;

    // 3. Fetch courses, enrollments, and progress for dynamic calculations
    const courses = await prisma.course.findMany({
      where: courseWhere,
      include: {
        videos: {
          where: { published: true, deletedAt: null },
          select: { id: true },
        },
      },
    });

    const enrollments = await prisma.enrollment.findMany({
      where: enrollmentWhere,
      include: {
        batch: {
          select: {
            courseId: true,
          },
        },
      },
    });

    const courseIds = courses.map((c) => c.id);

    const progressEntries = await prisma.progress.findMany({
      where: {
        completed: true,
        video: {
          courseId: { in: courseIds },
          published: true,
          deletedAt: null,
        },
      },
      select: {
        userId: true,
        videoId: true,
        video: {
          select: {
            courseId: true,
          },
        },
      },
    });

    let completedEnrollmentsCount = 0;
    let totalProgressSum = 0;
    const completedCourseIds = new Set<string>();
    const studentsWithActivity = new Set<string>();

    progressEntries.forEach((p) => {
      studentsWithActivity.add(p.userId);
    });

    enrollments.forEach((enrollment) => {
      const courseId = enrollment.batch.courseId;
      const course = courses.find((c) => c.id === courseId);
      if (!course) return;

      const totalVideos = course.videos.length;
      if (totalVideos === 0) return;

      const completedVideos = progressEntries.filter(
        (p) => p.userId === enrollment.studentId && p.video.courseId === courseId
      ).length;

      const percentage = (completedVideos / totalVideos) * 100;
      totalProgressSum += percentage;

      if (completedVideos === totalVideos) {
        completedEnrollmentsCount++;
        completedCourseIds.add(courseId);
      }
    });

    const totalEnrollmentsCount = enrollments.length;
    const courseCompletionRate =
      totalEnrollmentsCount > 0
        ? Math.round((completedEnrollmentsCount / totalEnrollmentsCount) * 10) / 10
        : 0;

    const averageStudentProgress =
      totalEnrollmentsCount > 0
        ? Math.round((totalProgressSum / totalEnrollmentsCount) * 10) / 10
        : 0;

    const studentEngagement =
      totalStudents > 0
        ? Math.round((studentsWithActivity.size / totalStudents) * 1000) / 10
        : 0;

    const completedCourses = completedCourseIds.size;

    // 4. Fetch Recent Activities in parallel
    const [recentEnrollments, recentQuizAttempts, recentSubmissions, recentCertificates] = await Promise.all([
      prisma.enrollment.findMany({
        where: enrollmentWhere,
        include: {
          student: { select: { name: true } },
          batch: { include: { course: { select: { title: true } } } },
        },
        orderBy: { enrolledAt: "desc" },
        take: 5,
      }),
      prisma.quizAttempt.findMany({
        where: attemptWhere,
        include: {
          student: { select: { name: true } },
          quiz: { select: { title: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 5,
      }),
      prisma.submission.findMany({
        where: submissionWhere,
        include: {
          student: { select: { name: true } },
          assignment: { select: { title: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 5,
      }),
      prisma.certificate.findMany({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          ...(instituteId ? { instituteId } : {}),
        },
        include: {
          student: { select: { name: true } },
          course: { select: { title: true } },
        },
        orderBy: { issueDate: "desc" },
        take: 5,
      }),
    ]);

    const formattedRecentActivity = {
      enrollments: recentEnrollments.map((e) => ({
        id: e.id,
        studentName: e.student.name,
        courseTitle: e.batch.course.title,
        date: e.enrolledAt,
      })),
      quizAttempts: recentQuizAttempts.map((qa) => ({
        id: qa.id,
        studentName: qa.student.name,
        quizTitle: qa.quiz.title,
        score: qa.score,
        percentage: qa.percentage,
        passed: qa.passed,
        date: qa.submittedAt,
      })),
      submissions: recentSubmissions.map((s) => ({
        id: s.id,
        studentName: s.student.name,
        assignmentTitle: s.assignment.title,
        grade: s.grade,
        date: s.submittedAt,
      })),
      certificates: recentCertificates.map((c) => ({
        id: c.id,
        studentName: c.student.name,
        courseTitle: c.course.title,
        certificateNumber: c.certificateNumber,
        date: c.issueDate,
      })),
    };

    return NextResponse.json({
      statistics: {
        students: {
          total: totalStudents,
          active: activeStudents,
          new: newStudents,
        },
        faculty: {
          total: totalFaculty,
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          draft: draftCourses,
          completed: completedCourses,
        },
        quizzes: {
          total: totalQuizzes,
          attempts: totalAttempts,
          averageScore: averageQuizScore,
        },
        assignments: {
          total: totalAssignments,
          submissions: totalSubmissions,
          pendingReviews,
        },
        certificates: {
          total: totalCertificates,
          active: activeCertificates,
          revoked: revokedCertificates,
        },
        platform: {
          completionRate: courseCompletionRate,
          studentEngagement,
          averageProgress: averageStudentProgress,
        },
      },
      recentActivity: formattedRecentActivity,
    }, { status: 200 });

  } catch (error) {
    console.error("GET ADMIN DASHBOARD ANALYTICS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to generate admin dashboard analytics" },
      { status: 500 }
    );
  }
}
