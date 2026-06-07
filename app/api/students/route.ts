import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        deletedAt: null,
      },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("STUDENT GET ERROR:", error);

    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const student = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: "STUDENT",
        instituteId: body.instituteId,
      },
    });

    return NextResponse.json(student, {
      status: 201,
    });
  } catch (error) {
    console.error("STUDENT POST ERROR:", error);

    return NextResponse.json(
      { message: "Failed to create student" },
      { status: 500 }
    );
  }
}