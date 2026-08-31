import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums, Json } from "@/types/db";
import { getMsrp, type MsrpInfo } from "./msrp";
import { estimateFromMsrp, parseAgeMonths, type DepreciationResult } from "./depreciation";

export type PriceBasis = {
  method: "internal" | "msrp_depreciation" | "blended";
  internalSamples: number;
  msrpMmk: number | null;
  msrpSourceUrl: string | null;
  msrpSourceTitle: string | null;
  msrpAsOf: string | null;
  msrpOrigin: MsrpInfo["origin"] | null;
  estimateMmk: number | null;
  depreciationPct: number | null;
  ageMonths: number | null;
  ageAssumed: boolean;
  conditionApplied: Enums<"product_condition"> | null;
};

export type PriceRange = {
  sampleSize: number;
  priceMin: number | null;
  priceP25: number | null;
  priceMedian: number | null;
  priceP75: number | null;
  priceMax: number | null;
  dataSufficiency: Enums<"data_sufficiency">;
  verdict: Enums<"price_verdict">;
  basis: PriceBasis;
};

type RangeInput = {
  categoryId: string | null;
  categorySlug?: string | null;
  brand?: string | null;
  model?: string | null;
  condition?: Enums<"product_condition"> | null;
  /** free text like "6개월", "1년" — parsed to months */
  purchasePeriod?: string | null;
  ageMonths?: number | null;
  attributes?: Record<string, string> | null;
  damageText?: string | null;
  desiredPrice: number | null;
  country?: string;
  /** allow a fresh web search for the new price (default: cache-only) */
  web?: boolean;
};

const clamp = (n: number) => Math.max(0, Math.round(n / 1000) * 1000);

function verdictFor(
  desired: number | null,
  p25: number | null,
  p75: number | null,
  sufficiency: Enums<"data_sufficiency">,
): Enums<"price_verdict"> {
  if (p25 == null || p75 == null || sufficiency === "none") return "insufficient_data";
  if (desired == null) return "within_range";
  if (desired < p25) return "low";
  if (desired > p75) return "high";
  return "within_range";
}

