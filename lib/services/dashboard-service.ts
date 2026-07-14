import { prisma } from "@/lib/prisma";

export interface AdminDashboardData {
  statistics: {
    totalStudents: number;
    totalFaculty: number;
    totalCourses: number;
    activeCourses: number;
    certificatesIssued: number;
    assignmentSubmissions: number;
    quizAttempts: number;
    activeUsers: number;
  };
  charts: {
    studentGrowth: Array<{ month: string; count: number }>;
    courseGrowth: Array<{ month: string; count: number }>;
    certificateTrend: Array<{ month: string; count: number }>;
    quizCompletionTrend: Array<{ month: string; count: number }>;
  };
  timeline: Array<{
    day: string;
    dateStr: string;
    count: number;
  }>;
  activityFeed: Array<{
    id: string;
    user: string;
    userRole: string;
    action: string;
    module: string;
    description: string;
    timestamp: Date;
  }>;
  announcementReach: {
    totalAnnouncements: number;
    activeAnnouncements: number;
    pinnedAnnouncements: number;
  };
  pollParticipation: {
    totalPolls: number;
    activePolls: number;
    totalVotesCount: number;
    averageVotesPerPoll: number;
  };
  feedbackStatistics: {
    totalFeedbacks: number;
    averageRating: number;
    countsByType: Record<string, number>;
  };
  openDoubts: Array<{
    id: string;
    subject: string;
    status: string;
    priority: string;
    studentName: string;
    courseTitle: string;
    createdAt: Date;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    venue: string | null;
    speaker: string | null;
  }>;
}

export interface FacultyDashboardData {
  pendingGrading: Array<{
    id: string;
    submittedAt: Date;
    student: { name: string; email: string };
    assignment: { id: string; title: string; course: { title: string } };
  }>;
  upcomingAssignments: Array<{
    id: string;
    title: string;
    dueDate: Date | null;
    course: { title: string };
  }>;
  recentSubmissions: Array<{
    id: string;
    submittedAt: Date;
    grade: number | null;
    student: { name: string; email: string };
    assignment: { id: string; title: string; course: { title: string } };
  }>;
  courseAnalytics: Array<{
    id: string;
    title: string;
    courseCode: string;
    studentCount: number;
    assignmentProgress: number;
    quizProgress: number;
    averageMarks: number;
  }>;
  studentPerformance: {
    topPerformers: Array<{
      id: string;
      name: string;
      email: string;
      avgQuizScore: number;
      submissionRate: number;
      performanceScore: number;
    }>;
    needingAttention: Array<{
      id: string;
      name: string;
      email: string;
      avgQuizScore: number;
      submissionRate: number;
      performanceScore: number;
    }>;
  };
  pendingDoubts: Array<{
    id: string;
    subject: string;
    status: string;
    priority: string;
    studentName: string;
    courseTitle: string;
    createdAt: Date;
  }>;
  recentDiscussions: Array<{
    id: string;
    title: string;
    courseId: string;
    courseTitle: string;
    creatorName: string;
    createdAt: Date;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    category: string;
    priority: string;
    publishDate: Date;
    active: boolean;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    venue: string | null;
    speaker: string | null;
  }>;
  feedbackPending: Array<{
    id: string;
    type: string;
    rating: number | null;
    comments: string;
    courseTitle: string | null;
    createdAt: Date;
  }>;
}

export interface StudentDashboardData {
  learningStreak: number;
  overallProgress: number;
  continueLearning: {
    id: string;
    title: string;
    courseId: string;
    courseTitle: string;
    isCompleted?: boolean;
  } | null;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: Date | null;
    course: { title: string };
  }>;
  recentCertificates: Array<{
    id: string;
    certificateNumber: string;
    issueDate: Date;
    course: { title: string };
  }>;
  unreadNotifications: Array<{
    id: string;
    title: string;
    message: string;
    createdAt: Date;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    module: string;
    description: string | null;
    createdAt: Date;
  }>;
  unreadAnnouncements: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    publishDate: Date;
    creatorName: string;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    startDate: Date;
    endDate: Date;
    venue: string | null;
    speaker: string | null;
    isRegistered: boolean;
  }>;
  activePolls: Array<{
    id: string;
    question: string;
    expiryDate: Date;
    hasVoted: boolean;
  }>;
  recentDiscussions: Array<{
    id: string;
    title: string;
    courseId: string;
    courseTitle: string;
    creatorName: string;
    createdAt: Date;
  }>;
  openDoubts: Array<{
    id: string;
    subject: string;
    status: string;
    priority: string;
    courseTitle: string;
    createdAt: Date;
  }>;
}

