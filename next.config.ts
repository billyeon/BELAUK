import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co")
      .hostname;
  } catch {
    return "placeholder.supabase.co";
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/**" },
    ],
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
