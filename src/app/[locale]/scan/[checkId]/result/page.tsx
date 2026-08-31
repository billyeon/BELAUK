import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/layout/TopBar";
import { ButtonLink } from "@/components/ui/Button";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { formatMMK } from "@/lib/format/money";
import {
  resolveOwner,
  assertOwnsValueCheck,
  latestRecognition,
  effectiveValues,
} from "@/lib/scan";
import { reviewPrice } from "@/lib/pricing/range";
import { basisFromComputedFrom, describeBasis } from "@/lib/pricing/basis-view";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ locale: string; checkId: string }>;
}) {
  const { locale, checkId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const owner = await resolveOwner(true);
  const check = await assertOwnsValueCheck(checkId, owner);
  if (!check) notFound();

  const rec = await latestRecognition(checkId);
  if (!rec) notFound();
  const eff = effectiveValues(rec.recognition, rec.edits);

  const admin = createAdminClient();
  let { data: comparison } = await admin
    .from("market_comparisons")
    .select("*")
    .eq("value_check_id", checkId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!comparison) {
    let categorySlug: string | null = null;
    if (eff.categoryId) {
      const { data: cat } = await admin
        .from("categories")
        .select("slug")
        .eq("id", eff.categoryId)
        .maybeSingle();
      categorySlug = cat?.slug ?? null;
    }
    const raw = rec.recognition.raw_response as { summary?: string } | null;
    await reviewPrice(
      {
        categoryId: eff.categoryId ?? null,
        categorySlug,
        brand: eff.brand,
        model: eff.model,
        condition: (["new", "like_new", "good", "fair", "poor"] as const).includes(
          eff.condition as never,
        )
          ? (eff.condition as "new" | "like_new" | "good" | "fair" | "poor")
          : null,
        attributes: eff.attributes,
        damageText: raw?.summary ?? null,
        desiredPrice: null,
        web: false,
      },
      { valueCheckId: checkId },
    );
    ({ data: comparison } = await admin
      .from("market_comparisons")
      .select("*")
      .eq("value_check_id", checkId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle());
  }

  const hasRange = comparison?.price_p25 != null && comparison?.price_p75 != null;
  const title = [eff.brand, eff.model].filter(Boolean).join(" ");
  const basis = describeBasis(
    basisFromComputedFrom(comparison?.computed_from),
    t as unknown as (k: string, v?: Record<string, string | number>) => string,
    locale,
  );

  return (
    <>
      <TopBar back={{ href: `/scan/${checkId}/review`, label: t("scan.reviewTitle") }} />
      <div className="px-4 py-5">
        <h1 className="text-xl font-extrabold">{t("scan.resultTitle")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("scan.resultSubtitle", { brand: eff.brand ?? "", model: eff.model ?? "" })}
        </p>

        <div className="mt-5 rounded-[var(--radius-belauk)] border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{title || t("home.aiResultTitle")}</p>
            {comparison && <VerdictBadge verdict={comparison.verdict} />}
          </div>

          <div className="mt-4 grid grid-cols-3 divide-x divide-line text-center">
            <div className="px-1">
              <p className="text-[11px] text-muted">{t("home.statRange")}</p>
              <p className="mt-1 text-sm font-bold text-accent-dark">
                {hasRange
                  ? `${formatMMK(comparison!.price_p25, locale)}–${formatMMK(comparison!.price_p75, locale)}`
                  : "—"}
              </p>
            </div>
            <div className="px-1">
              <p className="text-[11px] text-muted">{t("price.medianLabel")}</p>
              <p className="mt-1 text-sm font-bold">
                {hasRange ? formatMMK(comparison!.price_median, locale) : "—"}
              </p>
            </div>
            <div className="px-1">
              <p className="text-[11px] text-muted">{t("home.statSamples")}</p>
              <p className="mt-1 text-sm font-bold">{comparison?.sample_size ?? 0}</p>
            </div>
          </div>

          {!hasRange && (
            <p className="mt-3 rounded-lg bg-line/50 px-3 py-2 text-xs text-muted">
              {t("common.dataLow")}
            </p>
          )}

          {basis && (
            <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
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

        <ButtonLink href={`/sell/${checkId}/details`} size="lg" className="mt-6">
          {t("scan.sellCta")}
        </ButtonLink>
      </div>
    </>
  );
}
