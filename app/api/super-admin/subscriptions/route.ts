import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";

export async function GET(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthorizedUser(payload);
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const planCode = searchParams.get("planCode") || "";

    const where: any = {
      institute: {
        isDeleted: false,
      },
    };

    if (search) {
      where.institute = {
        isDeleted: false,
        name: { contains: search, mode: "insensitive" },
      };
    }

    if (status) {
      where.status = status;
    }

    if (planCode) {
      where.plan = {
        code: planCode,
      };
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        plan: true,
        institute: {
          select: {
            name: true,
            logo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("[GET SUPER ADMIN SUBSCRIPTIONS ERROR]", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
