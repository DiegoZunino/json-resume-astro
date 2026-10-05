/**
 * Partial ISO 8601 dates (YYYY, YYYY-MM, YYYY-MM-DD). Everything is computed in UTC
 * against an explicit reference date, so the same data always produces the same page.
 */

export type MonthIndex = number;

/** Months since year 0. A missing date means "ongoing" and resolves to the reference date. */
export function toMonths(date: string | undefined, reference: Date): MonthIndex {
  if (!date) return reference.getUTCFullYear() * 12 + reference.getUTCMonth();
  const [year = 0, month = 1] = date.split('-').map(Number);
  return year * 12 + (month - 1);
}

/** The date the resume is "as of": `meta.lastModified` if valid, otherwise the fallback. */
export function referenceDate(lastModified: string | undefined, fallback: Date): Date {
  if (!lastModified) return fallback;
  const parsed = new Date(lastModified);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

/** "ott 2021" / "Oct 2021", or the bare year when the month is missing. */
export function formatDate(date: string | undefined, locale: string, ongoing: string): string {
  if (!date) return ongoing;
  const [year = 0, month] = date.split('-').map(Number);
  if (!month) return String(year);
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

/** Long date for "updated on" lines: "5 ottobre 2026" / "October 5, 2026". */
export function formatLongDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    date,
  );
}

export function formatRange(
  start: string | undefined,
  end: string | undefined,
  locale: string,
  ongoing: string,
): string {
  if (!start) return end ? formatDate(end, locale, ongoing) : '';
  return `${formatDate(start, locale, ongoing)} – ${formatDate(end, locale, ongoing)}`;
}

/** True if a partial date is after `today`, at its own precision (a day, a month, a year). */
export function isAfter(date: string, today: Date): boolean {
  const [year = 0, month, day] = date.split('-').map(Number);
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth() + 1;
  const d = today.getUTCDate();
  if (year !== y) return year > y;
  if (month === undefined) return false;
  if (month !== m) return month > m;
  return day !== undefined && day > d;
}

/** The build date: SOURCE_DATE_EPOCH (seconds) for reproducible builds, otherwise now. */
export function buildDate(env: Record<string, string | undefined> = process.env): Date {
  const epoch = Number(env.SOURCE_DATE_EPOCH);
  return Number.isFinite(epoch) && epoch > 0 ? new Date(epoch * 1000) : new Date();
}
