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

    const isValid = await bcrypt.compare(
      password,
      user.password
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