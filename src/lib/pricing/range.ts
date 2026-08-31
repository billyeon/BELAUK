import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/types/db";

export type PriceRange = {
  sampleSize: number;
  priceMin: number | null;
  priceP25: number | null;
  priceMedian: number | null;
  priceP75: number | null;
  priceMax: number | null;
  dataSufficiency: Enums<"data_sufficiency">;
  verdict: Enums<"price_verdict">;
};

type RangeInput = {
  categoryId: string | null;
  brand?: string | null;
  model?: string | null;
  desiredPrice: number | null;
  country?: string;
};

/** Runs get_price_range and appends an immutable market_comparisons snapshot. */
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
  const range: PriceRange = {
    sampleSize: row?.sample_size ?? 0,
    priceMin: row?.price_min ?? null,
    priceP25: row?.price_p25 ?? null,
    priceMedian: row?.price_median ?? null,
    priceP75: row?.price_p75 ?? null,
    priceMax: row?.price_max ?? null,
    dataSufficiency: row?.data_sufficiency ?? "none",
    verdict: row?.verdict ?? "insufficient_data",
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
      source: ["platform_listings", "confirmed_transactions"],
      window_months: 6,
      country: input.country ?? "MM",
      computed_at: new Date().toISOString(),
    },
  });
  if (insErr) throw new Error(`market_comparisons insert failed: ${insErr.message}`);

  return range;
}
