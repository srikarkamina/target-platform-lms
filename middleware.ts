import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  const protectedRoutes = ["/dashboard", "/admin"];

  const isProtected = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};