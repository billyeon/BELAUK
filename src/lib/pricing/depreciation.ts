import "server-only";
import type { Enums } from "@/types/db";

/**
 * 정가(신품가) 기반 감가상각 추정.
 *
 * 여기 상수들은 "합리적 기본값"이며, BELAUK 실거래 데이터가 쌓이면 카테고리별로
 * 보정하기 위한 자리다. 값만 바꾸면 되고 계산 로직은 건드릴 필요 없다.
 *
 * 감가 곡선: 1년차에 크게 떨어지고(`year1Drop`), 이후 매년 `annualAfter` 비율로
 * 완만하게 감소하되, 아무리 오래돼도 정가의 `residualFloor` 아래로는 안 내려간다.
 */

export type DepreciationCurve = {
  /** 1년(12개월) 사용 시 잔존 가치 비율 대비 하락폭. 0.40 = 1년 뒤 정가의 60%. */
  year1Drop: number;
  /** 1년 이후 매년 추가 하락 비율(전년 대비). 0.18 = 매년 18%씩 추가로. */
  annualAfter: number;
  /** 잔존 가치 하한 (정가 대비). 이 아래로는 안 떨어짐. */
  residualFloor: number;
};

/** 카테고리 slug → 감가 곡선. `default` 는 매칭 실패 시. */
export const CATEGORY_DEPRECIATION: Record<string, DepreciationCurve> = {
  // 전자기기: 신제품 교체주기가 빠르고 중고가가 가파르게 하락
  phones: { year1Drop: 0.42, annualAfter: 0.2, residualFloor: 0.08 },
  laptops: { year1Drop: 0.38, annualAfter: 0.18, residualFloor: 0.1 },
  audio: { year1Drop: 0.4, annualAfter: 0.2, residualFloor: 0.1 },
  electronics: { year1Drop: 0.4, annualAfter: 0.2, residualFloor: 0.1 },

  // 생활가전: 전자기기보다 완만
  kitchen: { year1Drop: 0.32, annualAfter: 0.14, residualFloor: 0.12 },
  laundry: { year1Drop: 0.3, annualAfter: 0.13, residualFloor: 0.12 },

  // 가구·홈: 완만한 감가, 잔존가치 높음
  home: { year1Drop: 0.22, annualAfter: 0.1, residualFloor: 0.2 },

  // 패션·가방·신발: 상태 의존이 크고 1년차 하락이 큼
  fashion: { year1Drop: 0.45, annualAfter: 0.18, residualFloor: 0.1 },
  bags: { year1Drop: 0.35, annualAfter: 0.14, residualFloor: 0.15 },
  shoes: { year1Drop: 0.5, annualAfter: 0.22, residualFloor: 0.08 },

  // 취미·기타
  hobby: { year1Drop: 0.35, annualAfter: 0.16, residualFloor: 0.12 },
  other: { year1Drop: 0.35, annualAfter: 0.16, residualFloor: 0.12 },

  default: { year1Drop: 0.35, annualAfter: 0.16, residualFloor: 0.12 },
};

/** 상태 등급별 배수 (감가 후 값에 곱함). */
export const CONDITION_FACTOR: Record<Enums<"product_condition">, number> = {
  new: 1.0,
  like_new: 0.95,
  good: 0.88,
  fair: 0.72,
  poor: 0.5,
};

/**
 * 인식된 손상 키워드별 추가 차감(정가 대비 고정 비율). 상태 배수와 별개로,
 * 명시적 파손이 확인되면 한 번 더 깎는다. 여러 개면 합산(상한 0.6).
 */
export const DAMAGE_HAIRCUT: { pattern: RegExp; cut: number }[] = [
  { pattern: /crack|broken|shatter|깨|파손|균열/i, cut: 0.25 },
  { pattern: /screen|lcd|디스플레이|액정|화면/i, cut: 0.15 },
  { pattern: /battery|배터리/i, cut: 0.1 },
  { pattern: /water|liquid|침수|물/i, cut: 0.3 },
  { pattern: /scratch|dent|scuff|기스|찍힘|스크래치/i, cut: 0.05 },
  { pattern: /missing|없음|분실|부품/i, cut: 0.1 },
];
export const DAMAGE_HAIRCUT_MAX = 0.6;

/** USD → MMK 환율. 시장 환율 기준으로 주기적으로 조정. (2026-08 기준 대략치) */
export const USD_MMK_RATE = 4700;
/** 기타 통화 → MMK 대략 환율 (fallback 용). */
export const FX_TO_MMK: Record<string, number> = {
  MMK: 1,
  USD: USD_MMK_RATE,
  SGD: 3500,
  THB: 135,
  EUR: 5100,
  GBP: 6000,
  JPY: 32,
  CNY: 660,
};

export function toMmk(amount: number, currency: string): number | null {
  const rate = FX_TO_MMK[currency?.toUpperCase?.() ?? ""];
  if (!rate || !Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * rate);
}

