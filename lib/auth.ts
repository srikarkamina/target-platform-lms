import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "target_super_secret_key";

export function generateToken(payload: {
  id: string;
  email: string;
  role: string;
}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}