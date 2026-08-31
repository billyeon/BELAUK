import type { Json } from "@/types/db";
import type { PriceBasis } from "./range";

/** Normalised, display-ready view of how a price range was computed. */
export type BasisView = {
  method: "internal" | "msrp_depreciation" | "blended";
  msrpMmk: number | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  asOf: string | null;
  depreciationPct: number | null;
  ageMonths: number | null;
  ageAssumed: boolean;
  condition: string | null;
  internalSamples: number;
  /** brand+model were known but no new price could be found */
  triedMsrpMissed: boolean;
};

export function basisFromRange(b: PriceBasis): BasisView {
  return {
    method: b.method,
    msrpMmk: b.msrpMmk,
    sourceUrl: b.msrpSourceUrl,
    sourceTitle: b.msrpSourceTitle,
    asOf: b.msrpAsOf,
    depreciationPct: b.depreciationPct,
    ageMonths: b.ageMonths,
    ageAssumed: b.ageAssumed,
    condition: b.conditionApplied,
    internalSamples: b.internalSamples,
    triedMsrpMissed:
      b.msrpMmk == null && (b.msrpOrigin === "web" || b.msrpOrigin === "cache"),
  };
}

/** Parse a stored `market_comparisons.computed_from` blob. Returns null for old rows. */
export function basisFromComputedFrom(cf: Json | null | undefined): BasisView | null {
  if (!cf || typeof cf !== "object" || Array.isArray(cf)) return null;
  const o = cf as Record<string, unknown>;
  if (!o.method) return null;
  const msrp = (o.msrp ?? null) as Record<string, unknown> | null;
  const depr = (o.depreciation ?? null) as Record<string, unknown> | null;
  const msrpMmk =
    msrp && typeof msrp.amount_mmk === "number" ? (msrp.amount_mmk as number) : null;
  return {
    method: o.method as BasisView["method"],
    msrpMmk,
    sourceUrl: (msrp?.source_url as string) ?? null,
    sourceTitle: (msrp?.source_title as string) ?? null,
    asOf: (msrp?.as_of as string) ?? null,
    depreciationPct: depr && typeof depr.total_pct === "number" ? (depr.total_pct as number) : null,
    ageMonths: depr && typeof depr.age_months === "number" ? (depr.age_months as number) : null,
    ageAssumed: Boolean(depr?.age_assumed),
    condition: (depr?.condition as string) ?? null,
    internalSamples: typeof o.internal_samples === "number" ? (o.internal_samples as number) : 0,
    triedMsrpMissed:
      msrpMmk == null &&
      (((msrp?.origin as string) ?? "") === "web" || ((msrp?.origin as string) ?? "") === "cache"),
  };
}

type Translator = (key: string, values?: Record<string, string | number>) => string;

/** One-line human explanation of the price basis, or null if there is nothing to say. */
export function describeBasis(
  view: BasisView | null,
  t: Translator,
  locale: string,
): { text: string; sourceUrl: string | null } | null {
  if (!view) return null;
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale === "my" ? "en-US" : locale).format(Math.round(n));

  if ((view.method === "msrp_depreciation" || view.method === "blended") && view.msrpMmk) {
    const parts: string[] = [t("price.basisMsrpPrefix", { msrp: fmt(view.msrpMmk) })];
    if (view.ageAssumed || view.ageMonths == null) {
      parts.push(t("price.ageUnknown"));
    } else if (view.ageMonths >= 12) {
      parts.push(t("price.ageYears", { years: Math.round(view.ageMonths / 12) }));
    } else {
      parts.push(t("price.ageMonths", { months: view.ageMonths }));
    }
    if (view.condition) {
      parts.push(t("price.basisCondition", { condition: t(`condition.${view.condition}`) }));
    }
    let text = parts.join(" · ");
    if (view.depreciationPct != null) {
      text += " → " + t("price.basisDepr", { pct: Math.round(view.depreciationPct * 100) });
    }
    if (view.method === "blended" && view.internalSamples > 0) {
      text += " · " + t("price.basisInternal", { samples: view.internalSamples });
    }
    return { text, sourceUrl: view.sourceUrl };
  }

  if (view.triedMsrpMissed) {
    return { text: t("price.basisNoMsrp"), sourceUrl: null };
  }

  return null;
}
