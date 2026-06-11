/**
 * @swagger
 * /api/courses/{id}/materials/{materialId}:
 *   get:
 *     summary: Get a specific material
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Material details
 *   put:
 *     summary: Update a material
 *     responses:
 *       200:
 *         description: Material updated
 *   delete:
 *     summary: Soft delete a material
 *     responses:
 *       200:
 *         description: Material deleted
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const { materialId } = await params;

    const material = await prisma.material.findUnique({
      where: {
        id: materialId,
        deletedAt: null,
      },
    });

    if (!material) {
      return NextResponse.json(
        { message: "Material not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(material);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to fetch material" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const { materialId } = await params;

    const body = await req.json();

    const { title, description, fileUrl, materialType, sortOrder } = body;

    const material = await prisma.material.update({
      where: {
        id: materialId,
      },
      data: {
        title,
        description,
        fileUrl,
        materialType: materialType || undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      },
    });

    return NextResponse.json(material);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to update material" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const { materialId } = await params;

    await prisma.material.update({
      where: {
        id: materialId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Material deleted" });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Failed to delete material" },
      { status: 500 }
    );
  }
}
