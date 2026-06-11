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

    const institute = await prisma.institute.findFirst();

    if (!institute) {
      return NextResponse.json(
        { message: "Institute not found" },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(
      "123456",
      10
    );

    const student = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: "STUDENT",
        instituteId: institute.id,
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