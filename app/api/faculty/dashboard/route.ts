import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    totalCourses: 8,
    totalStudents: 150,
    pendingAssignments: 12,
  });
}