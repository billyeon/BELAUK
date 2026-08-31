import type { AppLocale } from "@/i18n/routing";

type AreaNames = {
  area_name_my?: string | null;
  area_name_en?: string | null;
  area_name_zh?: string | null;
  area_name_ko?: string | null;
  area_township?: string | null;
};

export function areaName(row: AreaNames, locale: AppLocale): string {
  const byLocale = {
    my: row.area_name_my,
    en: row.area_name_en,
    zh: row.area_name_zh,
    ko: row.area_name_ko,
  }[locale];
  return byLocale || row.area_name_en || row.area_township || "";
}

type CategoryNames = {
  name_my: string;
  name_en: string;
  name_zh: string;
  name_ko: string;
};

export function categoryName(row: CategoryNames, locale: AppLocale): string {
  return { my: row.name_my, en: row.name_en, zh: row.name_zh, ko: row.name_ko }[locale];
}
