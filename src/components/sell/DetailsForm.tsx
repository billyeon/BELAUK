"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export function DetailsForm({
  checkId,
  initial,
}: {
  checkId: string;
  initial: { purchasePeriod: string | null; hasProof: boolean; hasVideo: boolean };
}) {
  const t = useTranslations("sell");
  const tc = useTranslations("common");
  const router = useRouter();
  const [purchasePeriod, setPurchasePeriod] = useState(initial.purchasePeriod ?? "");
  const [hasProof, setHasProof] = useState(initial.hasProof);
  const [hasVideo, setHasVideo] = useState(initial.hasVideo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/products/draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ checkId, purchasePeriod, hasProof, hasVideo }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(tc("retry"));
      return;
    }
    router.push(`/sell/${checkId}/price`);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium">
          {t("purchasePeriod")}{" "}
          <span className="text-xs text-muted">({tc("optional")})</span>
        </span>
        <input
          value={purchasePeriod}
          onChange={(e) => setPurchasePeriod(e.target.value)}
          placeholder={t("purchasePeriodPlaceholder")}
          className="mt-1 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm"
        />
      </label>

      <label className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-sm">
        <input type="checkbox" checked={hasProof} onChange={(e) => setHasProof(e.target.checked)} />
        {t("hasProof")}
      </label>
      <label className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-sm">
        <input type="checkbox" checked={hasVideo} onChange={(e) => setHasVideo(e.target.checked)} />
        {t("hasVideo")}
      </label>

      {error && <p className="text-sm text-warn">{error}</p>}
      <Button type="submit" size="lg" disabled={busy}>
        {busy ? tc("loading") : tc("next")}
      </Button>
    </form>
  );
}
