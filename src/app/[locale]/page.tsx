import { getLocale, setRequestLocale } from "next-intl/server";
import { HomeTabs } from "@/components/home/HomeTabs";
import { listPublicProducts, listCategories } from "@/lib/products";
import { resolveOwner, latestValueResult } from "@/lib/scan";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { areaName } from "@/lib/format/area";
import type { AppLocale } from "@/i18n/routing";

const DEFAULT_AREA: Record<AppLocale, string> = {
  my: "ရန်ကုန်",
  en: "Yangon",
  zh: "仰光",
  ko: "양곤",
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = (await getLocale()) as AppLocale;

  const [owner, products, categories] = await Promise.all([
    resolveOwner(false),
    listPublicProducts({ limit: 6 }),
    listCategories(),
  ]);
  const result = await latestValueResult(owner);

  let areaLabel = DEFAULT_AREA[loc] ?? "Yangon";
  const profile = await getProfile();
  if (profile?.primary_area_id) {
    const supabase = await createClient();
    const { data: area } = await supabase
      .from("areas")
      .select("name_my,name_en,name_zh,name_ko,township")
      .eq("id", profile.primary_area_id)
      .maybeSingle();
    if (area) {
      areaLabel = areaName(
        {
          area_name_my: area.name_my,
          area_name_en: area.name_en,
          area_name_zh: area.name_zh,
          area_name_ko: area.name_ko,
          area_township: area.township,
        },
        loc,
      );
    }
  }

  return (
    <HomeTabs
      result={
        result
          ? {
              comparison: result.comparison,
              brand: result.effective?.brand,
              model: result.effective?.model,
              valueCheckId: result.valueCheckId,
            }
          : null
      }
      products={products}
      categories={categories}
      areaLabel={areaLabel}
    />
  );
}
