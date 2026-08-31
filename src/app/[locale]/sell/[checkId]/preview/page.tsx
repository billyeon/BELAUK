import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { CheckedChecklist } from "@/components/sell/CheckedChecklist";
import { PublishPanel } from "@/components/sell/PublishPanel";
import { ProductImage } from "@/components/product/ProductImage";
import { getSessionUser } from "@/lib/auth/session";
import { getDraftProduct } from "@/lib/sell";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateListing } from "@/lib/ai/recognize";
import { productMediaUrl } from "@/lib/storage";
import { formatMMK } from "@/lib/format/money";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ locale: string; checkId: string }>;
}) {
  const { locale, checkId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const user = await getSessionUser();
  if (!user) redirect({ href: `/login?returnTo=/sell/${checkId}/preview`, locale });

  const draft = await getDraftProduct(checkId, user!.id);
  if (!draft) notFound();

  const admin = createAdminClient();

  // Generate title/description once if the seller hasn't seen them yet.
  let title = draft.title;
  let description = draft.description;
  if (!description) {
    let attributes: Record<string, string> = {};
    const { data: rec } = await admin
      .from("ai_recognitions")
      .select("detected_attributes")
      .eq("value_check_id", checkId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    attributes = (rec?.detected_attributes ?? {}) as Record<string, string>;
    const { data: listing } = await generateListing({
      brand: draft.brand,
      model: draft.model,
      condition: draft.condition,
      attributes,
      purchasePeriod: draft.purchase_period,
      language: locale,
    });
    title = listing.title;
    description = listing.description;
    await admin
      .from("products")
      .update({ title, description })
      .eq("id", draft.id);
  }

  const { data: media } = await admin
    .from("product_media")
    .select("storage_path")
    .eq("product_id", draft.id)
    .order("sort");

  return (
    <>
      <TopBar back={{ href: `/sell/${checkId}/price`, label: t("sell.priceTitle") }} />
      <div className="px-4 py-5">
        <h1 className="text-xl font-extrabold">{t("sell.previewTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("sell.previewSubtitle")}</p>

        <div className="mt-5 overflow-hidden rounded-[var(--radius-belauk)] border border-line bg-surface">
          <div className="flex gap-1 overflow-x-auto">
            {(media ?? []).map((m, i) => (
              <ProductImage
                key={i}
                src={productMediaUrl(m.storage_path)}
                alt=""
                className="h-40 w-40 shrink-0"
              />
            ))}
          </div>
          <div className="p-4">
            <p className="font-semibold">{title}</p>
            <p className="mt-1 text-lg font-bold text-accent-dark">
              {formatMMK(draft.current_price_mmk, locale)} {t("common.mmk")}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{description}</p>
          </div>
        </div>

        <div className="mt-5">
          <CheckedChecklist status={draft.checked as never} />
        </div>

        <div className="mt-6">
          <PublishPanel
            productId={draft.id}
            initialTitle={title}
            initialDescription={description}
          />
        </div>
      </div>
    </>
  );
}
