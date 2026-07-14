import { prisma } from "../prisma";
import { SearchParams } from "../validations/search";
import { AuthorizedUser } from "../authorization";

export class SearchService {
  private static instance: SearchService;

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  public async search(params: SearchParams, user: AuthorizedUser) {
    const { q, page, limit, type } = params;
    const skip = (page - 1) * limit;

    // Determine target modules to search
    const modules = type
      ? [type]
      : [
          "students",
          "faculty",
          "courses",
          "assignments",
          "quizzes",
          "certificates",
          "certificateTemplates",
          "videos",
          "studyMaterials",
          "reports",
          "notifications",
          "institutes",
        ];

    // Build role-based filters and execute queries in parallel
    const searchPromises: Record<string, Promise<{ results: any[]; total: number }>> = {};

    // 1. Students
    if (modules.includes("students")) {
      searchPromises.students = this.searchStudents(q, skip, limit, user);
    }
    // 2. Faculty
    if (modules.includes("faculty")) {
      searchPromises.faculty = this.searchFaculty(q, skip, limit, user);
    }
    // 3. Courses
    if (modules.includes("courses")) {
      searchPromises.courses = this.searchCourses(q, skip, limit, user);
    }
    // 4. Assignments
    if (modules.includes("assignments")) {
      searchPromises.assignments = this.searchAssignments(q, skip, limit, user);
    }
    // 5. Quizzes
    if (modules.includes("quizzes")) {
      searchPromises.quizzes = this.searchQuizzes(q, skip, limit, user);
    }
    // 6. Certificates
    if (modules.includes("certificates")) {
      searchPromises.certificates = this.searchCertificates(q, skip, limit, user);
    }
    // 7. Certificate Templates
    if (modules.includes("certificateTemplates")) {
      searchPromises.certificateTemplates = this.searchCertificateTemplates(q, skip, limit, user);
    }
    // 8. Videos
    if (modules.includes("videos")) {
      searchPromises.videos = this.searchVideos(q, skip, limit, user);
    }
    // 9. Study Materials
    if (modules.includes("studyMaterials")) {
      searchPromises.studyMaterials = this.searchStudyMaterials(q, skip, limit, user);
    }
    // 10. Reports
    if (modules.includes("reports")) {
      searchPromises.reports = this.searchReports(q, skip, limit, user);
    }
    // 11. Notifications
    if (modules.includes("notifications")) {
      searchPromises.notifications = this.searchNotifications(q, skip, limit, user);
    }
    // 12. Institutes
    if (modules.includes("institutes")) {
      searchPromises.institutes = this.searchInstitutes(q, skip, limit, user);
    }

    const keys = Object.keys(searchPromises);
    const resolved = await Promise.all(Object.values(searchPromises));

    const data: Record<string, any[]> = {};
    const pagination: Record<string, { page: number; limit: number; total: number }> = {};

    keys.forEach((key, index) => {
      const val = resolved[index];
      data[key] = val.results;
      pagination[key] = {
        page,
        limit,
        total: val.total,
      };
    });

    return {
      success: true,
      query: q,
      data,
      pagination: type ? pagination[type] : pagination,
    };
  }

  private async searchStudents(q: string, skip: number, limit: number, user: AuthorizedUser) {
    const where: any = {
      role: "STUDENT",
      deletedAt: null,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    };

    if (user.role !== "SUPER_ADMIN") {
      where.instituteId = user.instituteId;
    }

    if (user.role === "STUDENT") {
      where.id = user.id;
    } else if (user.role === "FACULTY") {
      where.enrollments = {
        some: {
          batch: {
            course: {
              facultyId: user.id,
              deletedAt: null,
            },
            deletedAt: null,
          },
        },
      };
    }

    const [results, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, instituteId: true },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { results, total };
  }

  private async searchFaculty(q: string, skip: number, limit: number, user: AuthorizedUser) {
    const where: any = {
      role: "FACULTY",
      deletedAt: null,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    };

    if (user.role !== "SUPER_ADMIN") {
      where.instituteId = user.instituteId;
    }

    if (user.role === "STUDENT") {
      where.coursesTaught = {
        some: {
          batches: {
            some: {
              enrollments: {
                some: { studentId: user.id },
              },
              deletedAt: null,
            },
          },
          deletedAt: null,
        },
      };
    }

    const [results, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, instituteId: true },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { results, total };
  }

