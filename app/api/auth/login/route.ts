import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth";
import { logAction } from "@/lib/services/audit-service";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      await logAction({
        req,
        userId: null,
        instituteId: "global",
        action: "LOGIN",
        module: "AUTH",
        description: `Failed login attempt: user with email ${email} not found`,
        status: "FAILURE",
      });

      return NextResponse.json(
        {
          message: "Invalid credentials",
        },
        {
          status: 401,
        }
      );
    }

    // 1. Backward compatibility mapping
    if (user.passwordHash && user.passwordHash.startsWith("NO_PASSWORD_SET_")) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: null,
          passwordSet: false,
          status: "PENDING_INVITE",
        },
      });
      user.passwordHash = null;
      user.passwordSet = false;
      user.status = "PENDING_INVITE";
    }

    // 2. Status check prior to setup/login
    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { message: "Your account has been suspended. Please contact your administrator." },
        { status: 403 }
      );
    }
    if (user.status === "DISABLED") {
      return NextResponse.json(
        { message: "Your account is disabled. Please contact support." },
        { status: 403 }
      );
    }
    if (user.status === "PENDING") {
      return NextResponse.json(
        { message: "Your account is awaiting approval." },
        { status: 403 }
      );
    }
    if (user.status === "DELETED") {
      return NextResponse.json(
        { message: "Account not found." },
        { status: 404 }
      );
    }

    // 3. First login password setup check
    const needsPasswordSetup = user.passwordHash === null || user.passwordSet === false;

    if (needsPasswordSetup) {
      // Only PENDING_INVITE or ACTIVE users without passwords can set up password
      if (user.status !== "PENDING_INVITE" && user.status !== "ACTIVE") {
        return NextResponse.json(
          { message: "Password setup is not allowed for this account status." },
          { status: 403 }
        );
      }

      if (!password || password.length < 6) {
        return NextResponse.json(
          { message: "First login requires setting a password (minimum 6 characters)." },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          passwordSet: true,
          status: "ACTIVE",
          lastLogin: new Date(),
          provider: "credentials",
        },
      });
      user.passwordHash = hashedPassword;
      user.passwordSet = true;
      user.status = "ACTIVE";
    } else {
      // Normal credentials validation
      const isValid = await bcrypt.compare(
        password,
        user.passwordHash!
      );

      if (!isValid) {
        await logAction({
          req,
          userId: user.id,
          instituteId: user.instituteId || "global",
          action: "LOGIN",
          module: "AUTH",
          description: `Failed login attempt for user ${user.email}: incorrect password`,
          status: "FAILURE",
        });

        return NextResponse.json(
          {
            message: "Invalid credentials",
          },
          {
            status: 401,
          }
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
        },
      });
    }

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    if (superAdminEmail && email === superAdminEmail) {
      if (user.role !== "SUPER_ADMIN") {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "SUPER_ADMIN" },
        });
        user.role = "SUPER_ADMIN";
      }
    }

    if (user.instituteId && user.role !== "SUPER_ADMIN") {
      const institute = await prisma.institute.findUnique({
        where: { id: user.instituteId },
        select: { status: true, isDeleted: true },
      });

      if (!institute || institute.isDeleted || institute.status === "SUSPENDED") {
        await logAction({
          req,
          userId: user.id,
          instituteId: user.instituteId,
          action: "LOGIN",
          module: "AUTH",
          description: `Failed login attempt for user ${user.email}: institute suspended or deleted`,
          status: "FAILURE",
        });

        return NextResponse.json(
          {
            message: "Your institute account is inactive or suspended. Please contact support.",
          },
          {
            status: 403,
          }
        );
      }
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      instituteId: user.instituteId,
    });

    await logAction({
      req,
      userId: user.id,
      instituteId: user.instituteId || "global",
      action: "LOGIN",
      module: "AUTH",
      description: `User ${user.email} logged in successfully`,
      status: "SUCCESS",
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Server Error",
      },
      {
        status: 500,
      }
    );
  }
}