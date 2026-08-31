import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateOtp,
  hashOtp,
  isDev,
  normalizeMmPhone,
  OTP_TTL_MS,
} from "@/lib/auth/phone";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { phone?: string };
  const e164 = body.phone ? normalizeMmPhone(body.phone) : null;
  if (!e164) return NextResponse.json({ error: "invalid_phone" }, { status: 400 });

  const code = generateOtp();
  const admin = createAdminClient();
  const { error } = await admin.from("phone_otps").insert({
    phone: e164,
    code_hash: hashOtp(e164, code),
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });
  if (error) return NextResponse.json({ error: "otp_store_failed" }, { status: 500 });

  // MVP: no SMS gateway. Log the code and (in dev) return it so the flow is testable.
  // Swap this block for a real Myanmar SMS aggregator call to go live.
  console.log(`[BELAUK] OTP for ${e164}: ${code}`);

  return NextResponse.json({
    sent: true,
    phone: e164,
    ...(isDev() ? { devCode: code } : {}),
  });
}