export class DashboardService {
  /**
   * Aggregates dashboard analytics for an administrator.
   */
  static async getAdminDashboardData(instituteId: string): Promise<AdminDashboardData> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Parallel fetch of all statistics
    const [
      totalStudents,
      totalFaculty,
      totalCourses,
      activeCourses,
      certificatesIssued,
      assignmentSubmissions,
      quizAttempts,
      activeUsersLogs,
      // Growths
      studentsRaw,
      coursesRaw,
      certificatesRaw,
      quizAttemptsRaw,
      // Timeline logs
      timelineLogs,
      // Activity Feed logs
      feedLogs,
    ] = await Promise.all([
      // Total Students
      prisma.user.count({
        where: { role: "STUDENT", instituteId, deletedAt: null },
      }),
      // Total Faculty
      prisma.user.count({
        where: { role: "FACULTY", instituteId, deletedAt: null },
      }),
      // Total Courses
      prisma.course.count({
        where: { instituteId, deletedAt: null },
      }),
      // Active Courses (courses with at least one active batch)
      prisma.course.count({
        where: {
          instituteId,
          deletedAt: null,
          batches: { some: { deletedAt: null } },
        },
      }),
      // Certificates Issued
      prisma.certificate.count({
        where: { instituteId, deletedAt: null, status: "ACTIVE" },
      }),
      // Assignment Submissions
      prisma.submission.count({
        where: {
          assignment: {
            course: { instituteId, deletedAt: null },
            deletedAt: null,
          },
        },
      }),
      // Quiz Attempts
      prisma.quizAttempt.count({
        where: {
          quiz: { instituteId, deletedAt: null },
        },
      }),
      // Active users logs (unique users in last 30 days)
      prisma.auditLog.groupBy({
        by: ["userId"],
        where: {
          instituteId,
          createdAt: { gte: thirtyDaysAgo },
          userId: { not: null },
        },
      }),
      // Growth data
      prisma.user.findMany({
        where: { role: "STUDENT", instituteId, deletedAt: null, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.course.findMany({
        where: { instituteId, deletedAt: null, createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.certificate.findMany({
        where: { instituteId, deletedAt: null, status: "ACTIVE", issueDate: { gte: sixMonthsAgo } },
        select: { issueDate: true },
      }),
      prisma.quizAttempt.findMany({
        where: {
          status: "SUBMITTED",
          submittedAt: { gte: sixMonthsAgo, not: null },
          quiz: { instituteId, deletedAt: null },
        },
        select: { submittedAt: true },
      }),
      // Daily logs for timeline
      prisma.auditLog.findMany({
        where: { instituteId, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
      // Latest events
      prisma.auditLog.findMany({
        where: { instituteId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: {
            select: { name: true, email: true, role: true },
          },
        },
      }),
    ]);

    // Calculate active user metric
    let activeUsers = activeUsersLogs.length;
    if (activeUsers === 0) {
      // Fallback
      activeUsers = await prisma.user.count({
        where: { instituteId, deletedAt: null },
      });
    }

    // 2. Format growth charts
    const monthsList: string[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthsList.push(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
    }

    const studentGrowth = monthsList.map((m) => ({ month: m, count: 0 }));
    const courseGrowth = monthsList.map((m) => ({ month: m, count: 0 }));
    const certificateTrend = monthsList.map((m) => ({ month: m, count: 0 }));
    const quizCompletionTrend = monthsList.map((m) => ({ month: m, count: 0 }));

    studentsRaw.forEach((s) => {
      const date = new Date(s.createdAt);
      const mLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      const idx = monthsList.indexOf(mLabel);
      if (idx !== -1) studentGrowth[idx].count++;
    });

    coursesRaw.forEach((c) => {
      const date = new Date(c.createdAt);
      const mLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      const idx = monthsList.indexOf(mLabel);
      if (idx !== -1) courseGrowth[idx].count++;
    });

    certificatesRaw.forEach((c) => {
      const date = new Date(c.issueDate);
      const mLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      const idx = monthsList.indexOf(mLabel);
      if (idx !== -1) certificateTrend[idx].count++;
    });

    quizAttemptsRaw.forEach((q) => {
      if (q.submittedAt) {
        const date = new Date(q.submittedAt);
        const mLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        const idx = monthsList.indexOf(mLabel);
        if (idx !== -1) quizCompletionTrend[idx].count++;
      }
    });

    // 3. Format weekly timeline
    const daysList: Array<{ day: string; dateStr: string; count: number; fullDate: string }> = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      daysList.push({
        day: dayNames[d.getDay()],
        dateStr: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: 0,
        fullDate: d.toDateString(),
      });
    }

    timelineLogs.forEach((log) => {
      const logDayStr = new Date(log.createdAt).toDateString();
      const match = daysList.find((d) => d.fullDate === logDayStr);
      if (match) {
        match.count++;
      }
    });

    const timeline = daysList.map(({ day, dateStr, count }) => ({ day, dateStr, count }));

    // 4. Format activity feed
    const activityFeed = feedLogs.map((log) => ({
      id: log.id,
      user: log.user?.name || "System",
      userRole: log.user?.role || "SYSTEM",
      action: log.action,
      module: log.module,
      description: log.description || `${log.action} in ${log.module}`,
      timestamp: log.createdAt,
    }));

    // Fetch Communication & Engagement metrics for Admin
    const now = new Date();
    const [
      totalAnnouncements,
      activeAnnouncements,
      pinnedAnnouncements,
      totalPolls,
      activePolls,
      totalVotesCount,
      totalFeedbacks,
      feedbackAvg,
      feedbackTypeAgg,
      openDoubtsList,
      upcomingEventsList
    ] = await Promise.all([
      prisma.announcement.count({ where: { instituteId, deletedAt: null } }),
      prisma.announcement.count({
        where: {
          instituteId,
          deletedAt: null,
          active: true,
          publishDate: { lte: now },
          OR: [{ expiryDate: null }, { expiryDate: { gt: now } }]
        }
      }),
      prisma.announcement.count({ where: { instituteId, deletedAt: null, pinned: true } }),
      prisma.poll.count({ where: { instituteId, deletedAt: null } }),
      prisma.poll.count({ where: { instituteId, deletedAt: null, expiryDate: { gt: now } } }),
      prisma.pollVote.count({ where: { instituteId, deletedAt: null } }),
      prisma.feedback.count({ where: { instituteId, deletedAt: null } }),
      prisma.feedback.aggregate({
        where: { instituteId, deletedAt: null, rating: { not: null } },
        _avg: { rating: true }
      }),
      prisma.feedback.groupBy({
        by: ["type"],
        where: { instituteId, deletedAt: null },
        _count: { id: true }
      }),
      prisma.doubt.findMany({
        where: { instituteId, deletedAt: null, status: { in: ["OPEN", "IN_PROGRESS"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          creator: { select: { name: true } },
          course: { select: { title: true } }
        }
      }),
      prisma.event.findMany({
        where: { instituteId, deletedAt: null, endDate: { gte: now } },
        orderBy: { startDate: "asc" },
        take: 5
      })
    ]);

    const countsByType: Record<string, number> = {};
    feedbackTypeAgg.forEach(agg => {
      countsByType[agg.type] = agg._count.id;
    });

    const averageVotesPerPoll = totalPolls > 0 ? parseFloat((totalVotesCount / totalPolls).toFixed(1)) : 0;
    const averageRating = feedbackAvg._avg.rating ? parseFloat(feedbackAvg._avg.rating.toFixed(2)) : 0;

    return {
      statistics: {
        totalStudents,
        totalFaculty,
        totalCourses,
        activeCourses,
        certificatesIssued,
        assignmentSubmissions,
        quizAttempts,
        activeUsers,
      },
      charts: {
        studentGrowth,
        courseGrowth,
        certificateTrend,
        quizCompletionTrend,
      },
      timeline,
      activityFeed,
      announcementReach: {
        totalAnnouncements,
        activeAnnouncements,
        pinnedAnnouncements
      },
      pollParticipation: {
        totalPolls,
        activePolls,
        totalVotesCount,
        averageVotesPerPoll
      },
      feedbackStatistics: {
        totalFeedbacks,
        averageRating,
        countsByType
      },
      openDoubts: openDoubtsList.map(d => ({
        id: d.id,
        subject: d.subject,
        status: d.status,
        priority: d.priority,
        studentName: d.creator.name,
        courseTitle: d.course.title,
        createdAt: d.createdAt
      })),
      upcomingEvents: upcomingEventsList.map(e => ({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        venue: e.venue,
        speaker: e.speaker
      }))
    };
  }

  /**
   * Aggregates dashboard analytics for faculty.
   */
  static async getFacultyDashboardData(
    facultyId: string,
    instituteId: string
  ): Promise<FacultyDashboardData> {
    // 1. Fetch courses taught by this faculty
    const courses = await prisma.course.findMany({
      where: { facultyId, instituteId, deletedAt: null },
      include: {
        assignments: {
          where: { deletedAt: null },
          select: { id: true },
        },
        quizzes: {
          where: { deletedAt: null, isPublished: true },
          select: { id: true },
        },
      },
    });

    const courseIds = courses.map((c) => c.id);

    // 2. Fetch pending grading, upcoming deadlines, and recent submissions in parallel
    const [
      pendingGrading,
      upcomingAssignments,
      recentSubmissions,
      enrollments,
      submissions,
      quizAttempts,
    ] = await Promise.all([
      // Pending grading (submissions with grade === null)
      prisma.submission.findMany({
        where: {
          grade: null,
          assignment: {
            courseId: { in: courseIds },
            deletedAt: null,
          },
        },
        include: {
          student: { select: { name: true, email: true } },
          assignment: {
            select: { id: true, title: true, course: { select: { title: true } } },
          },
        },
        orderBy: { submittedAt: "desc" },
      }),
      // Upcoming assignments
      prisma.assignment.findMany({
        where: {
          dueDate: { gte: new Date() },
          courseId: { in: courseIds },
          deletedAt: null,
        },
        include: {
          course: { select: { title: true } },
        },
        orderBy: { dueDate: "asc" },
      }),
      // Recent submissions (latest 10)
      prisma.submission.findMany({
        where: {
          assignment: {
            courseId: { in: courseIds },
            deletedAt: null,
          },
        },
        include: {
          student: { select: { name: true, email: true } },
          assignment: {
            select: { id: true, title: true, course: { select: { title: true } } },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 10,
      }),
      // Get all enrollments for students in these courses
      prisma.enrollment.findMany({
        where: {
          batch: {
            courseId: { in: courseIds },
            deletedAt: null,
          },
        },
        select: {
          studentId: true,
          batch: { select: { courseId: true } },
        },
      }),
      // Get all submissions in these courses
      prisma.submission.findMany({
        where: {
          assignment: {
            courseId: { in: courseIds },
            deletedAt: null,
          },
        },
        select: {
          studentId: true,
          assignmentId: true,
          grade: true,
          assignment: { select: { courseId: true } },
        },
      }),
      // Get all quiz attempts in these courses
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
          score: true,
          percentage: true,
          quiz: { select: { courseId: true } },
        },
      }),
    ]);

    // 3. Compute course analytics in memory to avoid N+1
    const courseAnalytics = courses.map((course) => {
      const courseEnrollments = enrollments.filter((e) => e.batch.courseId === course.id);
      const studentCount = courseEnrollments.length;

      const courseAssignments = course.assignments;
      const courseQuizzes = course.quizzes;

      const courseSubmissions = submissions.filter((s) => s.assignment.courseId === course.id);
      const courseQuizAttempts = quizAttempts.filter((qa) => qa.quiz.courseId === course.id);

      let assignmentProgress = 0;
      if (studentCount > 0 && courseAssignments.length > 0) {
        assignmentProgress = (courseSubmissions.length / (studentCount * courseAssignments.length)) * 100;
      }

      let quizProgress = 0;
      if (studentCount > 0 && courseQuizzes.length > 0) {
        quizProgress = (courseQuizAttempts.length / (studentCount * courseQuizzes.length)) * 100;
      }

      let averageMarks = 0;
      if (courseQuizAttempts.length > 0) {
        averageMarks = courseQuizAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / courseQuizAttempts.length;
      }

      return {
        id: course.id,
        title: course.title,
        courseCode: course.courseCode,
        studentCount,
        assignmentProgress: Math.min(100, Math.round(assignmentProgress * 10) / 10),
        quizProgress: Math.min(100, Math.round(quizProgress * 10) / 10),
        averageMarks: Math.round(averageMarks * 10) / 10,
      };
    });

    // 4. Compute student performance
    const studentIds = Array.from(new Set(enrollments.map((e) => e.studentId)));
    const studentsInfo = await prisma.user.findMany({
      where: { id: { in: studentIds }, deletedAt: null },
      select: { id: true, name: true, email: true },
    });

    const studentPerfList = studentsInfo.map((s) => {
      const studentAttempts = quizAttempts.filter((qa) => qa.studentId === s.id);
      const avgQuizScore = studentAttempts.length > 0
        ? studentAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / studentAttempts.length
        : 0;

      const studentSubmissions = submissions.filter((sub) => sub.studentId === s.id);
      const totalPossibleAssignments = courses.reduce((acc, c) => {
        const isEnrolled = enrollments.some((e) => e.studentId === s.id && e.batch.courseId === c.id);
        return acc + (isEnrolled ? c.assignments.length : 0);
      }, 0);

      const submissionRate = totalPossibleAssignments > 0
        ? (studentSubmissions.length / totalPossibleAssignments) * 100
        : 0;

      const performanceScore = (avgQuizScore + Math.min(100, submissionRate)) / 2;

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        avgQuizScore: Math.round(avgQuizScore * 10) / 10,
        submissionRate: Math.min(100, Math.round(submissionRate * 10) / 10),
        performanceScore: Math.round(performanceScore * 10) / 10,
      };
    });

    const topPerformers = [...studentPerfList]
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 5);

    const needingAttention = [...studentPerfList]
      .filter((s) => s.performanceScore < 50 || s.submissionRate < 50)
      .sort((a, b) => a.performanceScore - b.performanceScore)
      .slice(0, 5);

    // Fetch Communication & Engagement metrics for Faculty
    const now = new Date();
    const [
      pendingDoubtsList,
      recentDiscussionsList,
      announcementsList,
      upcomingEventsList,
      feedbackPendingList
    ] = await Promise.all([
      prisma.doubt.findMany({
        where: {
          instituteId,
          deletedAt: null,
          status: { in: ["OPEN", "IN_PROGRESS"] },
          course: { facultyId, deletedAt: null }
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          creator: { select: { name: true } },
          course: { select: { title: true } }
        }
      }),
      prisma.discussion.findMany({
        where: {
          instituteId,
          deletedAt: null,
          course: { facultyId, deletedAt: null }
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          creator: { select: { name: true } },
          course: { select: { title: true } }
        }
      }),
      prisma.announcement.findMany({
        where: {
          instituteId,
          deletedAt: null,
          createdBy: facultyId
        },
        orderBy: { createdAt: "desc" },
        take: 5
      }),
      prisma.event.findMany({
        where: {
          instituteId,
          deletedAt: null,
          endDate: { gte: now }
        },
        orderBy: { startDate: "asc" },
        take: 5
      }),
      prisma.feedback.findMany({
        where: {
          instituteId,
          deletedAt: null,
          adminResponse: null,
          OR: [
            { course: { facultyId, deletedAt: null } },
            { facultyId }
          ]
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          course: { select: { title: true } }
        }
      })
    ]);

    return {
      pendingGrading,
      upcomingAssignments,
      recentSubmissions,
      courseAnalytics,
      studentPerformance: {
        topPerformers,
        needingAttention,
      },
      pendingDoubts: pendingDoubtsList.map(d => ({
        id: d.id,
        subject: d.subject,
        status: d.status,
        priority: d.priority,
        studentName: d.creator.name,
        courseTitle: d.course.title,
        createdAt: d.createdAt
      })),
      recentDiscussions: recentDiscussionsList.map(d => ({
        id: d.id,
        title: d.title,
        courseId: d.courseId,
        courseTitle: d.course.title,
        creatorName: d.creator.name,
        createdAt: d.createdAt
      })),
      announcements: announcementsList.map(a => ({
        id: a.id,
        title: a.title,
        category: a.category,
        priority: a.priority,
        publishDate: a.publishDate,
        active: a.active
      })),
      upcomingEvents: upcomingEventsList.map(e => ({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        venue: e.venue,
        speaker: e.speaker
      })),
      feedbackPending: feedbackPendingList.map(f => ({
        id: f.id,
        type: f.type,
        rating: f.rating,
        comments: f.comments,
        courseTitle: f.course?.title || null,
        createdAt: f.createdAt
      }))
    };
  }

  /**
   * Aggregates dashboard analytics for students.
   */
  static async getStudentDashboardData(
    studentId: string,
    instituteId: string
  ): Promise<StudentDashboardData> {
    const [studentEnrollments, progressList, userLogs, recentCertificates, unreadNotifications] = await Promise.all([
      // Student enrollments
      prisma.enrollment.findMany({
        where: {
          studentId,
          batch: {
            deletedAt: null,
            course: { deletedAt: null, instituteId },
          },
        },
        include: {
          batch: {
            include: {
              course: {
                include: {
                  videos: {
                    where: { published: true, deletedAt: null },
                    select: { id: true, sortOrder: true, title: true, courseId: true },
                  },
                },
              },
            },
          },
        },
      }),
      // Video completed progress list
      prisma.progress.findMany({
        where: { userId: studentId, completed: true },
        select: { videoId: true },
      }),
      // Student logs
      prisma.auditLog.findMany({
        where: { userId: studentId, instituteId },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      // Certificates
      prisma.certificate.findMany({
        where: { studentId, instituteId, status: "ACTIVE", deletedAt: null },
        include: {
          course: { select: { title: true } },
        },
        orderBy: { issueDate: "desc" },
        take: 5,
      }),
      // Unread notifications
      prisma.notification.findMany({
        where: { userId: studentId, instituteId, isRead: false, deletedAt: null },
        select: { id: true, title: true, message: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // 1. Calculate learning streak (consecutive active days)
    const activeDates = new Set(userLogs.map((l) => l.createdAt.toDateString()));
    let learningStreak = 0;
    const currentCheck = new Date();

    if (activeDates.has(currentCheck.toDateString())) {
      learningStreak = 1;
      while (true) {
        currentCheck.setDate(currentCheck.getDate() - 1);
        if (activeDates.has(currentCheck.toDateString())) {
          learningStreak++;
        } else {
          break;
        }
      }
    } else {
      currentCheck.setDate(currentCheck.getDate() - 1);
      if (activeDates.has(currentCheck.toDateString())) {
        learningStreak = 1;
        while (true) {
          currentCheck.setDate(currentCheck.getDate() - 1);
          if (activeDates.has(currentCheck.toDateString())) {
            learningStreak++;
          } else {
            break;
          }
        }
      }
    }

    // 2. Calculate overall progress
    const completedVideoIds = new Set(progressList.map((p) => p.videoId));
    let totalVideos = 0;
    let completedVideos = 0;

    studentEnrollments.forEach((e) => {
      const courseVideos = e.batch.course.videos;
      totalVideos += courseVideos.length;
      completedVideos += courseVideos.filter((v) => completedVideoIds.has(v.id)).length;
    });

    const overallProgress = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    // 3. Continue learning recommendation
    const lastProgress = await prisma.progress.findFirst({
      where: {
        userId: studentId,
        video: {
          course: { deletedAt: null, instituteId },
          deletedAt: null,
        },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        video: {
          include: { course: true },
        },
      },
    });

    let continueLearning = null;
    if (lastProgress) {
      const currentVideo = lastProgress.video;
      // Fetch next video in the same course by sortOrder
      const nextVideo = await prisma.video.findFirst({
        where: {
          courseId: currentVideo.courseId,
          published: true,
          deletedAt: null,
          sortOrder: { gt: currentVideo.sortOrder },
        },
        orderBy: { sortOrder: "asc" },
      });

      if (nextVideo) {
        continueLearning = {
          id: nextVideo.id,
          title: nextVideo.title,
          courseId: currentVideo.courseId,
          courseTitle: currentVideo.course.title,
        };
      } else {
        continueLearning = {
          id: currentVideo.id,
          title: currentVideo.title,
          courseId: currentVideo.courseId,
          courseTitle: currentVideo.course.title,
          isCompleted: true,
        };
      }
    } else if (studentEnrollments.length > 0) {
      const firstCourse = studentEnrollments[0].batch.course;
      const firstVideo = await prisma.video.findFirst({
        where: { courseId: firstCourse.id, published: true, deletedAt: null },
        orderBy: { sortOrder: "asc" },
      });
      if (firstVideo) {
        continueLearning = {
          id: firstVideo.id,
          title: firstVideo.title,
          courseId: firstCourse.id,
          courseTitle: firstCourse.title,
        };
      }
    }

    // 4. Fetch upcoming unsubmitted assignment deadlines
    const enrolledCourseIds = studentEnrollments.map((e) => e.batch.courseId);
    const studentSubmissions = await prisma.submission.findMany({
      where: { studentId },
      select: { assignmentId: true },
    });
    const submittedAssignmentIds = new Set(studentSubmissions.map((s) => s.assignmentId));

    const upcomingDeadlines = await prisma.assignment.findMany({
      where: {
        courseId: { in: enrolledCourseIds },
        deletedAt: null,
        id: { notIn: Array.from(submittedAssignmentIds) },
        dueDate: { gte: new Date() },
      },
      include: {
        course: { select: { title: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    // 5. Recent student audit activities
    const recentActivityRaw = await prisma.auditLog.findMany({
      where: { userId: studentId, instituteId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const recentActivity = recentActivityRaw.map((log) => ({
      id: log.id,
      action: log.action,
      module: log.module,
      description: log.description,
      createdAt: log.createdAt,
    }));

    // Fetch Communication & Engagement metrics for Student
    const enrolledBatchIds = studentEnrollments.map((e) => e.batchId);
    const now = new Date();
    const [
      unreadAnnouncementsList,
      upcomingEventsList,
      activePollsList,
      recentDiscussionsList,
      openDoubtsList
    ] = await Promise.all([
      prisma.announcement.findMany({
        where: {
          instituteId,
          deletedAt: null,
          active: true,
          publishDate: { lte: now },
          OR: [
            { expiryDate: null },
            { expiryDate: { gt: now } }
          ],
          AND: [
            {
              OR: [
                { targetAudience: "EVERYONE" },
                { targetAudience: "STUDENTS" },
                { AND: [{ targetAudience: "COURSE" }, { courseId: { in: enrolledCourseIds } }] },
                { AND: [{ targetAudience: "BATCH" }, { batchId: { in: enrolledBatchIds } }] }
              ]
            }
          ]
        },
        orderBy: [
          { pinned: "desc" },
          { publishDate: "desc" }
        ],
        take: 5,
        include: {
          creator: { select: { name: true } }
        }
      }),
      prisma.event.findMany({
        where: {
          instituteId,
          deletedAt: null,
          endDate: { gte: now }
        },
        orderBy: { startDate: "asc" },
        take: 5,
        include: {
          registrations: {
            where: { studentId, deletedAt: null },
            select: { id: true }
          }
        }
      }),
      prisma.poll.findMany({
        where: {
          instituteId,
          deletedAt: null,
          expiryDate: { gt: now }
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          votes: {
            where: { userId: studentId, deletedAt: null },
            select: { optionId: true }
          }
        }
      }),
      prisma.discussion.findMany({
        where: {
          instituteId,
          deletedAt: null,
          courseId: { in: enrolledCourseIds }
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          creator: { select: { name: true } },
          course: { select: { title: true } }
        }
      }),
      prisma.doubt.findMany({
        where: {
          instituteId,
          createdBy: studentId,
          deletedAt: null,
          status: { in: ["OPEN", "IN_PROGRESS"] }
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          course: { select: { title: true } }
        }
      })
    ]);

    return {
      learningStreak,
      overallProgress,
      continueLearning,
      upcomingDeadlines,
      recentCertificates: recentCertificates.map(c => ({
        id: c.id,
        certificateNumber: c.certificateNumber,
        issueDate: c.issueDate,
        course: { title: c.course.title }
      })),
      unreadNotifications: unreadNotifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt
      })),
      recentActivity,
      unreadAnnouncements: unreadAnnouncementsList.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        category: a.category,
        priority: a.priority,
        publishDate: a.publishDate,
        creatorName: a.creator.name
      })),
      upcomingEvents: upcomingEventsList.map(e => ({
        id: e.id,
        title: e.title,
        startDate: e.startDate,
        endDate: e.endDate,
        venue: e.venue,
        speaker: e.speaker,
        isRegistered: e.registrations.length > 0
      })),
      activePolls: activePollsList.map(p => ({
        id: p.id,
        question: p.question,
        expiryDate: p.expiryDate,
        hasVoted: p.votes.length > 0
      })),
      recentDiscussions: recentDiscussionsList.map(d => ({
        id: d.id,
        title: d.title,
        courseId: d.courseId,
        courseTitle: d.course.title,
        creatorName: d.creator.name,
        createdAt: d.createdAt
      })),
      openDoubts: openDoubtsList.map(d => ({
        id: d.id,
        subject: d.subject,
        status: d.status,
        priority: d.priority,
        courseTitle: d.course.title,
        createdAt: d.createdAt
      }))
    };
  }
}
