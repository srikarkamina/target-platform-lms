import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { logAction } from "@/lib/services/audit-service";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    const institute = await prisma.institute.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!institute) {
      return NextResponse.json({ message: "Institute not found" }, { status: 404 });
    }

    if (institute.status === "ACTIVE") {
      return NextResponse.json({ message: "Institute is already active" }, { status: 400 });
    }

    const updated = await prisma.institute.update({
      where: { id },
      data: {
        status: "ACTIVE",
        suspendedAt: null,
        suspendedBy: null,
      },
    });

    await logAction({
      req,
      userId: user.id,
      instituteId: id,
      action: "ACTIVATE",
      module: "SUPER_ADMIN",
      entityType: "Institute",
      entityId: id,
      description: `Institute activated: ${institute.name}`,
      oldValues: institute,
      newValues: updated,
      status: "SUCCESS",
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[SUPER ADMIN INSTITUTE ACTIVATE POST]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
