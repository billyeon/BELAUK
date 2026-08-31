/** Format a MMK integer amount. BELAUK shows whole kyat, grouped. */
export function formatMMK(amount: number | null | undefined, locale = "my"): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat(locale === "my" ? "en-US" : locale).format(Math.round(amount));
}

export function formatRange(
  min: number | null | undefined,
  max: number | null | undefined,
  locale = "my",
): string {
  if (min == null || max == null) return "—";
  return `${formatMMK(min, locale)} – ${formatMMK(max, locale)}`;
}

/** Parse a user-typed price ("285,000", "285000 ks") into an integer, or null. */
export function parseMMK(input: string): number | null {
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : null;
}
