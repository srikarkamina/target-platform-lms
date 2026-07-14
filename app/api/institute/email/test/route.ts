import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getAuthorizedUser } from "@/lib/authorization";
import { testSMTPConnection } from "@/lib/services/email-service";
import { smtpSettingsSchema, testEmailSchema } from "@/lib/validations/email";
import nodemailer from "nodemailer";
import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const payload = await authenticateRequest(req);
    if (!payload) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid or missing token" },
        { status: 401 }
      );
    }

    const user = await getAuthorizedUser(payload);
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized: User not found" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Only administrators can test SMTP connections" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { smtpSettings, testEmailAddress } = body;

    // Validate settings and email address
    const settingsVal = smtpSettingsSchema.safeParse(smtpSettings);
    const emailVal = testEmailSchema.safeParse({ testEmailAddress });

    if (!settingsVal.success || !emailVal.success) {
      const errors = [
        ...(settingsVal.success ? [] : settingsVal.error.issues),
        ...(emailVal.success ? [] : emailVal.error.issues),
      ];
      return NextResponse.json(
        { message: "Validation failed", errors },
        { status: 400 }
      );
    }

    // Secure password retrieval: if the password was masked ("••••••••"), we fetch the existing password from database
    const finalSettings = { ...settingsVal.data };
    if (finalSettings.smtpPassword === "••••••••" || !finalSettings.smtpPassword) {
      const existingSettings = await prisma.instituteSettings.findUnique({
        where: { instituteId: user.instituteId || "global" },
      });
      if (existingSettings && existingSettings.smtpPassword) {
        finalSettings.smtpPassword = existingSettings.smtpPassword; // remains encrypted, which createTransporter expects
      } else {
        return NextResponse.json(
          { message: "SMTP Password is required but was not found in the database" },
          { status: 400 }
        );
      }
    } else {
      // In input settings from UI, password is plain text, so we encrypt it for createTransporter compatibility (which calls decrypt)
      const { encrypt } = await import("@/lib/crypto");
      finalSettings.smtpPassword = encrypt(finalSettings.smtpPassword);
    }

    // Verify SMTP connection
    await testSMTPConnection(finalSettings);

    // Send the test email
    const isSecure = finalSettings.smtpEncryption === "SSL";
    const transportConfig: any = {
      host: finalSettings.smtpHost,
      port: finalSettings.smtpPort || 587,
      secure: isSecure,
      auth: {
        user: finalSettings.smtpUsername,
        pass: decrypt(finalSettings.smtpPassword || ""),
      },
      connectionTimeout: 10000,
    };
    if (finalSettings.smtpEncryption === "TLS") {
      transportConfig.requireTLS = true;
    }

    const transporter = nodemailer.createTransport(transportConfig);
    const mailOptions = {
      from: `"${finalSettings.smtpSenderName || "Target LMS Test"}" <${finalSettings.smtpSenderEmail || finalSettings.smtpUsername}>`,
      to: testEmailAddress,
      subject: "Target LMS SMTP Test Connection Successful",
      text: "Congratulations! Your SMTP settings are correctly configured and working.",
      replyTo: finalSettings.smtpReplyTo || undefined,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "SMTP connection verified and test email sent successfully." });
  } catch (error: any) {
    console.error("SMTP TEST ERROR:", error);
    return NextResponse.json(
      { message: "SMTP Connection Test Failed", error: error.message || String(error) },
      { status: 500 }
    );
  }
}
