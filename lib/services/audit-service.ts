import { prisma } from "@/lib/prisma";
import { AuditLog } from "@/app/generated/prisma/client";

interface LogActionParams {
  req?: Request | null;
  userId?: string | null;
  instituteId: string;
  action: string;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  description?: string | null;
  oldValues?: any;
  newValues?: any;
  status?: "SUCCESS" | "FAILURE";
}

/**
 * Creates an audit log entry in the database.
 */
export async function logAction(params: LogActionParams): Promise<AuditLog | undefined> {
  try {
    const {
      req,
      userId,
      instituteId,
      action,
      module,
      entityType = null,
      entityId = null,
      description = null,
      oldValues = null,
      newValues = null,
      status = "SUCCESS",
    } = params;

    let ipAddress = "unknown";
    let userAgent = "unknown";
    let requestMethod = null;
    let requestPath = null;

    if (req) {
      ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
      userAgent = req.headers.get("user-agent") || "unknown";
      requestMethod = req.method;
      try {
        const url = new URL(req.url);
        requestPath = url.pathname;
      } catch {
        requestPath = req.url;
      }
    }

    return await prisma.auditLog.create({
      data: {
        instituteId,
        userId,
        action,
        module,
        entityType,
        entityId,
        description,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : undefined,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : undefined,
        ipAddress,
        userAgent,
        requestMethod,
        requestPath,
        status,
      },
    });
  } catch (error) {
    console.error("FAILED TO WRITE AUDIT LOG:", error);
  }
}

interface AuditLogFilters {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  module?: string;
  userId?: string;
  status?: "SUCCESS" | "FAILURE";
  startDate?: string | null;
  endDate?: string | null;
  instituteId?: string;
}

/**
 * Helper to build Prisma where clause based on query filters.
 */
async function buildWhereClause(
  user: { id: string; role: string; instituteId: string | null },
  filters: AuditLogFilters
) {
  const andConditions: any[] = [];

  // Tenant Isolation
  if (user.role !== "SUPER_ADMIN") {
    andConditions.push({ instituteId: user.instituteId || "global" });
  } else if (filters.instituteId) {
    andConditions.push({ instituteId: filters.instituteId });
  }

  // Role Filtering
  if (user.role === "STUDENT") {
    // Students only see their own logs
    andConditions.push({ userId: user.id });
  } else if (user.role === "FACULTY") {
    // Faculty see their own logs + students in their assigned courses
    const batches = await prisma.batch.findMany({
      where: {
        course: {
          facultyId: user.id,
          deletedAt: null,
        },
        deletedAt: null,
      },
      select: {
        enrollments: {
          where: {
            student: {
              deletedAt: null,
            },
          },
          select: {
            studentId: true,
          },
        },
      },
    });

    const enrolledStudentIds = Array.from(
      new Set(batches.flatMap((b) => b.enrollments.map((e) => e.studentId)))
    );

    andConditions.push({
      OR: [
        { userId: user.id },
        {
          userId: { in: enrolledStudentIds },
          user: { role: "STUDENT" },
        },
      ],
    });
  } else {
    // Admins and Super Admins can optionally filter by specific userId
    if (filters.userId) {
      andConditions.push({ userId: filters.userId });
    }
  }

  // Common filters
  if (filters.action) andConditions.push({ action: filters.action });
  if (filters.module) andConditions.push({ module: filters.module });
  if (filters.status) andConditions.push({ status: filters.status });

  if (filters.startDate || filters.endDate) {
    const dateCond: any = {};
    if (filters.startDate) dateCond.gte = new Date(filters.startDate);
    if (filters.endDate) dateCond.lte = new Date(filters.endDate);
    andConditions.push({ createdAt: dateCond });
  }

  if (filters.search) {
    andConditions.push({
      OR: [
        { description: { contains: filters.search, mode: "insensitive" } },
        { requestPath: { contains: filters.search, mode: "insensitive" } },
        { entityType: { contains: filters.search, mode: "insensitive" } },
        { entityId: { contains: filters.search, mode: "insensitive" } },
        {
          user: {
            email: { contains: filters.search, mode: "insensitive" },
          },
        },
      ],
    });
  }

  return andConditions.length > 0 ? { AND: andConditions } : {};
}

/**
 * Retrieves a paginated list of audit logs.
 */
export async function getAuditLogs(
  user: { id: string; role: string; instituteId: string | null },
  filters: AuditLogFilters
) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;
  const where = await buildWhereClause(user, filters);

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
  };
}

/**
 * Formats values for safe CSV export.
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return "";
  const str = typeof val === "object" ? JSON.stringify(val) : String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Fetches audit logs and generates a CSV formatted output.
 */
export async function exportAuditLogs(
  user: { id: string; role: string; instituteId: string | null },
  filters: Omit<AuditLogFilters, "page" | "limit">
): Promise<string> {
  const where = await buildWhereClause(user, filters);

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  const headers = [
    "Timestamp",
    "User Name",
    "User Email",
    "Role",
    "Action",
    "Module",
    "Entity Type",
    "Entity ID",
    "Description",
    "Status",
    "IP Address",
    "User Agent",
    "Method",
    "Path",
  ];

  const csvRows = [headers.join(",")];

  for (const log of logs) {
    const row = [
      log.createdAt.toISOString(),
      log.user?.name || "System",
      log.user?.email || "",
      log.user?.role || "",
      log.action,
      log.module,
      log.entityType || "",
      log.entityId || "",
      log.description || "",
      log.status,
      log.ipAddress || "",
      log.userAgent || "",
      log.requestMethod || "",
      log.requestPath || "",
    ];
    csvRows.push(row.map(escapeCsv).join(","));
  }

  return csvRows.join("\n");
}
