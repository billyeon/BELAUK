import "server-only";
import { createHmac, randomInt, createHash } from "node:crypto";

/** Normalise a Myanmar phone number to E.164 (+95…). Accepts 09…, 959…, +959…. */
export function normalizeMmPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  let local: string;
  if (digits.startsWith("95")) local = digits.slice(2);
  else if (digits.startsWith("0")) local = digits.slice(1);
  else local = digits;
  if (local.length < 7 || local.length > 10) return null;
  return `+95${local}`;
}

/** Deterministic password so we can re-sign-in a phone user without SMS. */
export function derivePassword(e164: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "belauk-dev-secret";
  return createHmac("sha256", secret).update(`belauk:${e164}`).digest("hex");
}

/** Email alias used to back the phone account with Supabase's default email+password auth. */
export function phoneEmail(e164: string): string {
  return `${e164.replace("+", "")}@phone.belauk.local`;
}

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashOtp(phone: string, code: string): string {
  return createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

export const OTP_TTL_MS = 5 * 60 * 1000;

export function isDev(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV !== "production";
}
