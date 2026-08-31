"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { formatMMK, parseMMK } from "@/lib/format/money";
import { basisFromRange, describeBasis } from "@/lib/pricing/basis-view";
import type { AppLocale } from "@/i18n/routing";
import type { PriceRange } from "@/lib/pricing/range";

const helpKey: Record<PriceRange["verdict"], string> = {
  high: "helpHigh",
  low: "helpLow",
  within_range: "helpWithin",
  insufficient_data: "helpInsufficient",
};

export function PriceRangeReview({
  checkId,
  productId,
  initialPrice,
}: {
  checkId: string;
  productId: string;
  initialPrice: number;
}) {
  const t = useTranslations();
  const locale = useLocale() as AppLocale;
  const router = useRouter();

  const [price, setPrice] = useState(initialPrice ? String(initialPrice) : "");
  const [range, setRange] = useState<PriceRange | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseMMK(price);
    if (!parsed) {
      setError(t("auth.invalidPhone"));
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/pricing/range", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, price: parsed }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(t("common.retry"));
      return;
    }
    setRange(data.range as PriceRange);
  }

  const hasRange = range && range.priceP25 != null && range.priceP75 != null;
  const basis = range
    ? describeBasis(
        basisFromRange(range.basis),
        t as unknown as (k: string, v?: Record<string, string | number>) => string,
        locale,
      )
    : null;

  return (
    <div className="space-y-5">
      <form onSubmit={check} className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium">{t("sell.desiredPrice")}</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-12 w-full rounded-xl border border-line bg-surface px-3 text-lg font-semibold"
            />
            <span className="text-sm text-muted">{t("common.mmk")}</span>
          </div>
        </label>
        {error && <p className="text-sm text-warn">{error}</p>}
        <Button type="submit" variant="secondary" disabled={busy}>
          {busy ? t("sell.checking") : range ? t("sell.reviewAgain") : t("sell.checkPrice")}
        </Button>
      </form>

      {range && (
        <div className="rounded-[var(--radius-belauk)] border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{t("price.rangeLabel")}</span>
            <VerdictBadge verdict={range.verdict} />
          </div>
          {hasRange ? (
            <div className="mt-3 grid grid-cols-3 divide-x divide-line text-center text-sm">
              <div className="px-1">
                <p className="text-[11px] text-muted">{t("price.rangeLabel")}</p>
                <p className="mt-1 font-bold text-accent-dark">
                  {formatMMK(range.priceP25, locale)}–{formatMMK(range.priceP75, locale)}
                </p>
              </div>
              <div className="px-1">
                <p className="text-[11px] text-muted">{t("price.medianLabel")}</p>
                <p className="mt-1 font-bold">{formatMMK(range.priceMedian, locale)}</p>
              </div>
              <div className="px-1">
                <p className="text-[11px] text-muted">{t("home.statSamples")}</p>
                <p className="mt-1 font-bold">{range.sampleSize}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 rounded-lg bg-line/50 px-3 py-2 text-xs text-muted">
              {t("common.dataLow")}
            </p>
          )}
          <p className="mt-3 text-xs text-muted">{t(`price.${helpKey[range.verdict]}`)}</p>

          {basis && (
            <p className="mt-2 border-t border-line pt-2 text-[11px] leading-relaxed text-muted">
              {basis.text}
              {basis.sourceUrl && (
                <>
                  {" · "}
                  <a
                    href={basis.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {t("price.source")}
                  </a>
                </>
              )}
            </p>
          )}
        </div>
      )}

      <Button
        size="lg"
        disabled={!range}
        onClick={() => router.push(`/sell/${checkId}/preview`)}
      >
        {t("common.next")}
      </Button>
    </div>
  );
}
