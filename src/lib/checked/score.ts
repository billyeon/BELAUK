export type CheckedInput = {
  photoCount: number;
  hasCondition: boolean;
  hasPurchasePeriod: boolean;
  hasVideo: boolean;
  hasPurchaseProof: boolean;
  priceReviewed: boolean;
};

export type CheckedStatus = {
  photos_ok: boolean;
  condition_provided: boolean;
  purchase_period_provided: boolean;
  has_video: boolean;
  has_purchase_proof: boolean;
  price_reviewed: boolean;
  /** number of items satisfied, out of 6 */
  score: number;
};

const MIN_PHOTOS = 3;

/** PRD §4.2 — completeness of submitted info, NOT a quality guarantee. */
export function computeChecked(input: CheckedInput): CheckedStatus {
  const items = {
    photos_ok: input.photoCount >= MIN_PHOTOS,
    condition_provided: input.hasCondition,
    purchase_period_provided: input.hasPurchasePeriod,
    has_video: input.hasVideo,
    has_purchase_proof: input.hasPurchaseProof,
    price_reviewed: input.priceReviewed,
  };
  const score = Object.values(items).filter(Boolean).length;
  return { ...items, score };
}

export const CHECKED_ITEM_KEYS = [
  "photos",
  "condition",
  "purchasePeriod",
  "video",
  "proof",
  "priceReviewed",
] as const;

export function checkedItemState(status: Partial<CheckedStatus> | null | undefined) {
  const s = status ?? {};
  return {
    photos: Boolean(s.photos_ok),
    condition: Boolean(s.condition_provided),
    purchasePeriod: Boolean(s.purchase_period_provided),
    video: Boolean(s.has_video),
    proof: Boolean(s.has_purchase_proof),
    priceReviewed: Boolean(s.price_reviewed),
  };
}
