import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { createEventSchema, getEventsQuerySchema } from "@/lib/validations/event";
import { logAction } from "@/lib/services/audit-service";

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validation = getEventsQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const { page, limit, upcoming } = validation.data;
    const search = searchParams.get("search");

    const where: any = { deletedAt: null };

    // Tenant Isolation
    if (user.role !== "SUPER_ADMIN") {
      where.instituteId = user.instituteId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { speaker: { contains: search, mode: "insensitive" } }
      ];
    }

    if (upcoming === true) {
      where.endDate = { gte: new Date() };
    } else if (upcoming === false) {
      where.endDate = { lt: new Date() };
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: "asc" },
        include: {
          creator: {
            select: { id: true, name: true }
          },
          registrations: {
            where: { deletedAt: null },
            select: { studentId: true }
          }
        }
      }),
      prisma.event.count({ where })
    ]);

    const formattedEvents = events.map(e => {
      const isRegistered = e.registrations.some(r => r.studentId === user.id);
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        venue: e.venue,
        onlineMeetingLink: e.onlineMeetingLink,
        speaker: e.speaker,
        banner: e.banner,
        startDate: e.startDate,
        endDate: e.endDate,
        registrationRequired: e.registrationRequired,
        capacity: e.capacity,
        registrationsCount: e.registrations.length,
        isRegistered,
        createdBy: e.createdBy,
        creatorName: e.creator.name,
        createdAt: e.createdAt
      };
    });

    return NextResponse.json({
      data: formattedEvents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("GET EVENTS ERROR:", error);
    return NextResponse.json({ message: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Role verification
    if (!["ADMIN", "SUPER_ADMIN", "FACULTY"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden: Admin or Faculty access required" }, { status: 403 });
    }

    const instituteId = user.instituteId || "global";

    const body = await req.json();
    const validation = createEventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const {
      title, description, venue, onlineMeetingLink, speaker, banner,
      startDate, endDate, registrationRequired, capacity
    } = validation.data;

    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json({ message: "Event start date must be before end date" }, { status: 400 });
    }

    const newEvent = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          title,
          description,
          venue: venue || null,
          onlineMeetingLink: onlineMeetingLink || null,
          speaker: speaker || null,
          banner: banner || null,
          startDate,
          endDate,
          registrationRequired: registrationRequired || false,
          capacity: capacity || null,
          instituteId,
          createdBy: user.id
        }
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId,
        action: "CREATE_EVENT",
        module: "EVENTS",
        entityType: "Event",
        entityId: event.id,
        description: `Created event: ${title}`
      });

      return event;
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("POST EVENT ERROR:", error);
    return NextResponse.json({ message: "Failed to create event", error: String(error) }, { status: 500 });
  }
}