/** Runs get_price_range, folds in an MSRP-depreciation estimate, appends a snapshot. */
export async function reviewPrice(
  input: RangeInput,
  link: { valueCheckId?: string | null; productId?: string | null },
): Promise<PriceRange> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("get_price_range", {
    p_category_id: input.categoryId ?? (null as unknown as string),
    p_brand: input.brand ?? undefined,
    p_model: input.model ?? undefined,
    p_country: input.country ?? "MM",
    p_desired: input.desiredPrice ?? undefined,
  });
  if (error) throw new Error(`get_price_range failed: ${error.message}`);

  const row = data?.[0];
  const internalN = row?.sample_size ?? 0;
  const internal = {
    p25: row?.price_p25 ?? null,
    median: row?.price_median ?? null,
    p75: row?.price_p75 ?? null,
    min: row?.price_min ?? null,
    max: row?.price_max ?? null,
  };

  // --- MSRP → depreciation estimate ------------------------------------------
  let msrp: MsrpInfo = {
    found: false,
    msrpMmk: null,
    sourceCurrency: null,
    sourceAmount: null,
    fxRate: null,
    sourceUrl: null,
    sourceTitle: null,
    asOf: null,
    note: null,
    origin: null as unknown as MsrpInfo["origin"],
  };
  let depr: DepreciationResult | null = null;
  let ageIsSellerGiven = false;

  const canLookup = Boolean(input.brand && input.model);
  if (canLookup) {
    try {
      if (input.web) {
        msrp = await getMsrp({
          brand: input.brand ?? null,
          model: input.model ?? null,
          categorySlug: input.categorySlug ?? null,
          attributes: input.attributes ?? undefined,
        });
      } else {
        msrp = await msrpFromCacheOnly(admin, input.brand ?? null, input.model ?? null);
      }
    } catch (e) {
      console.error("MSRP lookup skipped:", e instanceof Error ? e.message : e);
    }
  }

  if (msrp.found && msrp.msrpMmk) {
    // Age priority: explicit months → seller's purchase period → time since the
    // product's launch (a used unit can't predate its own release).
    const sellerAge = input.ageMonths ?? parseAgeMonths(input.purchasePeriod ?? null);
    const launchAge = parseAgeMonths(msrp.asOf ?? null);
    const ageMonths = sellerAge ?? launchAge;
    ageIsSellerGiven = sellerAge != null;
    const damageText = [
      input.damageText,
      input.attributes ? Object.values(input.attributes).join(" ") : null,
    ]
      .filter(Boolean)
      .join(" ");
    depr = estimateFromMsrp({
      msrpMmk: msrp.msrpMmk,
      ageMonths: ageMonths ?? null,
      condition: input.condition ?? null,
      categorySlug: input.categorySlug ?? null,
      damageText: damageText || undefined,
    });
  }

  // --- Blend ----------------------------------------------------------------
  let p25 = internal.p25;
  let median = internal.median;
  let p75 = internal.p75;
  let min = internal.min;
  let max = internal.max;
  let sufficiency: Enums<"data_sufficiency"> =
    internalN >= 15 ? "sufficient" : internalN >= 5 ? "low" : "none";
  let method: PriceBasis["method"] = "internal";

  if (depr) {
    const spread = ageIsSellerGiven ? 0.18 : 0.28;
    const estLo = clamp(depr.estimateMmk * (1 - spread));
    const estHi = clamp(depr.estimateMmk * (1 + spread));
    const estMid = clamp(depr.estimateMmk);

    if (internalN >= 5 && internal.p25 != null && internal.p75 != null) {
      // Guard: a stray web price must not blow up the range. Clamp the estimate
      // band to [0.3x, 3x] of our own median before blending.
      const im = internal.median ?? internal.p25;
      const g = (v: number) => Math.min(Math.max(v, im * 0.3), im * 3);
      const eLo = g(estLo);
      const eMid = g(estMid);
      const eHi = g(estHi);

      // blend percentiles; lean harder on our own sales when the seller's age is a guess
      const w = ageIsSellerGiven ? 0.7 : 0.8;
      p25 = clamp(w * internal.p25 + (1 - w) * eLo);
      median = clamp(w * im + (1 - w) * eMid);
      p75 = clamp(w * internal.p75 + (1 - w) * eHi);
      min = Math.min(internal.min ?? p25, p25);
      max = Math.max(internal.max ?? p75, p75);
      method = "blended";
      // sufficiency unchanged (internal drives it)
    } else {
      // little/no internal data → estimate carries the range
      p25 = estLo;
      median = estMid;
      p75 = estHi;
      min = estLo;
      max = estHi;
      sufficiency = "low";
      method = internalN > 0 ? "blended" : "msrp_depreciation";
    }
  }

  const verdict = verdictFor(input.desiredPrice, p25, p75, sufficiency);

  const basis: PriceBasis = {
    method,
    internalSamples: internalN,
    msrpMmk: msrp.found ? msrp.msrpMmk : null,
    msrpSourceUrl: msrp.sourceUrl,
    msrpSourceTitle: msrp.sourceTitle,
    msrpAsOf: msrp.asOf,
    msrpOrigin: msrp.origin ?? null,
    estimateMmk: depr?.estimateMmk ?? null,
    depreciationPct: depr ? Number(depr.totalDepreciation.toFixed(2)) : null,
    ageMonths: depr && ageIsSellerGiven ? depr.ageMonths : null,
    ageAssumed: depr ? !ageIsSellerGiven : false,
    conditionApplied: depr ? input.condition ?? null : null,
  };

  const range: PriceRange = {
    sampleSize: internalN,
    priceMin: min,
    priceP25: p25,
    priceMedian: median,
    priceP75: p75,
    priceMax: max,
    dataSufficiency: sufficiency,
    verdict,
    basis,
  };

  const { error: insErr } = await admin.from("market_comparisons").insert({
    value_check_id: link.valueCheckId ?? null,
    product_id: link.productId ?? null,
    target_category_id: input.categoryId,
    target_brand: input.brand ?? null,
    target_model: input.model ?? null,
    sample_size: range.sampleSize,
    price_min: range.priceMin,
    price_p25: range.priceP25,
    price_median: range.priceMedian,
    price_p75: range.priceP75,
    price_max: range.priceMax,
    data_sufficiency: range.dataSufficiency,
    verdict: range.verdict,
    desired_price: input.desiredPrice,
    computed_from: {
      method,
      window_months: 6,
      country: input.country ?? "MM",
      internal_samples: internalN,
      internal_range:
        internal.p25 != null ? { p25: internal.p25, median: internal.median, p75: internal.p75 } : null,
      msrp: msrp.found
        ? {
            amount_mmk: msrp.msrpMmk,
            source_currency: msrp.sourceCurrency,
            source_amount: msrp.sourceAmount,
            fx_rate_to_mmk: msrp.fxRate,
            source_url: msrp.sourceUrl,
            source_title: msrp.sourceTitle,
            as_of: msrp.asOf,
            note: msrp.note,
            origin: msrp.origin,
          }
        : { found: false, origin: msrp.origin },
      depreciation: depr
        ? {
            estimate_mmk: depr.estimateMmk,
            total_pct: Number(depr.totalDepreciation.toFixed(3)),
            age_months: ageIsSellerGiven ? depr.ageMonths : null,
            age_assumed: !ageIsSellerGiven,
            age_months_effective: depr.ageMonths,
            condition: input.condition ?? null,
            condition_factor: depr.conditionFactor,
            damage_haircut: depr.damageHaircut,
            year1_drop: depr.curve.year1Drop,
            annual_after: depr.curve.annualAfter,
          }
        : null,
      computed_at: new Date().toISOString(),
    } as unknown as Json,
  });
  if (insErr) throw new Error(`market_comparisons insert failed: ${insErr.message}`);

  return range;
}

/** Read a cached MSRP without ever triggering a web search. */
async function msrpFromCacheOnly(
  admin: ReturnType<typeof createAdminClient>,
  brand: string | null,
  model: string | null,
): Promise<MsrpInfo> {
  const miss: MsrpInfo = {
    found: false,
    msrpMmk: null,
    sourceCurrency: null,
    sourceAmount: null,
    fxRate: null,
    sourceUrl: null,
    sourceTitle: null,
    asOf: null,
    note: null,
    origin: "skipped",
    skipReason: "disabled",
  };
  if (!brand || !model) return miss;
  const { data } = await admin
    .from("product_msrp_cache")
    .select("*")
    .eq("brand_key", brand.trim().toLowerCase())
    .eq("model_key", model.trim().toLowerCase())
    .maybeSingle();
  if (!data || !data.found || !data.msrp_mmk) return miss;
  if (new Date(data.expires_at).getTime() <= Date.now()) return miss;
  return {
    found: true,
    msrpMmk: data.msrp_mmk,
    sourceCurrency: data.source_currency,
    sourceAmount: data.source_amount,
    fxRate: data.fx_rate_to_mmk,
    sourceUrl: data.source_url,
    sourceTitle: data.source_title,
    asOf: data.as_of,
    note: data.note,
    origin: "cache",
  };
}
