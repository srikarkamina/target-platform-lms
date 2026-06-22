import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json(
        { message: "Unauthorized: Missing or invalid token" },
        { status: 401 }
      );
    }

    const { role, id } = payload;
    const isManagement = role === "ADMIN" || role === "SUPER_ADMIN" || role === "FACULTY";

    if (isManagement) {
      // 1. Management Analytics (Faculty / Admin view)
      const [totalStudents, totalCourses, quizAttemptsCount, submissionCount] = await Promise.all([
        prisma.user.count({ where: { role: "STUDENT", deletedAt: null } }),
        prisma.course.count({ where: { deletedAt: null } }),
        prisma.quizAttempt.count({ where: { status: "SUBMITTED" } }),
        prisma.submission.count(),
      ]);

      const [quizAggregates, submissionAggregates] = await Promise.all([
        prisma.quizAttempt.aggregate({
          where: { status: "SUBMITTED" },
          _avg: { percentage: true, score: true },
        }),
        prisma.submission.aggregate({
          _avg: { grade: true },
        }),
      ]);

      const passedQuizAttemptsCount = await prisma.quizAttempt.count({
        where: { status: "SUBMITTED", passed: true },
      });

      const gradedSubmissionsCount = await prisma.submission.count({
        where: { grade: { not: null } },
      });

      // Quiz Performance breakdown
      const quizzes = await prisma.quiz.findMany({
        where: { deletedAt: null },
        include: {
          course: { select: { courseCode: true, title: true } },
          attempts: {
            where: { status: "SUBMITTED" },
            select: { score: true, percentage: true, passed: true },
          },
        },
      });

      const quizStats = quizzes.map((q) => {
        const attempts = q.attempts;
        const count = attempts.length;
        const avgPercentage = count > 0 
          ? attempts.reduce((sum, a) => sum + a.percentage, 0) / count 
          : 0;
        const passRate = count > 0 
          ? (attempts.filter((a) => a.passed).length / count) * 100 
          : 0;

        return {
          id: q.id,
          title: q.title,
          courseCode: q.course.courseCode,
          courseTitle: q.course.title,
          attemptsCount: count,
          averagePercentage: Math.round(avgPercentage * 10) / 10,
          passRate: Math.round(passRate * 10) / 10,
        };
      });

      // Assignment Submission breakdown
      const assignments = await prisma.assignment.findMany({
        where: { deletedAt: null },
        include: {
          course: { select: { courseCode: true, title: true } },
          submissions: { select: { grade: true } },
        },
      });

      const assignmentStats = assignments.map((a) => {
        const submissions = a.submissions;
        const count = submissions.length;
        const gradedSubmissions = submissions.filter((s) => s.grade !== null);
        const gradedCount = gradedSubmissions.length;
        const averageGrade = gradedCount > 0 
          ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedCount 
          : 0;

        return {
          id: a.id,
          title: a.title,
          courseCode: a.course.courseCode,
          courseTitle: a.course.title,
          submissionsCount: count,
          gradedCount,
          averageGrade: Math.round(averageGrade * 10) / 10,
        };
      });

      return NextResponse.json({
        role,
        summary: {
          totalStudents,
          totalCourses,
          quizAttemptsCount,
          submissionCount,
          averageQuizPercentage: Math.round((quizAggregates._avg.percentage || 0) * 10) / 10,
          quizPassRate: quizAttemptsCount > 0 ? Math.round((passedQuizAttemptsCount / quizAttemptsCount) * 1000) / 10 : 0,
          averageAssignmentGrade: Math.round((submissionAggregates._avg.grade || 0) * 10) / 10,
          gradedSubmissionsRate: submissionCount > 0 ? Math.round((gradedSubmissionsCount / submissionCount) * 1000) / 10 : 0,
        },
        quizzes: quizStats,
        assignments: assignmentStats,
      });

    } else {
      // 2. Student Analytics (Personal performance view)
      const enrolledCoursesCount = await prisma.enrollment.count({
        where: { studentId: id },
      });

      const attempts = await prisma.quizAttempt.findMany({
        where: { studentId: id, status: "SUBMITTED" },
        include: {
          quiz: {
            include: {
              course: { select: { courseCode: true, title: true } },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      });

      const submissions = await prisma.submission.findMany({
        where: { studentId: id },
        include: {
          assignment: {
            include: {
              course: { select: { courseCode: true, title: true } },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      });

      // Calculate aggregates
      const quizAttemptsCount = attempts.length;
      const passedQuizAttemptsCount = attempts.filter((a) => a.passed).length;
      const averageQuizPercentage = quizAttemptsCount > 0
        ? attempts.reduce((sum, a) => sum + a.percentage, 0) / quizAttemptsCount
        : 0;

      const submissionsCount = submissions.length;
      const gradedSubmissions = submissions.filter((s) => s.grade !== null);
      const gradedCount = gradedSubmissions.length;
      const averageAssignmentGrade = gradedCount > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedCount
        : 0;

      return NextResponse.json({
        role,
        summary: {
          enrolledCoursesCount,
          quizAttemptsCount,
          passedQuizAttemptsCount,
          quizPassRate: quizAttemptsCount > 0 ? Math.round((passedQuizAttemptsCount / quizAttemptsCount) * 1000) / 10 : 0,
          averageQuizPercentage: Math.round(averageQuizPercentage * 10) / 10,
          submissionsCount,
          gradedSubmissionsCount: gradedCount,
          averageAssignmentGrade: Math.round(averageAssignmentGrade * 10) / 10,
        },
        attempts: attempts.map((a) => ({
          id: a.id,
          quizTitle: a.quiz.title,
          courseCode: a.quiz.course.courseCode,
          score: a.score,
          percentage: a.percentage,
          passed: a.passed,
          submittedAt: a.submittedAt,
        })),
        submissions: submissions.map((s) => ({
          id: s.id,
          assignmentTitle: s.assignment.title,
          courseCode: s.assignment.course.courseCode,
          grade: s.grade,
          feedback: s.feedback,
          submittedAt: s.submittedAt,
        })),
      });
    }

  } catch (error) {
    console.error("GET REPORTS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to generate reports" },
      { status: 500 }
    );
  }
}
