import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth";
import { logAction } from "@/lib/services/audit-service";
import { env } from "@/lib/env";


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam || !code) {
      console.error("Google OAuth error parameter received:", errorParam);
      return NextResponse.redirect(
        new URL("/login?error=Google+authentication+cancelled+or+failed.", req.url)
      );
    }

    const clientId = env.GOOGLE_CLIENT_ID;
    const clientSecret = env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientId.trim() === "" || clientSecret.trim() === "") {
      console.error("Google client secrets are missing or empty in environment variables.");
      return NextResponse.redirect(
        new URL("/login?error=Google+Sign-In+is+currently+misconfigured+on+the+server.", req.url)
      );
    }

    // Print first and last 8 characters of Client ID for server-side verification without exposing full key
    const safeFirst = clientId.substring(0, 8);
    const safeLast = clientId.length > 8 ? clientId.substring(clientId.length - 8) : "";
    console.log(`GOOGLE_CLIENT_ID: ${safeFirst}...${safeLast}`);

    const nextPublicId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const safePubFirst = nextPublicId.substring(0, 8);
    const safePubLast = nextPublicId.length > 8 ? nextPublicId.substring(nextPublicId.length - 8) : "";
    console.log(`NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${safePubFirst}...${safePubLast}`);

    // Dynamically resolve protocol and host for local or staging/prod matching callback
    const protocol = req.nextUrl.protocol || "http:";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const cleanHost = host.includes("://") ? host.split("://")[1] : host;
    const redirectUri = `${protocol}//${cleanHost}/api/auth/google/callback`;

    // 1. Exchange OAuth code for Google Token Info
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Failed to exchange code with Google APIs:", tokenData);
      return NextResponse.redirect(
        new URL("/login?error=Failed+to+exchange+authorization+code+with+Google.", req.url)
      );
    }

    const { access_token } = tokenData;

    // 2. Fetch User Profile from Google API
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const profileData = await userinfoResponse.json();

    if (!userinfoResponse.ok) {
      console.error("Failed to load user profile from Google:", profileData);
      return NextResponse.redirect(
        new URL("/login?error=Failed+to+fetch+user+profile+from+Google.", req.url)
      );
    }

    const { email } = profileData;

    if (!email) {
      return NextResponse.redirect(
        new URL("/login?error=Google+account+email+could+not+be+resolved.", req.url)
      );
    }

    // 3. Authenticate User in the database
    let user = await prisma.user.findUnique({
      where: { email },
    });

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    if (superAdminEmail && email === superAdminEmail) {
      if (!user) {
        // Create user as SUPER_ADMIN
        user = await prisma.user.create({
          data: {
            name: "Srikar Kamina",
            email: superAdminEmail,
            passwordHash: null,
            passwordSet: false,
            role: "SUPER_ADMIN",
            status: "ACTIVE",
            provider: "google",
            lastLogin: new Date(),
          },
        });
      } else {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            role: "SUPER_ADMIN",
            status: "ACTIVE",
            provider: "google",
            lastLogin: new Date(),
          },
        });
      }
    } else {
      if (!user) {
        // If user does not exist, redirect to access request onboarding portal
        return NextResponse.redirect(new URL("/request-access", req.url));
      }

      // Link Google account, mark account active
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          status: "ACTIVE",
          provider: "google",
          lastLogin: new Date(),
        },
      });
    }

    // Validate User status rules
    if (user.status === "PENDING") {
      return NextResponse.redirect(
        new URL("/login?error=Your+account+is+awaiting+approval.", req.url)
      );
    }
    if (user.status === "SUSPENDED") {
      return NextResponse.redirect(
        new URL("/login?error=Your+account+has+been+suspended.+Please+contact+your+administrator.", req.url)
      );
    }
    if (user.status === "DISABLED") {
      return NextResponse.redirect(
        new URL("/login?error=Your+account+is+disabled.", req.url)
      );
    }
    if (user.status === "DELETED") {
      return NextResponse.redirect(
        new URL("/login?error=Account+not+found.", req.url)
      );
    }

    // Existing check: Verify if the user belongs to a suspended or deleted institute
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
          action: "GOOGLE_LOGIN",
          module: "AUTH",
          description: `Google Login blocked for user ${email}: institute inactive or suspended`,
          status: "FAILURE",
        });

        return NextResponse.redirect(
          new URL(
            "/login?error=Your+institute+account+is+inactive+or+suspended.+Please+contact+support.",
            req.url
          )
        );
      }
    }

    // 4. Generate standard LMS JWT token
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
      action: "GOOGLE_LOGIN",
      module: "AUTH",
      description: `User ${user.email} logged in successfully via Google OAuth`,
      status: "SUCCESS",
    });

    // Redirect the user back to the login page with the token parameter
    return NextResponse.redirect(
      new URL(`/login?token=${token}`, req.url)
    );
  } catch (error: any) {
    console.error("GOOGLE OAUTH CALLBACK ERROR:", error);
    return NextResponse.redirect(
      new URL("/login?error=An+unexpected+server+error+occurred+during+Google+login.", req.url)
    );
  }
}

