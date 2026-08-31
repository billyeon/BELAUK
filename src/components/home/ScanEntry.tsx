"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { submitScan } from "@/lib/scan-client";

const camIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4l-1.5-2Z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);
const galleryIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 15 5-4 4 3 4-4 5 4" />
  </svg>
);

/**
 * 팔고싶어요 영역의 촬영/갤러리 진입.
 *
 *  - "사진·영상 찍기": <input capture="environment"> → 모바일 브라우저에서 탭 시 곧바로
 *    후면 카메라 촬영 화면이 뜬다. PC 웹에서는 capture 가 무시되어 일반 파일 선택창이
 *    뜨는데, 이는 정상 동작이므로 그대로 둔다.
 *    !! 모바일 실기기(iOS Safari / Android Chrome)에서 후면 카메라가 즉시 실행되는지
 *       반드시 확인할 것 (에뮬레이터/데스크톱으로는 검증 불가) !!
 *  - "갤러리에서 가져오기": capture 없이 accept 만 → 기존 사진/동영상 중 다중 선택.
 *
 * 촬영/선택이 끝나면 별도 업로드 버튼 없이 곧바로
 * 압축 → Supabase Storage 업로드 → AI 인식(/api/scan) → 인식결과 화면으로 이동한다.
 */
export function ScanEntry() {
  const t = useTranslations();
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (files.length === 0) return; // 사용자가 촬영/선택을 취소한 경우
    setBusy(true);
    setError(null);
    const { checkId } = await submitScan(files);
    if (checkId) {
      router.push(`/scan/${checkId}/review`);
      return; // 오버레이는 화면 전환까지 유지
    }
    setBusy(false);
    setError(t("common.retry"));
  }

  return (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files;
          e.target.value = "";
          void handleFiles(f);
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => {
          const f = e.target.files;
          e.target.value = "";
          void handleFiles(f);
        }}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => cameraRef.current?.click()}
        className="mt-3.5 flex h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-accent text-[15px] font-extrabold text-white transition-opacity disabled:opacity-60"
      >
        {camIcon} {t("home.takePhoto")}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => galleryRef.current?.click()}
        className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-line text-sm font-bold text-muted transition-opacity disabled:opacity-60"
      >
        {galleryIcon} {t("home.galleryImport")}
      </button>

      {error && <p className="mt-2 text-sm text-warn">{error}</p>}

      {busy && (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col items-center justify-center gap-3 bg-paper/95 px-8 text-center backdrop-blur">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-line border-t-accent" />
          <p className="text-sm font-semibold text-ink">{t("scan.analyzing")}</p>
          <p className="text-xs text-muted">{t("home.sellSubtitle")}</p>
        </div>
      )}
    </>
  );
}
