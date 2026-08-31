import { useTranslations } from "next-intl";
import { checkedItemState, type CheckedStatus } from "@/lib/checked/score";

const ITEMS = [
  ["photos", "photos"],
  ["condition", "condition"],
  ["purchasePeriod", "purchasePeriod"],
  ["video", "video"],
  ["proof", "proof"],
  ["priceReviewed", "priceReviewed"],
] as const;

export function CheckedChecklist({ status }: { status: Partial<CheckedStatus> | null | undefined }) {
  const t = useTranslations("checked");
  const state = checkedItemState(status);

  return (
    <div className="rounded-[var(--radius-belauk)] border border-line bg-surface p-4">
      <p className="text-sm font-bold text-accent-dark">{t("title")}</p>
      <p className="mt-0.5 text-xs text-muted">{t("subtitle")}</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {ITEMS.map(([key, label]) => (
          <li key={key} className="flex items-center gap-2">
            <span className={state[key] ? "text-accent" : "text-line"}>
              {state[key] ? "●" : "○"}
            </span>
            <span className={state[key] ? "" : "text-muted"}>{t(label)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
