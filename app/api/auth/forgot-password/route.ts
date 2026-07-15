import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAction } from "@/lib/services/audit-service";
import { sendEmail, getOtpEmailHtml } from "@/lib/services/resend";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Never reveal whether a user account exists or not
    const genericSuccessResponse = NextResponse.json({
      message: "If the email is registered, a verification code has been sent.",
    });

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await logAction({
        req,
        userId: null,
        instituteId: "global",
        action: "REQUEST_PASSWORD_RESET",
        module: "AUTH",
        description: `Password reset requested for unregistered email: ${email}`,
        status: "FAILURE",
      });
      return genericSuccessResponse;
    }

    // Rate Limiting & Isolation checks: Allow only one active OTP at a time
    const existingOtp = await prisma.otp.findUnique({
      where: { email },
    });

    // Check if the user is requesting too frequently (e.g. within 60 seconds)
    if (existingOtp) {
      const timeDifference = Date.now() - new Date(existingOtp.createdAt).getTime();
      if (timeDifference < 60000) {
        return NextResponse.json(
          { message: "Too many requests. Please wait 60 seconds before requesting another code." },
          { status: 429 }
        );
      }
    }

    // Generate a secure 6-digit verification code
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Persist hashed OTP securely
    await prisma.otp.upsert({
      where: { email },
      update: {
        hash: otpHash,
        attempts: 0,
        expiresAt,
        createdAt: new Date(),
      },
      create: {
        email,
        hash: otpHash,
        expiresAt,
        createdAt: new Date(),
      },
    });

    // Send email using Resend
    const html = getOtpEmailHtml(rawOtp, 10);
    await sendEmail({
      to: email,
      subject: "Target LMS - Password Reset Code",
      html,
    });

    await logAction({
      req,
      userId: user.id,
      instituteId: user.instituteId || "global",
      action: "REQUEST_PASSWORD_RESET",
      module: "AUTH",
      description: `Verification code generated and emailed to user ${email}`,
      status: "SUCCESS",
    });

    return genericSuccessResponse;
  } catch (error: any) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
