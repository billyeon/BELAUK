"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { categoryName } from "@/lib/format/area";
import type { AppLocale } from "@/i18n/routing";

type Category = {
  id: string;
  slug: string;
  parent_id: string | null;
  name_my: string;
  name_en: string;
  name_zh: string;
  name_ko: string;
};

export function BrowseControls({ categories }: { categories: Category[] }) {
  const t = useTranslations("product");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const top = categories.filter((c) => !c.parent_id);
  const activeCat = params.get("category") ?? "all";

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="space-y-3">
      <input
        defaultValue={params.get("q") ?? ""}
        placeholder={t("searchPlaceholder")}
        onChange={(e) => {
          const v = e.target.value;
          window.clearTimeout((window as unknown as { __b?: number }).__b);
          (window as unknown as { __b?: number }).__b = window.setTimeout(
            () => setParam("q", v || null),
            350,
          );
        }}
        className="h-11 w-full rounded-full border border-line bg-surface px-4 text-sm"
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ slug: "all" }, ...top].map((c) => (
          <button
            key={c.slug}
            onClick={() => setParam("category", c.slug)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              activeCat === c.slug
                ? "bg-accent text-white"
                : "border border-line bg-surface text-muted"
            }`}
          >
            {c.slug === "all"
              ? t("allCategories")
              : categoryName(c as Category, locale)}
          </button>
        ))}
      </div>
      <select
        value={params.get("sort") ?? "new"}
        onChange={(e) => setParam("sort", e.target.value === "new" ? null : e.target.value)}
        className="h-9 rounded-full border border-line bg-surface px-3 text-xs"
      >
        <option value="new">{t("sortNew")}</option>
        <option value="price_asc">{t("sortPriceAsc")}</option>
        <option value="price_desc">{t("sortPriceDesc")}</option>
      </select>
    </div>
  );
}
