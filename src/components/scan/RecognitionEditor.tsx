"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { CONDITIONS } from "@/lib/ai/schema";
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

export function RecognitionEditor({
  checkId,
  initial,
  categories,
  missingShots,
}: {
  checkId: string;
  initial: {
    categorySlug: string | null;
    brand: string | null;
    model: string | null;
    condition: string | null;
    attributes: Record<string, string>;
  };
  categories: Category[];
  missingShots: string[];
}) {
  const t = useTranslations("scan");
  const tc = useTranslations("common");
  const tcond = useTranslations("condition");
  const locale = useLocale() as AppLocale;
  const router = useRouter();

  const leafCategories = categories.filter((c) => c.parent_id);
  const [categorySlug, setCategorySlug] = useState(initial.categorySlug ?? "");
  const [brand, setBrand] = useState(initial.brand ?? "");
  const [model, setModel] = useState(initial.model ?? "");
  const [condition, setCondition] = useState(initial.condition ?? "good");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/scan/review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ checkId, categorySlug, brand, model, condition }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(tc("retry"));
      return;
    }
    router.push(`/scan/${checkId}/result`);
  }

  const field = "mt-1 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm";

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">{t("fieldCategory")}</span>
        <select className={field} value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)}>
          <option value="">—</option>
          {leafCategories.map((c) => (
            <option key={c.id} value={c.slug}>
              {categoryName(c, locale)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">{t("fieldBrand")}</span>
        <input className={field} value={brand} onChange={(e) => setBrand(e.target.value)} />
      </label>

      <label className="block">
        <span className="text-sm font-medium">{t("fieldModel")}</span>
        <input className={field} value={model} onChange={(e) => setModel(e.target.value)} />
      </label>

      <label className="block">
        <span className="text-sm font-medium">{t("fieldCondition")}</span>
        <select className={field} value={condition} onChange={(e) => setCondition(e.target.value)}>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {tcond(c)}
            </option>
          ))}
        </select>
      </label>

      {Object.keys(initial.attributes).length > 0 && (
        <ul className="rounded-xl bg-line/40 p-3 text-xs text-muted">
          {Object.entries(initial.attributes).map(([k, v]) => (
            <li key={k}>
              <span className="font-medium text-ink">{k}:</span> {v}
            </li>
          ))}
        </ul>
      )}

      {missingShots.length > 0 && (
        <div className="rounded-xl border border-accent-soft bg-accent-soft p-3">
          <p className="text-xs font-bold text-accent-dark">{t("missingShotsTitle")}</p>
          <ul className="mt-1 list-disc pl-4 text-xs text-accent-dark">
            {missingShots.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="text-sm text-warn">{error}</p>}

      <Button type="submit" size="lg" disabled={busy}>
        {busy ? tc("loading") : t("seeResult")}
      </Button>
    </form>
  );
}
