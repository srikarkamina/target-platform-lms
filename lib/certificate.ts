import crypto from "crypto";

/**
 * Generates a unique, human-readable certificate number.
 * Format: CERT-YYYY-XXXXXX (e.g., CERT-2026-000001)
 *
 * @param indexSequenceNumber - The database index or auto-incrementing serial number.
 */
export function generateCertificateNumber(indexSequenceNumber: number): string {
  const year = new Date().getFullYear();
  const paddedIndex = String(indexSequenceNumber).padStart(6, "0");
  return `CERT-${year}-${paddedIndex}`;
}

/**
 * Generates a short unique alphanumeric uppercase code for verification quick lookup.
 * Length: 10 characters (collision-safe & easy to read/type).
 */
export function generateCertificateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(10);
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Generates a secure, high-entropy verification token (64-character hex).
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
