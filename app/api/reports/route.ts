import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json(
        { message: "Unauthorized: Missing or invalid token" },
        { status: 401 }
      );
    }

    // 2. Resolve database user profile & authorize
    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized: User not found" },
        { status: 401 }
      );
    }

    const allowedRoles = ["ADMIN", "SUPER_ADMIN", "FACULTY"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { message: "Forbidden: Unauthorized access" },
        { status: 403 }
      );
    }

    // 3. Multi-tenant isolation filter setup
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
          { message: "Forbidden: No institute associated with user" },
          { status: 403 }
        );
      }
    }

    // Build common filter queries
    const instituteFilter = instituteId ? { instituteId } : {};

    // Faculty filter scoping
    const isFaculty = user.role === "FACULTY";
    const facultyCourseFilter = isFaculty ? { facultyId: user.id } : {};

    // ----------------------------------------------------
    // PHASE 1: Dashboard Statistics
    // ----------------------------------------------------
    const [
      totalStudents,
      totalFaculty,
      totalCourses,
      totalEnrollments,
      totalCertificates,
      activeCertificates,
      revokedCertificates,
      totalQuizAttempts,
      avgQuizAgg,
      totalAssignments,
      pendingAssignments,
      completedAssignments,
    ] = await Promise.all([
      // Total Students
      prisma.user.count({
        where: {
          role: "STUDENT",
          deletedAt: null,
          ...instituteFilter,
          ...(isFaculty ? {
            enrollments: {
              some: {
                batch: {
                  course: { facultyId: user.id },
                  deletedAt: null
                }
              }
            }
          } : {})
        },
      }),
      // Total Faculty
      prisma.user.count({
        where: {
          role: "FACULTY",
          deletedAt: null,
          ...instituteFilter,
          ...(isFaculty ? { id: user.id } : {})
        },
      }),
      // Total Courses
      prisma.course.count({
        where: {
          deletedAt: null,
          ...instituteFilter,
          ...facultyCourseFilter,
        },
      }),
      // Total Enrollments
      prisma.enrollment.count({
        where: {
          batch: {
            course: {
              deletedAt: null,
              ...instituteFilter,
              ...facultyCourseFilter,
            },
            deletedAt: null,
          },
        },
      }),
      // Total Certificates
      prisma.certificate.count({
        where: {
          deletedAt: null,
          ...instituteFilter,
          ...(isFaculty ? {
            course: { facultyId: user.id, deletedAt: null }
          } : {})
        },
      }),
      // Active Certificates
      prisma.certificate.count({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          ...instituteFilter,
          ...(isFaculty ? {
            course: { facultyId: user.id, deletedAt: null }
          } : {})
        },
      }),
      // Revoked Certificates
      prisma.certificate.count({
        where: {
          deletedAt: null,
          status: "REVOKED",
          ...instituteFilter,
          ...(isFaculty ? {
            course: { facultyId: user.id, deletedAt: null }
          } : {})
        },
      }),
      // Total Quiz Attempts
      prisma.quizAttempt.count({
        where: {
          status: "SUBMITTED",
          quiz: {
            deletedAt: null,
            ...instituteFilter,
            ...(isFaculty ? {
              course: { facultyId: user.id, deletedAt: null }
            } : {})
          },
        },
      }),
      // Average Quiz Score
      prisma.quizAttempt.aggregate({
        where: {
          status: "SUBMITTED",
          quiz: {
            deletedAt: null,
            ...instituteFilter,
            ...(isFaculty ? {
              course: { facultyId: user.id, deletedAt: null }
            } : {})
          },
        },
        _avg: {
          percentage: true,
        },
      }),
      // Total Assignments
      prisma.assignment.count({
        where: {
          deletedAt: null,
          ...instituteFilter,
          ...(isFaculty ? { course: { facultyId: user.id } } : {}),
        },
      }),
      // Pending Assignments (submitted but grade is null)
      prisma.submission.count({
        where: {
          assignment: {
            deletedAt: null,
            ...instituteFilter,
            ...(isFaculty ? { course: { facultyId: user.id } } : {}),
          },
          grade: null,
        },
      }),
      // Completed Assignments (submitted and grade is not null)
      prisma.submission.count({
        where: {
          assignment: {
            deletedAt: null,
            ...instituteFilter,
            ...(isFaculty ? { course: { facultyId: user.id } } : {}),
          },
          grade: { not: null },
        },
      }),
    ]);

    const averageQuizScore =
      avgQuizAgg._avg.percentage !== null
        ? Math.round(avgQuizAgg._avg.percentage * 10) / 10
        : 0;

    // ----------------------------------------------------
    // PHASE 2: Monthly Analytics (Growth)
    // ----------------------------------------------------
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [
      studentGrowthData,
      certificateGrowthData,
      quizGrowthData,
    ] = await Promise.all([
      // Student registrations in the last 6 months
      prisma.user.findMany({
        where: {
          role: "STUDENT",
          deletedAt: null,
          createdAt: { gte: sixMonthsAgo },
          ...instituteFilter,
          ...(isFaculty ? {
            enrollments: {
              some: {
                batch: {
                  course: { facultyId: user.id },
                  deletedAt: null
                }
              }
            }
          } : {})
        },
        select: { createdAt: true },
      }),
      // Certificates issued in the last 6 months
      prisma.certificate.findMany({
        where: {
          deletedAt: null,
          issueDate: { gte: sixMonthsAgo },
          ...instituteFilter,
          ...(isFaculty ? {
            course: { facultyId: user.id, deletedAt: null }
          } : {})
        },
        select: { issueDate: true },
      }),
      // Quiz attempts in the last 6 months
      prisma.quizAttempt.findMany({
        where: {
          status: "SUBMITTED",
          submittedAt: { gte: sixMonthsAgo, not: null },
          quiz: {
            deletedAt: null,
            ...instituteFilter,
            ...(isFaculty ? {
              course: { facultyId: user.id, deletedAt: null }
            } : {})
          },
        },
        select: { submittedAt: true },
      }),
    ]);

    const monthsList: string[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthsList.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
    }

    const studentGrowth = monthsList.map((m) => ({ month: m, count: 0 }));
    const certificateGrowth = monthsList.map((m) => ({ month: m, count: 0 }));
    const quizGrowth = monthsList.map((m) => ({ month: m, count: 0 }));

    studentGrowthData.forEach((s) => {
      const date = new Date(s.createdAt);
      const mLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      const idx = monthsList.indexOf(mLabel);
      if (idx !== -1) {
        studentGrowth[idx].count++;
      }
    });

    certificateGrowthData.forEach((c) => {
      const date = new Date(c.issueDate);
      const mLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      const idx = monthsList.indexOf(mLabel);
      if (idx !== -1) {
        certificateGrowth[idx].count++;
      }
    });

    quizGrowthData.forEach((q) => {
      if (q.submittedAt) {
        const date = new Date(q.submittedAt);
        const mLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        const idx = monthsList.indexOf(mLabel);
        if (idx !== -1) {
          quizGrowth[idx].count++;
        }
      }
    });

    // ----------------------------------------------------
    // PHASE 3: Course Analytics
    // ----------------------------------------------------
    const courses = await prisma.course.findMany({
      where: {
        deletedAt: null,
        ...instituteFilter,
        ...facultyCourseFilter,
      },
      include: {
        videos: {
          where: { published: true, deletedAt: null },
          select: { id: true },
        },
      },
    });

    const courseIds = courses.map((c) => c.id);

    // Fetch batch enrollments, active certificates, quiz attempts, progress entries, and submissions for all courses (to avoid N+1)
    const [
      enrollments,
      certificates,
      quizAttempts,
      progressEntries,
    ] = await Promise.all([
      // Enrollments
      prisma.enrollment.findMany({
        where: {
          batch: {
            courseId: { in: courseIds },
            deletedAt: null,
          },
        },
        select: {
          studentId: true,
          batch: {
            select: { courseId: true },
          },
        },
      }),
      // Active Certificates
      prisma.certificate.findMany({
        where: {
          courseId: { in: courseIds },
          deletedAt: null,
          status: "ACTIVE",
        },
        select: {
          courseId: true,
          studentId: true,
          status: true,
        },
      }),
      // Quiz Attempts
      prisma.quizAttempt.findMany({
        where: {
          status: "SUBMITTED",
          quiz: {
            courseId: { in: courseIds },
            deletedAt: null,
          },
        },
        select: {
          studentId: true,
          percentage: true,
          quiz: {
            select: { courseId: true },
          },
        },
      }),
      // Video Progresses
      prisma.progress.findMany({
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
          video: {
            select: { courseId: true },
          },
        },
      }),
    ]);

    const courseAnalytics = courses.map((course) => {
      const courseEnrolled = enrollments.filter((e) => e.batch.courseId === course.id);
      const enrolledCount = courseEnrolled.length;

      const issuedCount = certificates.filter((c) => c.courseId === course.id).length;

      const attempts = quizAttempts.filter((qa) => qa.quiz.courseId === course.id);
      const avgScore =
        attempts.length > 0
          ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length
          : 0;

      const totalVideos = course.videos.length;
      let completedCount = 0;

      if (totalVideos > 0 && enrolledCount > 0) {
        courseEnrolled.forEach((e) => {
          const completedVideos = progressEntries.filter(
            (p) => p.userId === e.studentId && p.video.courseId === course.id
          ).length;
          if (completedVideos >= totalVideos) {
            completedCount++;
          }
        });
      }

      const completionPercentage =
        enrolledCount > 0 ? (completedCount / enrolledCount) * 100 : 0;

      return {
        id: course.id,
        courseCode: course.courseCode,
        courseName: course.title,
        studentsEnrolled: enrolledCount,
        certificatesIssued: issuedCount,
        averageQuizScore: Math.round(avgScore * 10) / 10,
        completionPercentage: Math.round(completionPercentage * 10) / 10,
      };
    });

    // ----------------------------------------------------
    // PHASE 4: Certificate Analytics
    // ----------------------------------------------------
    const certsPerCourseRaw = await prisma.certificate.groupBy({
      by: ["courseId"],
      where: {
        deletedAt: null,
        status: "ACTIVE",
        ...instituteFilter,
        ...(isFaculty ? {
          course: { facultyId: user.id, deletedAt: null }
        } : {})
      },
      _count: {
        id: true,
      },
    });

    const certificatesPerCourse = courses.map((c) => {
      const match = certsPerCourseRaw.find((item) => item.courseId === c.id);
      return {
        courseId: c.id,
        courseName: c.title,
        count: match ? match._count.id : 0,
      };
    });

    const certificateAnalytics = {
      certificatesIssued: totalCertificates,
      certificatesRevoked: revokedCertificates,
      activeCertificates: activeCertificates,
      certificatesPerCourse,
    };

    // ----------------------------------------------------
    // PHASE 4.5: Recent Activity Report
    // ----------------------------------------------------
    const [recentEnrollments, recentQuizAttempts, recentSubmissions, recentCertificates] = await Promise.all([
      prisma.enrollment.findMany({
        where: {
          batch: {
            deletedAt: null,
            course: {
              deletedAt: null,
              ...instituteFilter,
              ...facultyCourseFilter,
            },
          },
        },
        include: {
          student: { select: { name: true } },
          batch: { include: { course: { select: { title: true } } } },
        },
        orderBy: { enrolledAt: "desc" },
        take: 5,
      }),
      prisma.quizAttempt.findMany({
        where: {
          status: "SUBMITTED",
          quiz: {
            deletedAt: null,
            ...instituteFilter,
            ...(isFaculty ? {
              course: { facultyId: user.id, deletedAt: null }
            } : {})
          },
        },
        include: {
          student: { select: { name: true } },
          quiz: { select: { title: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 5,
      }),
      prisma.submission.findMany({
        where: {
          assignment: {
            deletedAt: null,
            ...instituteFilter,
            ...(isFaculty ? {
              course: { facultyId: user.id, deletedAt: null }
            } : {})
          },
        },
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
          ...instituteFilter,
          ...(isFaculty ? {
            course: { facultyId: user.id, deletedAt: null }
          } : {})
        },
        include: {
          student: { select: { name: true } },
          course: { select: { title: true } },
        },
        orderBy: { issueDate: "desc" },
        take: 5,
      }),
    ]);

    const recentActivity = {
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

    // ----------------------------------------------------
    // PHASE 5: Student Performance Report
    // ----------------------------------------------------
    // Fetch students enrolled in the institute's courses with details
    const studentPerformanceEnrollments = await prisma.enrollment.findMany({
      where: {
        batch: {
          course: {
            deletedAt: null,
            ...instituteFilter,
            ...facultyCourseFilter,
          },
          deletedAt: null,
        },
      },
      include: {
        student: {
          select: {
            name: true,
            email: true,
          },
        },
        batch: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                videos: {
                  where: { published: true, deletedAt: null },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    const studentPerformance = studentPerformanceEnrollments.map((e) => {
      const studentId = e.studentId;
      const courseId = e.batch.course.id;
      const courseTitle = e.batch.course.title;
      const totalVideos = e.batch.course.videos.length;

      // Progress
      const completedVideos = progressEntries.filter(
        (p) => p.userId === studentId && p.video.courseId === courseId
      ).length;
      const progressPercentage =
        totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

      // Quiz Average
      const studentQuizAttempts = quizAttempts.filter(
        (qa) => qa.studentId === studentId && qa.quiz.courseId === courseId
      );
      const quizAverage =
        studentQuizAttempts.length > 0
          ? studentQuizAttempts.reduce((sum, a) => sum + a.percentage, 0) /
            studentQuizAttempts.length
          : 0;

      // Certificates Earned in this course
      const certsEarned = certificates.filter(
        (c) => c.studentId === studentId && c.courseId === courseId
      ).length;

      return {
        studentName: e.student.name,
        email: e.student.email,
        course: courseTitle,
        quizAverage: Math.round(quizAverage * 10) / 10,
        certificatesEarned: certsEarned,
        progressPercentage: Math.round(progressPercentage * 10) / 10,
      };
    });

    // Sort by highest progress descending
    studentPerformance.sort((a, b) => b.progressPercentage - a.progressPercentage);

    // 4. Return complete data payload
    return NextResponse.json({
      statistics: {
        totalStudents,
        totalFaculty,
        totalCourses,
        totalEnrollments,
        totalCertificates,
        activeCertificates,
        revokedCertificates,
        totalQuizAttempts,
        averageQuizScore,
        assignedCourses: totalCourses,
        assignments: totalAssignments,
        pendingAssignments,
        completedAssignments,
        certificatesIssued: activeCertificates,
      },
      studentGrowth,
      certificateGrowth,
      quizGrowth,
      courseAnalytics,
      certificateAnalytics,
      studentPerformance,
      recentActivity,
    });
  } catch (error) {
    console.error("GET REPORTS MAIN ROUTE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to generate comprehensive reports and analytics" },
      { status: 500 }
    );
  }
}
