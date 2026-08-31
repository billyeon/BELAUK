import { getTranslations, setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/layout/TopBar";
import { BrowseControls } from "@/components/product/BrowseControls";
import { ProductGrid } from "@/components/product/ProductCard";
import { listPublicProducts, listCategories, type ProductSort } from "@/lib/products";

export default async function BrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("product");

  const [products, categories] = await Promise.all([
    listPublicProducts({
      q: sp.q,
      category: sp.category,
      sort: (sp.sort as ProductSort) ?? "new",
      limit: 60,
    }),
    listCategories(),
  ]);

  return (
    <>
      <TopBar />
      <div className="px-4 py-4">
        <h1 className="mb-3 text-lg font-bold">{t("browseTitle")}</h1>
        <BrowseControls categories={categories} />
        <div className="mt-5">
          {products.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">{t("noResults")}</p>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </div>
    </>
  );
}
