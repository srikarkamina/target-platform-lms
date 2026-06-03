import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const faculty = await prisma.user.findMany({
    where: {
      role: "FACULTY",
      deletedAt: null,
    },
  });

  return NextResponse.json(faculty);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const faculty = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: body.password,
      role: "FACULTY",
      instituteId: body.instituteId,
    },
  });

  return NextResponse.json(faculty, {
    status: 201,
  });
}