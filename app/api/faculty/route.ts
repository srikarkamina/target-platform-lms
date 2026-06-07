/**
 * @swagger
 * /api/faculty:
 *   get:
 *     summary: Get all faculty
 *     responses:
 *       200:
 *         description: Faculty list
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
  try {
    const body = await req.json();

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const faculty = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: "FACULTY",
        instituteId: body.instituteId,
      },
    });

    return NextResponse.json(faculty, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to create faculty" },
      { status: 500 }
    );
  }
}