export type DepreciationInput = {
  msrpMmk: number;
  ageMonths: number | null;
  condition: Enums<"product_condition"> | null;
  categorySlug: string | null;
  /** 자유 텍스트 손상/특이사항 (attributes 값들, summary 등) */
  damageText?: string;
};

export type DepreciationResult = {
  estimateMmk: number;
  /** 정가 대비 최종 적용된 총 감가율 (0..1) */
  totalDepreciation: number;
  ageMonths: number | null;
  ageDepreciation: number;
  conditionFactor: number;
  damageHaircut: number;
  curve: DepreciationCurve;
  /** 나이를 모를 때 true — 신뢰도 낮음 표시용 */
  ageAssumed: boolean;
};

export function curveFor(categorySlug: string | null): DepreciationCurve {
  return (
    (categorySlug && CATEGORY_DEPRECIATION[categorySlug]) ||
    CATEGORY_DEPRECIATION.default
  );
}

/** 나이에 따른 잔존 비율 (0..1). 0개월 = 1.0. */
function ageResidual(ageMonths: number, curve: DepreciationCurve): number {
  const years = Math.max(0, ageMonths) / 12;
  let residual: number;
  if (years <= 1) {
    residual = 1 - curve.year1Drop * years;
  } else {
    residual = (1 - curve.year1Drop) * Math.pow(1 - curve.annualAfter, years - 1);
  }
  return Math.max(curve.residualFloor, residual);
}

function damageHaircut(text: string | undefined): number {
  if (!text) return 0;
  let cut = 0;
  for (const rule of DAMAGE_HAIRCUT) if (rule.pattern.test(text)) cut += rule.cut;
  return Math.min(cut, DAMAGE_HAIRCUT_MAX);
}

/** 나이 미상일 때 카테고리별로 가정하는 기본 사용기간(개월). */
const ASSUMED_AGE_MONTHS: Record<string, number> = {
  phones: 24,
  laptops: 30,
  audio: 24,
  electronics: 24,
  kitchen: 30,
  laundry: 36,
  home: 36,
  fashion: 18,
  bags: 24,
  shoes: 15,
  default: 24,
};

export function estimateFromMsrp(input: DepreciationInput): DepreciationResult {
  const curve = curveFor(input.categorySlug);
  const ageAssumed = input.ageMonths == null;
  const ageMonths = ageAssumed
    ? (input.categorySlug ? ASSUMED_AGE_MONTHS[input.categorySlug] : undefined) ??
      ASSUMED_AGE_MONTHS.default
    : Math.max(0, input.ageMonths as number);

  const residual = ageResidual(ageMonths, curve);
  const ageDepreciation = 1 - residual;

  const conditionFactor = input.condition ? CONDITION_FACTOR[input.condition] : 0.85;
  const cut = damageHaircut(input.damageText);

  let estimate = input.msrpMmk * residual * conditionFactor;
  estimate -= input.msrpMmk * cut;
  estimate = Math.max(estimate, input.msrpMmk * curve.residualFloor * 0.5);
  const estimateMmk = Math.max(0, Math.round(estimate / 1000) * 1000);

  return {
    estimateMmk,
    totalDepreciation: Math.min(1, Math.max(0, 1 - estimateMmk / input.msrpMmk)),
    ageMonths: ageAssumed ? null : ageMonths,
    ageDepreciation,
    conditionFactor,
    damageHaircut: cut,
    curve,
    ageAssumed,
  };
}

/**
 * "구매 후 6개월", "1년 3개월", "2 years", "약 1년", "2023년 구입" 같은 자유 텍스트를
 * 개월 수로 파싱. 못 알아보면 null.
 */
export function parseAgeMonths(text: string | null | undefined, now = new Date()): number | null {
  if (!text) return null;
  const s = String(text).toLowerCase().trim();

  // "2023" / "2023년" / "2023-04" 같은 구입 시점 → 경과 개월
  const yearMatch = s.match(/(20\d{2})\s*[.\-/년]?\s*(\d{1,2})?/);
  if (yearMatch) {
    const y = Number(yearMatch[1]);
    const mo = yearMatch[2] ? Number(yearMatch[2]) : 6;
    if (y >= 2005 && y <= now.getFullYear() && mo >= 1 && mo <= 12) {
      const months =
        (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - mo);
      if (months >= 0 && months < 360) return months;
    }
  }

  let months = 0;
  let matched = false;
  const yr = s.match(/(\d+(?:\.\d+)?)\s*(?:년|year|yr|y\b)/);
  if (yr) {
    months += Math.round(parseFloat(yr[1]) * 12);
    matched = true;
  }
  const mo = s.match(/(\d+)\s*(?:개월|달|month|mo\b|m\b)/);
  if (mo) {
    months += Number(mo[1]);
    matched = true;
  }
  if (!matched) {
    if (/(반년|half a year|6\s*months?)/.test(s)) return 6;
    return null;
  }
  return months >= 0 && months < 360 ? months : null;
}
