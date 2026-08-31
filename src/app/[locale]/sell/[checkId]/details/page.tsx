import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { DetailsForm } from "@/components/sell/DetailsForm";
import { getSessionUser } from "@/lib/auth/session";
import { resolveOwner, assertOwnsValueCheck } from "@/lib/scan";
import { getDraftProduct } from "@/lib/sell";

export default async function DetailsPage({
  params,
}: {
  params: Promise<{ locale: string; checkId: string }>;
}) {
  const { locale, checkId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("sell");

  const user = await getSessionUser();
  if (!user) {
    redirect({ href: `/login?returnTo=/sell/${checkId}/details`, locale });
  }

  const owner = await resolveOwner(true);
  const check = await assertOwnsValueCheck(checkId, { ...owner, userId: user!.id });
  if (!check) notFound();

  const draft = await getDraftProduct(checkId, user!.id);

  return (
    <>
      <TopBar back={{ href: `/scan/${checkId}/result`, label: t("detailsTitle") }} />
      <div className="px-4 py-5">
        <h1 className="text-xl font-extrabold">{t("detailsTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("detailsSubtitle")}</p>
        <div className="mt-5">
          <DetailsForm
            checkId={checkId}
            initial={{
              purchasePeriod: draft?.purchase_period ?? null,
              hasProof: draft?.has_purchase_proof ?? false,
              hasVideo: draft?.has_video ?? false,
            }}
          />
        </div>
      </div>
    </>
  );
}
