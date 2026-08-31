import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Noto_Sans, Noto_Sans_Myanmar } from "next/font/google";
import { routing } from "@/i18n/routing";
import { BottomNav } from "@/components/layout/BottomNav";
import { RegisterSW } from "@/components/pwa/RegisterSW";

const noto = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto",
  display: "swap",
});
const notoMyanmar = Noto_Sans_Myanmar({
  subsets: ["myanmar"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-mm",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "BELAUK",
  title: { default: "BELAUK", template: "%s · BELAUK" },
  description: "Show it. See what it's worth. — Myanmar's value-first marketplace.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "BELAUK" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#169b8c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${noto.variable} ${notoMyanmar.variable}`}>
      <body>
        <NextIntlClientProvider>
          <div className="app-shell">{children}</div>
          <BottomNav />
          <RegisterSW />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
