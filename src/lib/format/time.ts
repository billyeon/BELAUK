type TimeMessages = {
  justNow: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
  daysAgo: (n: number) => string;
};

/** Coarse "x ago" using pre-resolved message templates from next-intl `t`. */
export function relativeTime(iso: string | null | undefined, m: TimeMessages): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const diffMin = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (diffMin < 1) return m.justNow;
  if (diffMin < 60) return m.minutesAgo(diffMin);
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return m.hoursAgo(diffHr);
  return m.daysAgo(Math.round(diffHr / 24));
}
