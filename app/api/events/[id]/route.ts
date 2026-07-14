import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { createEventSchema } from "@/lib/validations/event";
import { logAction } from "@/lib/services/audit-service";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findFirst({
      where: { id: params.id, deletedAt: null },
      include: {
        creator: { select: { id: true, name: true } },
        registrations: {
          where: { deletedAt: null },
          include: {
            student: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Tenant isolation
    if (user.role !== "SUPER_ADMIN" && event.instituteId !== user.instituteId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const isRegistered = event.registrations.some(r => r.studentId === user.id);

    const formattedEvent = {
      ...event,
      isRegistered,
      registrationsCount: event.registrations.length,
      creatorName: event.creator.name
    };

    return NextResponse.json(formattedEvent);
  } catch (error) {
    console.error("GET EVENT ERROR:", error);
    return NextResponse.json({ message: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Role check: Admin / Super Admin / Faculty
    if (!["ADMIN", "SUPER_ADMIN", "FACULTY"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const event = await prisma.event.findFirst({
      where: { id: params.id, deletedAt: null }
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Tenant isolation
    if (user.role !== "SUPER_ADMIN" && event.instituteId !== user.instituteId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Faculty member must be creator
    if (user.role === "FACULTY" && event.createdBy !== user.id) {
      return NextResponse.json({ message: "Forbidden: You did not create this event" }, { status: 403 });
    }

    const body = await req.json();
    const validation = createEventSchema.partial().safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.error.issues }, { status: 400 });
    }

    const {
      title, description, venue, onlineMeetingLink, speaker, banner,
      startDate, endDate, registrationRequired, capacity
    } = validation.data;

    const start = startDate || event.startDate;
    const end = endDate || event.endDate;
    if (new Date(start) >= new Date(end)) {
      return NextResponse.json({ message: "Event start date must be before end date" }, { status: 400 });
    }

    const updatedEvent = await prisma.$transaction(async (tx) => {
      const result = await tx.event.update({
        where: { id: params.id },
        data: {
          title: title !== undefined ? title : undefined,
          description: description !== undefined ? description : undefined,
          venue: venue !== undefined ? (venue || null) : undefined,
          onlineMeetingLink: onlineMeetingLink !== undefined ? (onlineMeetingLink || null) : undefined,
          speaker: speaker !== undefined ? (speaker || null) : undefined,
          banner: banner !== undefined ? (banner || null) : undefined,
          startDate: startDate !== undefined ? startDate : undefined,
          endDate: endDate !== undefined ? endDate : undefined,
          registrationRequired: registrationRequired !== undefined ? registrationRequired : undefined,
          capacity: capacity !== undefined ? (capacity || null) : undefined
        }
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId: event.instituteId,
        action: "UPDATE_EVENT",
        module: "EVENTS",
        entityType: "Event",
        entityId: event.id,
        description: `Updated event: ${event.title}`,
        oldValues: event,
        newValues: result
      });

      return result;
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("PATCH EVENT ERROR:", error);
    return NextResponse.json({ message: "Failed to update event", error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Role check: Admin / Super Admin / Faculty
    if (!["ADMIN", "SUPER_ADMIN", "FACULTY"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const event = await prisma.event.findFirst({
      where: { id: params.id, deletedAt: null }
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Tenant isolation
    if (user.role !== "SUPER_ADMIN" && event.instituteId !== user.instituteId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Faculty member must be creator
    if (user.role === "FACULTY" && event.createdBy !== user.id) {
      return NextResponse.json({ message: "Forbidden: You did not create this event" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id: params.id },
        data: { deletedAt: new Date() }
      });

      // Soft delete registrations
      await tx.eventRegistration.updateMany({
        where: { eventId: params.id, deletedAt: null },
        data: { deletedAt: new Date() }
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId: event.instituteId,
        action: "DELETE_EVENT",
        module: "EVENTS",
        entityType: "Event",
        entityId: event.id,
        description: `Soft deleted event: ${event.title}`
      });
    });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("DELETE EVENT ERROR:", error);
    return NextResponse.json({ message: "Failed to delete event", error: String(error) }, { status: 500 });
  }
}
