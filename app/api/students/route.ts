import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      deletedAt: null,
    },
  });

  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const student = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: body.password,
      role: "STUDENT",
      instituteId: body.instituteId,
    },
  });

  return NextResponse.json(student, {
    status: 201,
  });
}