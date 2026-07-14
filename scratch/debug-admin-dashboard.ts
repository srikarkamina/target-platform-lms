import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Debugging admin dashboard analytics queries...");
  
  const admin = await prisma.user.findFirst({
    where: { email: "admin@test.com", deletedAt: null },
  });
  
  if (!admin) {
    console.error("Admin user not found!");
    return;
  }
  
  const instituteId = admin.instituteId;
  console.log(`Using admin: ${admin.email}, instituteId: ${instituteId}`);
  
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

  try {
    console.log("Executing Promise.all count queries...");
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

    console.log("Count queries completed successfully!");
    console.log({
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
    });
  } catch (err) {
    console.error("Error in Promise.all count queries:", err);
    return;
  }

  let courses, enrollments, progressEntries;
  try {
    console.log("Fetching courses, enrollments, and progressEntries...");
    courses = await prisma.course.findMany({
      where: courseWhere,
      include: {
        videos: {
          where: { published: true, deletedAt: null },
          select: { id: true },
        },
      },
    });

    enrollments = await prisma.enrollment.findMany({
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

    progressEntries = await prisma.progress.findMany({
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
    console.log("Fetch completed!");
  } catch (err) {
    console.error("Error fetching courses/enrollments/progress:", err);
    return;
  }

  try {
    console.log("Executing recent activity queries...");
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
    console.log("Recent activity queries completed!");
  } catch (err) {
    console.error("Error executing recent activity queries:", err);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
