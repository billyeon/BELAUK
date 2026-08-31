"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";

function VerifyInner() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const returnTo = params.get("returnTo") ?? "/";
  const devCode = params.get("devCode");

  const [code, setCode] = useState(devCode ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    setLoading(false);
    if (!res.ok) {
      setError(t("invalidCode"));
      return;
    }
    router.replace(returnTo);
    router.refresh();
  }

  return (
    <>
      <TopBar back={{ href: "/login", label: t("loginTitle") }} />
      <div className="px-4 py-6">
        <h1 className="text-xl font-extrabold">{t("verifyTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("verifySubtitle", { phone })}</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">{t("codeLabel")}</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="mt-1 h-12 w-full rounded-xl border border-line bg-surface px-4 text-center text-2xl tracking-[0.4em]"
            />
          </label>
          {devCode && (
            <p className="text-xs text-accent-dark">dev code: {devCode}</p>
          )}
          {error && <p className="text-sm text-warn">{error}</p>}
          <Button type="submit" size="lg" disabled={loading || code.length !== 6}>
            {loading ? t("verifying") : t("verify")}
          </Button>
        </form>
      </div>
    </>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
