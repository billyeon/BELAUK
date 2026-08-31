import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";

export default async function LocaleNotFound() {
  const t = await getTranslations("common");
  return (
    <div className="px-4 py-16 text-center">
      <p className="text-4xl font-extrabold">404</p>
      <ButtonLink href="/" className="mt-6">
        {t("back")}
      </ButtonLink>
    </div>
  );
}
