import { useTranslations } from "next-intl";
import type { Enums } from "@/types/db";

const styles: Record<Enums<"price_verdict">, string> = {
  within_range: "bg-accent-soft text-accent-dark",
  high: "bg-warn-soft text-warn",
  low: "bg-warn-soft text-warn",
  insufficient_data: "bg-line text-muted",
};

export function VerdictBadge({ verdict }: { verdict: Enums<"price_verdict"> }) {
  const t = useTranslations("price");
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${styles[verdict]}`}
    >
      {t(verdict)}
    </span>
  );
}
