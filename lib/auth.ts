import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { env } from "./env";

const JWT_SECRET = env.JWT_SECRET;

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  instituteId?: string | null;
}

export function generateToken(payload: JWTPayload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function authenticateRequest(req?: Request): Promise<JWTPayload | null> {
  // 1. Try Authorization Header
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded) return decoded;
    }
  }

  // 2. Try Cookies
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) return decoded;
    }
  } catch (err) {
    // cookies() may throw in some contexts (e.g. build time or non-request contexts)
    console.error("Error reading cookies:", err);
  }

  return null;
}