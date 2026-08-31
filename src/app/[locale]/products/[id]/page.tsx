import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/layout/TopBar";
import { ProductImage } from "@/components/product/ProductImage";
import { CheckedChecklist } from "@/components/sell/CheckedChecklist";
import { PriceHistory } from "@/components/product/PriceHistory";
import { getProduct, getProductMedia, getPriceEvents } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { productMediaUrl } from "@/lib/storage";
import { formatMMK } from "@/lib/format/money";
import { areaName } from "@/lib/format/area";
import type { AppLocale } from "@/i18n/routing";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const loc = (await getLocale()) as AppLocale;
  const t = await getTranslations("product");
  const tCond = await getTranslations("condition");
  const tc = await getTranslations("common");

  const product = await getProduct(id);
  if (!product || !product.id) notFound();

  const [media, events] = await Promise.all([
    getProductMedia(product.id),
    getPriceEvents(product.id),
  ]);

  // Best-effort view bump.
  const supabase = await createClient();
  void supabase.rpc("bump_product_view", { p_product_id: product.id });

  return (
    <>
      <TopBar back={{ href: "/products", label: t("browseTitle") }} />

      <div className="flex gap-1 overflow-x-auto bg-line/40">
        {(media.length ? media : [{ storage_path: product.cover_path ?? "" }]).map((m, i) => (
          <ProductImage
            key={i}
            src={productMediaUrl(m.storage_path)}
            alt={product.title ?? ""}
            className="h-72 w-72 shrink-0"
          />
        ))}
      </div>

      <div className="px-4 py-4">
        <h1 className="text-lg font-bold">{product.title}</h1>
        <p className="mt-1 text-2xl font-extrabold text-accent-dark">
          {formatMMK(product.current_price_mmk, loc)} {tc("mmk")}
        </p>
        <p className="mt-1 text-xs text-muted">
          {areaName(product, loc)} · {tCond(product.condition ?? "good")} ·{" "}
          {t("viewCount", { count: product.view_count ?? 0 })}
        </p>

        {product.seller_name && (
          <p className="mt-2 text-xs text-muted">
            {product.seller_name} · {t(`sellerTrust.${product.seller_trust_level ?? "new"}`)}
          </p>
        )}

        <section className="mt-4">
          <h2 className="text-sm font-bold">{t("description")}</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{product.description}</p>
          {product.ai_generated && (
            <p className="mt-1 text-[11px] text-muted">✦ {t("aiGenerated")}</p>
          )}
        </section>

        <div className="mt-5">
          <CheckedChecklist status={product.checked as never} />
        </div>

        <PriceHistory events={events} />
      </div>
    </>
  );
}
