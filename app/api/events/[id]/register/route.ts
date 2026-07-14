import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { logAction } from "@/lib/services/audit-service";
import { createNotification } from "@/lib/services/notification-service";
import { NotificationType, NotificationPriority } from "@/app/generated/prisma/client";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
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

    // Role check: only students can register
    if (user.role !== "STUDENT") {
      return NextResponse.json({ message: "Forbidden: Only students can register for events" }, { status: 403 });
    }

    const event = await prisma.event.findFirst({
      where: { id: params.id, deletedAt: null }
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Tenant isolation
    if (event.instituteId !== user.instituteId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Expiry check
    const now = new Date();
    if (new Date(event.endDate) < now) {
      return NextResponse.json({ message: "Forbidden: This event has already completed" }, { status: 403 });
    }

    // Capacity verification
    if (event.capacity !== null) {
      const activeRegistrations = await prisma.eventRegistration.count({
        where: { eventId: params.id, deletedAt: null }
      });
      if (activeRegistrations >= event.capacity) {
        return NextResponse.json({ message: "Forbidden: This event is at maximum capacity" }, { status: 400 });
      }
    }

    // Check duplicate registration
    const existing = await prisma.eventRegistration.findUnique({
      where: {
        eventId_studentId: {
          eventId: params.id,
          studentId: user.id
        }
      }
    });

    if (existing) {
      if (existing.deletedAt === null) {
        return NextResponse.json({ message: "Forbidden: You are already registered for this event" }, { status: 400 });
      } else {
        // Re-register if previously cancelled
        await prisma.eventRegistration.update({
          where: { id: existing.id },
          data: { deletedAt: null }
        });
      }
    } else {
      await prisma.eventRegistration.create({
        data: {
          eventId: params.id,
          studentId: user.id,
          instituteId: event.instituteId,
          createdBy: user.id
        }
      });
    }

    // Audit Log
    await logAction({
      req,
      userId: user.id,
      instituteId: event.instituteId,
      action: "REGISTER_EVENT",
      module: "EVENTS",
      entityType: "Event",
      entityId: event.id,
      description: `Registered for event: "${event.title}"`
    });

    // Notify student about event registration
    await createNotification({
      userId: user.id,
      instituteId: event.instituteId,
      title: "Event Registration Confirmed",
      message: `You have successfully registered for: "${event.title}"`,
      type: NotificationType.EVENT_REGISTRATION,
      priority: NotificationPriority.NORMAL,
      actionUrl: `/dashboard/events`
    }).catch(err => console.error("EVENT_REGISTRATION NOTIFICATION ERROR:", err));

    return NextResponse.json({ success: true, message: "Registered for event successfully" });
  } catch (error) {
    console.error("REGISTER EVENT ERROR:", error);
    return NextResponse.json({ message: "Failed to register for event", error: String(error) }, { status: 500 });
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

    if (user.role !== "STUDENT") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const registration = await prisma.eventRegistration.findFirst({
      where: { eventId: params.id, studentId: user.id, deletedAt: null }
    });

    if (!registration) {
      return NextResponse.json({ message: "Registration not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Soft delete registration
      await tx.eventRegistration.update({
        where: { id: registration.id },
        data: { deletedAt: new Date() }
      });

      // Audit Log
      await logAction({
        req,
        userId: user.id,
        instituteId: registration.instituteId,
        action: "CANCEL_REGISTER_EVENT",
        module: "EVENTS",
        entityType: "Event",
        entityId: params.id,
        description: `Cancelled registration for event: ${params.id}`
      });
    });

    return NextResponse.json({ success: true, message: "Cancelled event registration successfully" });
  } catch (error) {
    console.error("CANCEL REGISTER EVENT ERROR:", error);
    return NextResponse.json({ message: "Failed to cancel event registration", error: String(error) }, { status: 500 });
  }
}
