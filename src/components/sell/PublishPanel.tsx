"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import type { AppLocale } from "@/i18n/routing";

export function PublishPanel({
  productId,
  initialTitle,
  initialDescription,
}: {
  productId: string;
  initialTitle: string;
  initialDescription: string;
}) {
  const t = useTranslations("sell");
  const tc = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();

  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [genBusy, setGenBusy] = useState(false);
  const [pubBusy, setPubBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function regenerate() {
    setGenBusy(true);
    setError(null);
    const res = await fetch("/api/ai/generate-listing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, language: locale }),
    });
    const data = await res.json().catch(() => ({}));
    setGenBusy(false);
    if (res.ok) {
      setTitle(data.title);
      setDescription(data.description);
    }
  }

  async function publish() {
    setPubBusy(true);
    setError(null);
    // Persist any manual title/description edits first.
    await fetch("/api/products/draft-text", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, title, description }),
    }).catch(() => {});
    const res = await fetch("/api/products/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const data = await res.json().catch(() => ({}));
    setPubBusy(false);
    if (!res.ok) {
      setError(data.error === "price_required" ? t("priceTitle") : tc("retry"));
      return;
    }
    router.push(`/products/${data.productId}`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">{t("titleLabel")}</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">{t("descriptionLabel")}</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm"
        />
      </label>
      <button
        type="button"
        onClick={regenerate}
        disabled={genBusy}
        className="text-xs font-semibold text-accent-dark"
      >
        {genBusy ? t("generating") : `↻ ${t("regenerate")}`}
      </button>

      {error && <p className="text-sm text-warn">{error}</p>}

      <Button size="lg" onClick={publish} disabled={pubBusy}>
        {pubBusy ? t("publishing") : t("publish")}
      </Button>
    </div>
  );
}
