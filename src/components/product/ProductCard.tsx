import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductImage } from "./ProductImage";
import { productMediaUrl } from "@/lib/storage";
import { formatMMK } from "@/lib/format/money";
import { areaName } from "@/lib/format/area";
import type { Tables } from "@/types/db";
import type { AppLocale } from "@/i18n/routing";

export function ProductCard({ product }: { product: Tables<"public_products"> }) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations();
  const checked = (product.checked ?? {}) as { score?: number };

  return (
    <Link
      href={`/products/${product.id}`}
      className="block overflow-hidden rounded-[14px] border border-line bg-surface"
    >
      <div className="relative aspect-square">
        <ProductImage
          src={productMediaUrl(product.cover_path)}
          alt={product.title ?? ""}
          className="h-full w-full"
        />
        {typeof checked.score === "number" && checked.score >= 4 && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
            {t("checked.title")}
          </span>
        )}
      </div>
      <div className="space-y-1 p-2.5">
        <p className="line-clamp-1 text-sm font-semibold">{product.title}</p>
        <p className="text-sm font-bold text-accent-dark">
          {formatMMK(product.current_price_mmk, locale)} {t("common.mmk")}
        </p>
        <p className="line-clamp-1 text-[11px] text-muted">
          {areaName(product, locale)} · {t(`condition.${product.condition ?? "good"}`)}
        </p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Tables<"public_products">[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
