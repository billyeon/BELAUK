import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["my", "en", "zh", "ko"],
  defaultLocale: "my",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

export const localeNames: Record<AppLocale, string> = {
  my: "မြန်မာ",
  en: "English",
  zh: "中文",
  ko: "한국어",
};
