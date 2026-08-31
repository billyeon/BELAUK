"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";

function LoginInner() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") ?? "/";
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(t("invalidPhone"));
      return;
    }
    const q = new URLSearchParams({ phone: data.phone, returnTo });
    if (data.devCode) q.set("devCode", data.devCode);
    router.push(`/verify?${q.toString()}`);
  }

  return (
    <>
      <TopBar back={{ href: "/", label: "BELAUK" }} />
      <div className="px-4 py-6">
        <h1 className="text-xl font-extrabold">{t("loginTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("loginSubtitle")}</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">{t("phoneLabel")}</span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
              className="mt-1 h-12 w-full rounded-xl border border-line bg-surface px-4 text-base"
            />
          </label>
          {error && <p className="text-sm text-warn">{error}</p>}
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? t("sending") : t("sendCode")}
          </Button>
        </form>

        <p className="mt-4 rounded-lg bg-line/50 px-3 py-2 text-xs text-muted">
          {t("mockNotice")}
        </p>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
