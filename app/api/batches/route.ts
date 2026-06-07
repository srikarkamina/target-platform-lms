import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        course: true,
      },
    });

    return NextResponse.json(batches);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      startDate,
      endDate,
      courseId,
    } = body;

    const batch = await prisma.batch.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        courseId,
      },
    });

    return NextResponse.json(batch, {
      status: 201,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to create batch" },
      { status: 500 }
    );
  }
}