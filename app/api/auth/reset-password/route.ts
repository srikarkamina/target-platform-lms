import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logAction } from "@/lib/services/audit-service";
import { env } from "@/lib/env";

const JWT_SECRET = env.JWT_SECRET;

interface ResetTokenPayload {
  email: string;
  purpose: string;
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: "Invalid payload parameters." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    let decoded: ResetTokenPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as ResetTokenPayload;
      if (decoded.purpose !== "reset-password") {
        throw new Error("Invalid token scope");
      }
    } catch {
      return NextResponse.json(
        { message: "The reset session has expired or is invalid. Please request a new code." },
        { status: 401 }
      );
    }

    const { email } = decoded;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User account no longer exists." },
        { status: 404 }
      );
    }

    // Hash the new password using the existing password hashing strategy (bcrypt with 10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash: hashedPassword,
        passwordSet: true,
        status: "ACTIVE",
      },
    });

    await logAction({
      req,
      userId: user.id,
      instituteId: user.instituteId || "global",
      action: "RESET_PASSWORD",
      module: "AUTH",
      description: `Password reset successfully completed for user ${email}`,
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error: any) {
    console.error("RESET PASSWORD ERROR:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
