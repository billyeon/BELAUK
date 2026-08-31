import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  derivePassword,
  hashOtp,
  normalizeMmPhone,
  phoneEmail,
} from "@/lib/auth/phone";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    phone?: string;
    code?: string;
  };
  const e164 = body.phone ? normalizeMmPhone(body.phone) : null;
  const code = body.code?.replace(/\D/g, "");
  if (!e164 || !code || code.length !== 6) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: otp } = await admin
    .from("phone_otps")
    .select("*")
    .eq("phone", e164)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    !otp ||
    new Date(otp.expires_at).getTime() < Date.now() ||
    otp.code_hash !== hashOtp(e164, code)
  ) {
    if (otp) await admin.from("phone_otps").update({ attempts: otp.attempts + 1 }).eq("id", otp.id);
    return NextResponse.json({ error: "invalid_code" }, { status: 401 });
  }
  await admin.from("phone_otps").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);

  const email = phoneEmail(e164);
  const password = derivePassword(e164);

  // Find or create the backing Supabase user.
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  let user = list?.users.find((u) => u.email === email || u.phone === e164.replace("+", ""));

  if (!user) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone: e164.replace("+", ""),
      phone_confirm: true,
    });
    if (createErr || !created.user) {
      return NextResponse.json({ error: "user_create_failed" }, { status: 500 });
    }
    user = created.user;
  } else {
    // Ensure the password matches our deterministic derivation.
    await admin.auth.admin.updateUserById(user.id, { password });
  }

  // Give new users a non-empty display name so their listings aren't blank.
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  await admin
    .from("profiles")
    .update({
      phone: e164,
      display_name: existingProfile?.display_name || `09***${e164.slice(-4)}`,
    })
    .eq("id", user.id);

  // Establish a real session on the request-scoped (cookie-bound) client.
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) {
    return NextResponse.json({ error: "sign_in_failed", detail: signInErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
