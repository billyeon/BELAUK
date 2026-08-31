// BELAUK — Supabase Auth "Send SMS" hook (Edge Function).
//
// STATUS: not wired up in MVP-A. Phone login currently runs through the app's
// own OTP endpoints (/api/auth/request-otp + /api/auth/verify-otp) so no SMS
// gateway is required for local development.
//
// TO GO LIVE with real SMS:
//   1. Replace the body of `deliver()` with a call to a Myanmar SMS aggregator.
//   2. Deploy:  supabase functions deploy send-sms-hook
//   3. Enable it: Dashboard → Authentication → Hooks → Send SMS → this function.
//   4. Switch the client to Supabase-native phone OTP
//      (supabase.auth.signInWithOtp({ phone }) / verifyOtp) and delete the
//      custom /api/auth/* routes.

interface SendSmsPayload {
  user: { phone: string };
  sms: { otp: string };
}

async function deliver(phone: string, otp: string): Promise<void> {
  // MVP placeholder: log only. Swap for a real provider request, e.g.:
  //   await fetch("https://<aggregator>/send", {
  //     method: "POST",
  //     headers: { Authorization: `Bearer ${Deno.env.get("SMS_API_KEY")}` },
  //     body: JSON.stringify({ to: phone, text: `BELAUK code: ${otp}` }),
  //   });
  console.log(`[send-sms-hook] would send OTP ${otp} to ${phone}`);
}

Deno.serve(async (req) => {
  const payload = (await req.json()) as SendSmsPayload;
  await deliver(payload.user.phone, payload.sms.otp);
  return new Response(JSON.stringify({}), {
    headers: { "Content-Type": "application/json" },
  });
});
