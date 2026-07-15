import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logAction } from "@/lib/services/audit-service";
import { env } from "@/lib/env";

const JWT_SECRET = env.JWT_SECRET;

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp || otp.length !== 6) {
      return NextResponse.json(
        { message: "Please provide a valid email and 6-digit code." },
        { status: 400 }
      );
    }

    const otpRecord = await prisma.otp.findUnique({
      where: { email },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { message: "Verification code is invalid or has expired." },
        { status: 400 }
      );
    }

    // Verify expiration (10 minutes)
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await prisma.otp.delete({ where: { email } });
      return NextResponse.json(
        { message: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Enforce max 5 verification attempts to prevent brute force
    if (otpRecord.attempts >= 5) {
      await prisma.otp.delete({ where: { email } });
      return NextResponse.json(
        { message: "Too many failed attempts. Please request a new code." },
        { status: 400 }
      );
    }

    // Check code match
    const isCodeValid = await bcrypt.compare(otp, otpRecord.hash);

    if (!isCodeValid) {
      // Increment attempt count
      await prisma.otp.update({
        where: { email },
        data: {
          attempts: { increment: 1 },
        },
      });

      return NextResponse.json(
        { message: "Invalid verification code." },
        { status: 400 }
      );
    }

    // Delete the OTP immediately after successful verification
    await prisma.otp.delete({
      where: { email },
    });

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Create a secure, short-lived reset token (expires in 5 minutes)
    const resetToken = jwt.sign(
      { email, purpose: "reset-password" },
      JWT_SECRET,
      { expiresIn: "5m" }
    );

    await logAction({
      req,
      userId: user?.id || null,
      instituteId: user?.instituteId || "global",
      action: "VERIFY_PASSWORD_RESET_OTP",
      module: "AUTH",
      description: `OTP successfully verified for user ${email}`,
      status: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      token: resetToken,
    });
  } catch (error: any) {
    console.error("VERIFY OTP ERROR:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
