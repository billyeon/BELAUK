"use client";

import { Suspense, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";

type Pick = { file: File; url: string };

function ScanInner() {
  const t = useTranslations("scan");
  const tc = useTranslations("common");
  const router = useRouter();
  // "gallery" entry point → let the OS picker choose an existing file (no live camera).
  const fromGallery = useSearchParams().get("source") === "gallery";
  const inputRef = useRef<HTMLInputElement>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(e.target.files ?? []);
    e.target.value = "";
    const next: Pick[] = [];
    for (const file of chosen) {
      if (file.type.startsWith("image/")) {
        try {
          const compressed = await imageCompression(file, {
            maxSizeMB: 0.9,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
          });
          const named = new File([compressed], file.name.replace(/\.\w+$/, ".jpg"), {
            type: compressed.type || "image/jpeg",
          });
          next.push({ file: named, url: URL.createObjectURL(named) });
        } catch {
          next.push({ file, url: URL.createObjectURL(file) });
        }
      } else {
        next.push({ file, url: URL.createObjectURL(file) });
      }
    }
    setPicks((p) => [...p, ...next].slice(0, 8));
  }

  async function analyze() {
    setBusy(true);
    setError(null);
    const form = new FormData();
    picks.forEach((p) => form.append("files", p.file));
    const res = await fetch("/api/scan", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.detail || tc("retry"));
      return;
    }
    router.push(`/scan/${data.checkId}/review`);
  }

  const photoCount = picks.filter((p) => p.file.type.startsWith("image/")).length;

  return (
    <>
      <TopBar back={{ href: "/", label: "BELAUK" }} />
      <div className="px-4 py-5">
        <h1 className="text-xl font-extrabold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("uploadHint")}</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {picks.map((p, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => setPicks((prev) => prev.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 h-6 w-6 rounded-full bg-black/60 text-xs text-white"
                aria-label={tc("close")}
              >
                ×
              </button>
            </div>
          ))}
          {picks.length < 8 && (
            <button
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center rounded-xl border border-dashed border-line text-2xl text-muted"
            >
              ＋
              <span className="mt-1 text-[11px]">{t("addPhotos")}</span>
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime"
          {...(fromGallery ? {} : { capture: "environment" as const })}
          multiple
          hidden
          onChange={onSelect}
        />

        {error && <p className="mt-4 text-sm text-warn">{error}</p>}

        <div className="mt-6">
          <p className="mb-2 text-center text-xs text-muted">
            {t("photoCount", { count: photoCount })}
          </p>
          <Button size="lg" disabled={photoCount === 0 || busy} onClick={analyze}>
            {busy ? t("analyzing") : t("analyze")}
          </Button>
        </div>
      </div>
    </>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={null}>
      <ScanInner />
    </Suspense>
  );
}
