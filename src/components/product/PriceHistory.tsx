import { useLocale, useTranslations } from "next-intl";
import { formatMMK } from "@/lib/format/money";
import type { AppLocale } from "@/i18n/routing";
import type { Enums } from "@/types/db";

type Event = {
  id: string;
  event_type: Enums<"price_event_type">;
  amount_mmk: number;
  created_at: string;
};

export function PriceHistory({ events }: { events: Event[] }) {
  const t = useTranslations("product");
  const locale = useLocale() as AppLocale;
  if (events.length === 0) return null;

  return (
    <section className="mt-6">
      <h2 className="text-sm font-bold">{t("priceHistory")}</h2>
      <ol className="mt-2 space-y-2 border-l border-line pl-4">
        {events.map((e) => (
          <li key={e.id} className="relative text-sm">
            <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-accent" />
            <span className="text-muted">{t(`eventType.${e.event_type}`)}</span>
            <span className="ml-2 font-semibold">
              {formatMMK(e.amount_mmk, locale)} {t("price")}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-[11px] text-muted">{t("priceHistoryNote")}</p>
    </section>
  );
}
