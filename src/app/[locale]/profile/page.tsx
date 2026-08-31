import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/layout/TopBar";
import { ButtonLink } from "@/components/ui/Button";
import { ProductGrid } from "@/components/product/ProductCard";
import { LogoutButton } from "@/components/profile/ProfilePanel";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { areaName } from "@/lib/format/area";
import type { AppLocale } from "@/i18n/routing";
import type { Tables } from "@/types/db";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = (await getLocale()) as AppLocale;
  const t = await getTranslations("profile");

  const user = await getSessionUser();

  if (!user) {
    return (
      <>
        <TopBar />
        <div className="px-4 py-10 text-center">
          <p className="text-sm text-muted">{t("notLoggedIn")}</p>
          <ButtonLink href="/login" className="mt-4">
            {t("login")}
          </ButtonLink>
        </div>
      </>
    );
  }

  const supabase = await createClient();
  const [{ data: profile }, { data: ownRows }] = await Promise.all([
    supabase.from("profiles").select("phone, primary_area_id").eq("id", user.id).maybeSingle(),
    supabase.from("products").select("id").eq("seller_id", user.id),
  ]);

  const { data: area } = profile?.primary_area_id
    ? await supabase
        .from("areas")
        .select("name_my,name_en,name_zh,name_ko,township")
        .eq("id", profile.primary_area_id)
        .maybeSingle()
    : { data: null };

  const ownIds = (ownRows ?? []).map((r) => r.id);
  let mine: Tables<"public_products">[] = [];
  if (ownIds.length > 0) {
    const { data } = await supabase
      .from("public_products")
      .select("*")
      .in("id", ownIds)
      .order("created_at", { ascending: false });
    mine = (data ?? []) as Tables<"public_products">[];
  }

  return (
    <>
      <TopBar />
      <div className="px-4 py-5">
        <h1 className="text-lg font-bold">{t("title")}</h1>
        <dl className="mt-4 space-y-2 rounded-[var(--radius-belauk)] border border-line bg-surface p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{t("phone")}</dt>
            <dd>{profile?.phone ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t("area")}</dt>
            <dd>
              {area
                ? areaName(
                    {
                      area_name_my: area.name_my,
                      area_name_en: area.name_en,
                      area_name_zh: area.name_zh,
                      area_name_ko: area.name_ko,
                      area_township: area.township,
                    },
                    loc,
                  )
                : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <LogoutButton />
        </div>

        <h2 className="mt-8 text-sm font-bold">{t("myListings")}</h2>
        <div className="mt-3">
          {mine.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{t("noListings")}</p>
          ) : (
            <ProductGrid products={mine} />
          )}
        </div>
      </div>
    </>
  );
}