  private async searchCourses(q: string, skip: number, limit: number, user: AuthorizedUser) {
    const where: any = {
      deletedAt: null,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { courseCode: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    };

    if (user.role !== "SUPER_ADMIN") {
      where.instituteId = user.instituteId;
    }

    if (user.role === "FACULTY") {
      where.facultyId = user.id;
    } else if (user.role === "STUDENT") {
      where.batches = {
        some: {
          enrollments: {
            some: { studentId: user.id },
          },
          deletedAt: null,
        },
      };
    }

    const [results, total] = await Promise.all([
      prisma.course.findMany({
        where,
        select: { id: true, title: true, courseCode: true, description: true, facultyId: true, instituteId: true },
        skip,
        take: limit,
        orderBy: { title: "asc" },
      }),
      prisma.course.count({ where }),
    ]);

    return { results, total };
  }

  private async searchAssignments(q: string, skip: number, limit: number, user: AuthorizedUser) {
    const where: any = {
      deletedAt: null,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    };

    const courseFilter: any = { deletedAt: null };
    if (user.role !== "SUPER_ADMIN") {
      courseFilter.instituteId = user.instituteId;
    }

    if (user.role === "FACULTY") {
      courseFilter.facultyId = user.id;
    } else if (user.role === "STUDENT") {
      courseFilter.batches = {
        some: {
          enrollments: {
            some: { studentId: user.id },
          },
          deletedAt: null,
        },
      };
    }
    where.course = courseFilter;

    const [results, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          courseId: true,
          course: {
            select: { title: true, courseCode: true },
          },
        },
        skip,
        take: limit,
        orderBy: { title: "asc" },
      }),
      prisma.assignment.count({ where }),
    ]);

    return { results, total };
  }

  private async searchQuizzes(q: string, skip: number, limit: number, user: AuthorizedUser) {
    const where: any = {
      deletedAt: null,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    };

    if (user.role !== "SUPER_ADMIN") {
      where.instituteId = user.instituteId;
    }

    const courseFilter: any = { deletedAt: null };
    if (user.role === "FACULTY") {
      courseFilter.facultyId = user.id;
      where.course = courseFilter;
    } else if (user.role === "STUDENT") {
      where.isPublished = true;
      courseFilter.batches = {
        some: {
          enrollments: {
            some: { studentId: user.id },
          },
          deletedAt: null,
        },
      };
      where.course = courseFilter;
    }

    const [results, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          timeLimit: true,
          passingMarks: true,
          totalMarks: true,
          isPublished: true,
          courseId: true,
          course: {
            select: { title: true, courseCode: true },
          },
        },
        skip,
        take: limit,
        orderBy: { title: "asc" },
      }),
      prisma.quiz.count({ where }),
    ]);

    return { results, total };
  }

  private async searchCertificates(q: string, skip: number, limit: number, user: AuthorizedUser) {
    const where: any = {
      deletedAt: null,
      certificateNumber: { contains: q, mode: "insensitive" },
    };

    if (user.role !== "SUPER_ADMIN") {
      where.instituteId = user.instituteId;
    }

    if (user.role === "FACULTY") {
      where.course = { facultyId: user.id, deletedAt: null };
    } else if (user.role === "STUDENT") {
      where.studentId = user.id;
    }

    const [results, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        select: {
          id: true,
          certificateNumber: true,
          status: true,
          issueDate: true,
          studentId: true,
          courseId: true,
          student: { select: { name: true, email: true } },
          course: { select: { title: true, courseCode: true } },
        },
        skip,
        take: limit,
        orderBy: { issueDate: "desc" },
      }),
      prisma.certificate.count({ where }),
    ]);

    return { results, total };
  }

  private async searchCertificateTemplates(q: string, skip: number, limit: number, user: AuthorizedUser) {
    const where: any = {
      deletedAt: null,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    };

    if (user.role !== "SUPER_ADMIN") {
      where.instituteId = user.instituteId;
    }

    if (user.role === "STUDENT") {
      where.isActive = true;
    }

    const [results, total] = await Promise.all([
      prisma.certificateTemplate.findMany({
        where,
        select: { id: true, name: true, title: true, description: true, isActive: true, instituteId: true },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.certificateTemplate.count({ where }),
    ]);

    return { results, total };
  }

  private async searchVideos(q: string, skip: number, limit: number, user: AuthorizedUser) {
    const where: any = {
      deletedAt: null,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    };

    const courseFilter: any = { deletedAt: null };
    if (user.role !== "SUPER_ADMIN") {
      courseFilter.instituteId = user.instituteId;
    }

    if (user.role === "FACULTY") {
      courseFilter.facultyId = user.id;
    } else if (user.role === "STUDENT") {
      where.published = true;
      courseFilter.batches = {
        some: {
          enrollments: {
            some: { studentId: user.id },
          },
          deletedAt: null,
        },
      };
    }
    where.course = courseFilter;

    const [results, total] = await Promise.all([
      prisma.video.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          videoUrl: true,
          duration: true,
          courseId: true,
          course: {
            select: { title: true, courseCode: true },
          },
        },
        skip,
        take: limit,
        orderBy: { title: "asc" },
      }),
      prisma.video.count({ where }),
    ]);

    return { results, total };
  }

  private async searchStudyMaterials(q: string, skip: number, limit: number, user: AuthorizedUser) {
    const where: any = {
      deletedAt: null,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    };

    const courseFilter: any = { deletedAt: null };
    if (user.role !== "SUPER_ADMIN") {
      courseFilter.instituteId = user.instituteId;
    }

    if (user.role === "FACULTY") {
      courseFilter.facultyId = user.id;
    } else if (user.role === "STUDENT") {
      courseFilter.batches = {
        some: {
          enrollments: {
            some: { studentId: user.id },
          },
          deletedAt: null,
        },
      };
    }
    where.course = courseFilter;

    const [results, total] = await Promise.all([
      prisma.material.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          fileUrl: true,
          materialType: true,
          courseId: true,
          course: {
            select: { title: true, courseCode: true },
          },
        },
        skip,
        take: limit,
        orderBy: { title: "asc" },
      }),
      prisma.material.count({ where }),
    ]);

    return { results, total };
  }

  private async searchNotifications(q: string, skip: number, limit: number, user: AuthorizedUser) {
    const where: any = {
      deletedAt: null,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { message: { contains: q, mode: "insensitive" } },
      ],
    };

    if (user.role !== "SUPER_ADMIN") {
      where.instituteId = user.instituteId;
    }

    if (user.role === "STUDENT" || user.role === "FACULTY") {
      where.userId = user.id;
    }

    const [results, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        select: { id: true, title: true, message: true, type: true, isRead: true, userId: true, createdAt: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ]);

    return { results, total };
  }

  private async searchReports(q: string, skip: number, limit: number, user: AuthorizedUser) {
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return { results: [], total: 0 };
    }

    const instituteFilter = user.role !== "SUPER_ADMIN" ? { instituteId: user.instituteId || undefined } : {};

    // Match courses
    const courseWhere: any = {
      deletedAt: null,
      ...instituteFilter,
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { courseCode: { contains: q, mode: "insensitive" } },
      ],
    };

    // Match students
    const studentWhere: any = {
      role: "STUDENT",
      deletedAt: null,
      ...instituteFilter,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    };

    const [courses, courseCount, students, studentCount] = await Promise.all([
      prisma.course.findMany({
        where: courseWhere,
        select: { id: true, title: true, courseCode: true },
        take: limit,
      }),
      prisma.course.count({ where: courseWhere }),
      prisma.user.findMany({
        where: studentWhere,
        select: { id: true, name: true, email: true },
        take: limit,
      }),
      prisma.user.count({ where: studentWhere }),
    ]);

    const courseReports = courses.map((c) => ({
      reportType: "course_performance",
      id: c.id,
      code: c.courseCode,
      name: c.title,
      link: `/dashboard/reports?courseId=${c.id}`,
    }));

    const studentReports = students.map((s) => ({
      reportType: "student_performance",
      id: s.id,
      name: s.name,
      email: s.email,
      link: `/dashboard/reports?studentId=${s.id}`,
    }));

    // Combine and paginate
    const combined = [...courseReports, ...studentReports];
    const paginatedResults = combined.slice(skip, skip + limit);
    const total = courseCount + studentCount;

    return { results: paginatedResults, total };
  }

  public async searchInstitutes(q: string, skip: number, limit: number, user: AuthorizedUser) {
    if (user.role !== "SUPER_ADMIN") {
      return { results: [], total: 0 };
    }
    const where: any = {
      isDeleted: false,
      name: { contains: q, mode: "insensitive" },
    };
    const [results, total] = await Promise.all([
      prisma.institute.findMany({
        where,
        select: { id: true, name: true, status: true, createdAt: true },
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.institute.count({ where }),
    ]);
    return { results, total };
  }
}
