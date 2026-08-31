import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupMsrpViaWeb } from "@/lib/ai/msrp";

/** Monthly cap on web-search spend. Over this, MSRP lookups are skipped. */
export const WEB_SEARCH_MONTHLY_CAP_USD = 30;

/** Categories where a new-price lookup is worth attempting. Vehicles excluded. */
const LOOKUP_CATEGORIES = new Set([
  "phones",
  "laptops",
  "audio",
  "electronics",
  "kitchen",
  "laundry",
  "home",
  "fashion",
  "bags",
  "shoes",
  "hobby",
  "other",
]);

const CACHE_DAYS_FOUND = 180;
const CACHE_DAYS_NOT_FOUND = 30;

export type MsrpInfo = {
  found: boolean;
  msrpMmk: number | null;
  sourceCurrency: string | null;
  sourceAmount: number | null;
  fxRate: number | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  asOf: string | null;
  note: string | null;
  origin: "cache" | "web" | "skipped";
  /** why it was skipped, if origin === "skipped" */
  skipReason?: "no_identity" | "category" | "budget" | "disabled";
};

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

function notFound(origin: MsrpInfo["origin"], skipReason?: MsrpInfo["skipReason"]): MsrpInfo {
  return {
    found: false,
    msrpMmk: null,
    sourceCurrency: null,
    sourceAmount: null,
    fxRate: null,
    sourceUrl: null,
    sourceTitle: null,
    asOf: null,
    note: null,
    origin,
    skipReason,
  };
}

/**
 * Resolve a product's new / launch price (MMK), using a permanent-ish cache and a
 * monthly web-search budget guard. Never throws.
 */
export async function getMsrp(input: {
  brand: string | null;
  model: string | null;
  categorySlug: string | null;
  attributes?: Record<string, string>;
}): Promise<MsrpInfo> {
  const brand = (input.brand ?? "").trim();
  const model = (input.model ?? "").trim();
  if (!brand || !model || model.length < 2) return notFound("skipped", "no_identity");
  if (input.categorySlug && !LOOKUP_CATEGORIES.has(input.categorySlug)) {
    return notFound("skipped", "category");
  }

  const admin = createAdminClient();
  const brandKey = norm(brand);
  const modelKey = norm(model);

  // 1. Cache
  const { data: cached } = await admin
    .from("product_msrp_cache")
    .select("*")
    .eq("brand_key", brandKey)
    .eq("model_key", modelKey)
    .maybeSingle();

  if (cached && new Date(cached.expires_at).getTime() > Date.now()) {
    return {
      found: cached.found,
      msrpMmk: cached.msrp_mmk,
      sourceCurrency: cached.source_currency,
      sourceAmount: cached.source_amount,
      fxRate: cached.fx_rate_to_mmk,
      sourceUrl: cached.source_url,
      sourceTitle: cached.source_title,
      asOf: cached.as_of,
      note: cached.note,
      origin: "cache",
    };
  }

  // 2. Budget guard
  const { data: spent } = await admin.rpc("web_search_spend_mtd");
  if (typeof spent === "number" && spent >= WEB_SEARCH_MONTHLY_CAP_USD) {
    return notFound("skipped", "budget");
  }

  // 3. Web lookup
  const res = await lookupMsrpViaWeb({
    brand,
    model,
    categorySlug: input.categorySlug,
    attributes: input.attributes,
  });

  // 4. Ledger (append-only spend record)
  if (res.cost.searches > 0 || res.cost.usd > 0) {
    await admin.from("web_search_ledger").insert({
      purpose: "msrp_lookup",
      brand,
      model,
      searches: res.cost.searches,
      input_tokens: res.cost.inputTokens,
      output_tokens: res.cost.outputTokens,
      cost_usd: res.cost.usd,
    });
  }

  // 5. Cache upsert
  const found = Boolean(res.report.found && res.msrpMmk);
  const expiresAt = new Date(
    Date.now() + (found ? CACHE_DAYS_FOUND : CACHE_DAYS_NOT_FOUND) * 86_400_000,
  ).toISOString();
  await admin.from("product_msrp_cache").upsert(
    {
      brand_key: brandKey,
      model_key: modelKey,
      category_slug: input.categorySlug,
      found,
      msrp_mmk: found ? res.msrpMmk : null,
      source_currency: res.report.currency,
      source_amount: res.report.amount,
      fx_rate_to_mmk: res.fxRate,
      source_url: res.report.source_url,
      source_title: res.report.source_title,
      as_of: res.report.as_of,
      note: res.report.note,
      ai_model: res.aiModel,
      checked_at: new Date().toISOString(),
      expires_at: expiresAt,
    },
    { onConflict: "brand_key,model_key" },
  );

  if (!found) return notFound("web");
  return {
    found: true,
    msrpMmk: res.msrpMmk,
    sourceCurrency: res.report.currency,
    sourceAmount: res.report.amount,
    fxRate: res.fxRate,
    sourceUrl: res.report.source_url,
    sourceTitle: res.report.source_title,
    asOf: res.report.as_of,
    note: res.report.note,
    origin: "web",
  };
}
