import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { refreshSession } from "@/lib/supabase/middleware";

const intlProxy = createIntlMiddleware(routing);

// Next.js 16 renamed the `middleware` convention to `proxy` (nodejs runtime).
export async function proxy(request: NextRequest) {
  const response = intlProxy(request);
  return refreshSession(request, response);
}

export const config = {
  // `offline` is the PWA service-worker fallback route (lives outside `[locale]`),
  // so it must skip locale redirection.
  matcher: ["/((?!api|_next|_vercel|offline|.*\\..*).*)"],
};
