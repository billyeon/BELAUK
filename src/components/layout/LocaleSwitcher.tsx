"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, localeNames, type AppLocale } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label="Language"
      className="h-9 rounded-full border border-line bg-surface px-3 text-sm"
      value={locale}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as AppLocale;
        startTransition(() => router.replace(pathname, { locale: next }));
      }}
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {localeNames[l]}
        </option>
      ))}
    </select>
  );
}
