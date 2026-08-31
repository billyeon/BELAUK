import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { PriceRangeReview } from "@/components/sell/PriceRangeReview";
import { getSessionUser } from "@/lib/auth/session";
import { getDraftProduct } from "@/lib/sell";

export default async function PricePage({
  params,
}: {
  params: Promise<{ locale: string; checkId: string }>;
}) {
  const { locale, checkId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sell");

  const user = await getSessionUser();
  if (!user) redirect({ href: `/login?returnTo=/sell/${checkId}/price`, locale });

  const draft = await getDraftProduct(checkId, user!.id);
  if (!draft) notFound();

  return (
    <>
      <TopBar back={{ href: `/sell/${checkId}/details`, label: t("detailsTitle") }} />
      <div className="px-4 py-5">
        <h1 className="text-xl font-extrabold">{t("priceTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("priceSubtitle")}</p>
        <div className="mt-5">
          <PriceRangeReview
            checkId={checkId}
            productId={draft.id}
            initialPrice={draft.current_price_mmk}
          />
        </div>
      </div>
    </>
  );
}
