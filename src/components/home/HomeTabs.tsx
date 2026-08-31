"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { ProductGrid } from "@/components/product/ProductCard";
import { ScanEntry } from "@/components/home/ScanEntry";
import { VerdictBadge } from "@/components/ui/VerdictBadge";
import { formatMMK } from "@/lib/format/money";
import { categoryName } from "@/lib/format/area";
import type { AppLocale } from "@/i18n/routing";
import type { Tables } from "@/types/db";

type Result = {
  comparison: Tables<"market_comparisons">;
  brand?: string | null;
  model?: string | null;
  valueCheckId: string | null;
} | null;

type Category = {
  id: string;
  slug: string;
  parent_id: string | null;
  icon: string | null;
  name_my: string;
  name_en: string;
  name_zh: string;
  name_ko: string;
};

export function HomeTabs({
  result,
  products,
  categories,
  areaLabel,
}: {
  result: Result;
  products: Tables<"public_products">[];
  categories: Category[];
  areaLabel: string;
}) {
  const t = useTranslations();
  const locale = useLocale() as AppLocale;
  const sellRef = useRef<HTMLElement>(null);
  const buyRef = useRef<HTMLElement>(null);
  const [tab, setTab] = useState<"sell" | "buy">("sell");

  function go(next: "sell" | "buy") {
    setTab(next);
    (next === "sell" ? sellRef : buyRef).current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // Keep the active tab in sync while the user scrolls freely.
  useEffect(() => {
    const sell = sellRef.current;
    const buy = buyRef.current;
    if (!sell || !buy) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setTab(e.target === buy ? "buy" : "sell");
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    obs.observe(sell);
    obs.observe(buy);
    return () => obs.disconnect();
  }, []);

  const topCats = categories.filter((c) => !c.parent_id);

  const tabCls = (on: boolean) =>
    `flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors ${
      on ? "bg-accent text-white" : "border border-line bg-surface text-muted"
    }`;
  const panelCls = (on: boolean) =>
    `rounded-[var(--radius-belauk)] border-2 p-4 transition-colors ${
      on ? "border-accent bg-surface" : "border-line bg-surface/70"
    }`;

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-line bg-paper/95 px-4 py-2.5 backdrop-blur">
        <Link href="/" aria-label="BELAUK">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/belauk-logo.png" alt="BELAUK" className="h-[21px] w-auto" />
        </Link>
        <div className="flex items-center gap-2.5 text-xs text-muted">
          <span className="font-medium text-accent-dark">📍 {areaLabel}</span>
          <LocaleSwitcher />
        </div>
      </header>

      <div className="sticky top-[45px] z-10 flex gap-1.5 bg-paper/95 px-4 py-2 backdrop-blur">
        <button type="button" onClick={() => go("sell")} className={tabCls(tab === "sell")}>
          {t("home.sellTab")}
        </button>
        <button type="button" onClick={() => go("buy")} className={tabCls(tab === "buy")}>
          {t("home.buyTab")}
        </button>
      </div>

      {/* ===== 팔고 싶어요 ===== */}
      <section ref={sellRef} className="scroll-mt-[100px] px-4 pt-3">
        <div className={panelCls(tab === "sell")}>
          <h1 className="text-[26px] font-extrabold leading-tight text-ink">
            {t("home.aiValueTitle")}
          </h1>
          <p className="mt-1.5 text-sm text-muted">{t("home.sellSubtitle")}</p>

          {result ? (
            <RealResult result={result} />
          ) : (
            <ExampleResult />
          )}

          <ScanEntry />
        </div>
      </section>

      {/* ===== 사고 싶어요 ===== */}
      <section ref={buyRef} className="scroll-mt-[100px] px-4 pb-10 pt-3">
        <div className={panelCls(tab === "buy")}>
          <h2 className="text-base font-bold">{t("home.buyTab")}</h2>

          <Link
            href="/products"
            className="mt-3 flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm text-muted"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            {t("home.searchPlaceholder")}
          </Link>

          <div className="mt-4 flex gap-4 overflow-x-auto pb-1">
            {topCats.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className="flex shrink-0 flex-col items-center gap-1"
              >
                <span className="text-2xl leading-none">{c.icon ?? "▦"}</span>
                <span className="text-[11px] text-muted">{categoryName(c, locale)}</span>
              </Link>
            ))}
          </div>

          <div className="mb-2 mt-5 flex items-baseline justify-between">
            <span className="text-sm font-bold">{t("home.nearby")}</span>
            <Link href="/products" className="text-xs text-accent-dark">
              {t("home.viewAll")} ›
            </Link>
          </div>
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <p className="py-6 text-center text-sm text-muted">{t("product.noResults")}</p>
          )}
        </div>
      </section>
    </>
  );
}

function ExampleResult() {
  const t = useTranslations();
  return (
    <div className="mt-4 rounded-2xl bg-accent-soft/60 p-4">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-warn px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
          {t("home.exampleLabel")}
        </span>
        <span className="text-xs text-muted">{t("home.examplePrefix")} · iPhone 11</span>
      </div>
      <div className="mt-2 text-xl font-extrabold text-accent-dark">
        260,000 – 320,000{" "}
        <span className="text-xs font-medium text-muted">{t("common.mmk")}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent-dark">
          {t("home.statConfidence")} {t("price.sufficiency.low")}
        </span>
        <span className="rounded-full bg-line px-2.5 py-1 text-[11px] font-bold text-ink">
          {t("home.statSamples")} 24
        </span>
      </div>
      <p className="mt-2.5 text-[11px] text-muted">{t("home.exampleHint")}</p>
    </div>
  );
}

function RealResult({ result }: { result: NonNullable<Result> }) {
  const t = useTranslations();
  const locale = useLocale() as AppLocale;
  const c = result.comparison;
  const hasRange = c.price_p25 != null && c.price_p75 != null;
  const title = [result.brand, result.model].filter(Boolean).join(" ");

  return (
    <div className="mt-4 rounded-2xl border border-line p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted">
          {t("home.recentResult")}
          {title ? ` · ${title}` : ""}
        </span>
        <VerdictBadge verdict={c.verdict} />
      </div>
      <div className="mt-2 text-xl font-extrabold text-accent-dark">
        {hasRange
          ? `${formatMMK(c.price_p25, locale)} – ${formatMMK(c.price_p75, locale)}`
          : "—"}{" "}
        <span className="text-xs font-medium text-muted">{t("common.mmk")}</span>
      </div>
      {!hasRange && <p className="mt-1 text-[11px] text-muted">{t("common.dataLow")}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent-dark">
          {t("home.statConfidence")} {t(`price.sufficiency.${c.data_sufficiency}`)}
        </span>
        <span className="rounded-full bg-line px-2.5 py-1 text-[11px] font-bold text-ink">
          {t("home.statSamples")} {c.sample_size}
        </span>
      </div>
      {result.valueCheckId && (
        <Link
          href={`/scan/${result.valueCheckId}/result`}
          className="mt-2 inline-block text-xs font-semibold text-accent-dark"
        >
          {t("scan.seeResult")} ›
        </Link>
      )}
    </div>
  );
}
