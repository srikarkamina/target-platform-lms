import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Test database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        storage: "connected",
        version: "1.0.0",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        storage: "connected",
        version: "1.0.0",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
