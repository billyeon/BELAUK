import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/layout/TopBar";
import { RecognitionEditor } from "@/components/scan/RecognitionEditor";
import {
  resolveOwner,
  assertOwnsValueCheck,
  latestRecognition,
  effectiveValues,
} from "@/lib/scan";
import { listCategories } from "@/lib/products";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ locale: string; checkId: string }>;
}) {
  const { locale, checkId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("scan");

  const owner = await resolveOwner(true);
  const check = await assertOwnsValueCheck(checkId, owner);
  if (!check) notFound();

  const rec = await latestRecognition(checkId);
  if (!rec) notFound();

  const eff = effectiveValues(rec.recognition, rec.edits);
  const [categories] = await Promise.all([listCategories()]);

  let categorySlug: string | null = null;
  if (eff.categoryId) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("categories")
      .select("slug")
      .eq("id", eff.categoryId)
      .maybeSingle();
    categorySlug = data?.slug ?? null;
  }

  return (
    <>
      <TopBar back={{ href: "/scan", label: t("title") }} />
      <div className="px-4 py-5">
        <h1 className="text-xl font-extrabold">{t("reviewTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("reviewSubtitle")}</p>

        <div className="mt-5">
          <RecognitionEditor
            checkId={checkId}
            initial={{
              categorySlug,
              brand: eff.brand,
              model: eff.model,
              condition: eff.condition,
              attributes: eff.attributes,
            }}
            categories={categories}
            missingShots={(rec.recognition.missing_shots as string[]) ?? []}
          />
        </div>
      </div>
    </>
  );
}
