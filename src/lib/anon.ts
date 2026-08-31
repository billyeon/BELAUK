import { cookies } from "next/headers";

const COOKIE = "belauk_anon";

/** Stable per-browser token so anonymous value-checks can be reclaimed after login. */
export async function getOrCreateAnonToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing) return existing;
  const token = crypto.randomUUID();
  try {
    store.set(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  } catch {
    // set() unavailable in a plain Server Component render — caller is a Route Handler.
  }
  return token;
}

export async function getAnonToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}
