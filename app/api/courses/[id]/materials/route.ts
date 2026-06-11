/**
 * @swagger
 * /api/courses/{id}/materials:
 *   get:
 *     summary: Get all study materials for a course
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of materials for the course
 *   post:
 *     summary: Create a new material for a course
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Material created
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const materials = await prisma.material.findMany({
      where: {
        courseId: id,
        deletedAt: null,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const { title, description, fileUrl, materialType, sortOrder } = body;

    const material = await prisma.material.create({
      data: {
        title,
        description,
        fileUrl,
        materialType: materialType || "PDF",
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        courseId: id,
      },
    });

    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to create material" },
      { status: 500 }
    );
  }
}
