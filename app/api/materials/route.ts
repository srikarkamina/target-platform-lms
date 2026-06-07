/**
 * @swagger
 * /api/materials:
 *   get:
 *     summary: Get all materials
 *     responses:
 *       200:
 *         description: Materials list
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json([
    {
      id: 1,
      title: "Java Notes",
      fileUrl: "/materials/java.pdf",
    },
    {
      id: 2,
      title: "DSA Notes",
      fileUrl: "/materials/dsa.pdf",
    },
  ]);
}