import { prisma } from "./prisma";
import { authenticateRequest, JWTPayload } from "./auth";

export interface AuthorizedUser {
  id: string;
  email: string;
  role: string;
  instituteId: string | null;
}

/**
 * Resolves full user profile from the database to obtain the real role and instituteId.
 * This is crucial because instituteId is not currently serialized in the client's JWT payload.
 */
export async function getAuthorizedUser(payload: JWTPayload): Promise<AuthorizedUser | null> {
  const dbUser = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, role: true, instituteId: true },
  });
  if (!dbUser) return null;
  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role.toString(),
    instituteId: dbUser.instituteId,
  };
}

/**
 * Validates authenticated user's access permissions for a specific course.
 */
export async function authorizeCourseAccess(
  req: Request,
  courseId: string,
  allowedRoles: string[]
) {
  const payload = await authenticateRequest(req);
  if (!payload) {
    return { status: 401, message: "Unauthorized: Invalid or missing token", user: null };
  }

  const user = await getAuthorizedUser(payload);
  if (!user) {
    return { status: 401, message: "Unauthorized: User not found", user: null };
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    return { status: 404, message: "Course not found", user: null };
  }

  // SUPER_ADMIN has master access to all courses
  if (user.role === "SUPER_ADMIN") {
    return { status: 200, user, course };
  }

  // Tenant Isolation Check
  if (user.instituteId !== course.instituteId) {
    return { status: 403, message: "Forbidden: Tenant mismatch", user: null };
  }

  // Role Validation Check
  if (!allowedRoles.includes(user.role)) {
    return { status: 403, message: `Forbidden: Role ${user.role} is not permitted`, user: null };
  }

  // Ownership/Teaching validation for Faculty
  if (user.role === "FACULTY" && course.facultyId !== user.id) {
    return { status: 403, message: "Forbidden: You are not assigned to teach this course", user: null };
  }

  // Active Enrollment validation for Students
  if (user.role === "STUDENT") {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: user.id,
        batch: {
          courseId: courseId,
          deletedAt: null,
        },
      },
    });
    if (!enrollment) {
      return { status: 403, message: "Forbidden: You are not enrolled in this course", user: null };
    }
  }

  return { status: 200, user, course };
}

/**
 * Validates authenticated user's access permissions for a specific video lesson.
 */
export async function authorizeVideoAccess(
  req: Request,
  videoId: string,
  allowedRoles: string[]
) {
  const payload = await authenticateRequest(req);
  if (!payload) {
    return { status: 401, message: "Unauthorized: Invalid or missing token", user: null };
  }

  const user = await getAuthorizedUser(payload);
  if (!user) {
    return { status: 401, message: "Unauthorized: User not found", user: null };
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId, deletedAt: null },
    include: {
      course: {
        select: { id: true, instituteId: true, facultyId: true },
      },
    },
  });

  if (!video) {
    return { status: 404, message: "Video not found", user: null };
  }

  if (user.role === "SUPER_ADMIN") {
    return { status: 200, user, video };
  }

  // Tenant Isolation Check
  if (user.instituteId !== video.course.instituteId) {
    return { status: 403, message: "Forbidden: Tenant mismatch", user: null };
  }

  // Role Validation Check
  if (!allowedRoles.includes(user.role)) {
    return { status: 403, message: `Forbidden: Role ${user.role} is not permitted`, user: null };
  }

  // Ownership/Teaching check for Faculty
  if (user.role === "FACULTY" && video.course.facultyId !== user.id) {
    return { status: 403, message: "Forbidden: You are not assigned to teach this video's course", user: null };
  }

  // Enrollment check for Students
  if (user.role === "STUDENT") {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: user.id,
        batch: {
          courseId: video.courseId,
          deletedAt: null,
        },
      },
    });
    if (!enrollment) {
      return { status: 403, message: "Forbidden: You are not enrolled in this course", user: null };
    }

    // Students cannot view unpublished videos
    if (!video.published) {
      return { status: 403, message: "Forbidden: This lesson is not published", user: null };
    }
  }

  return { status: 200, user, video };
}
