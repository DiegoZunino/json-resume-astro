/**
 * The career timeline: every role keeps its place in the list; roles with a start
 * date also get a bar on a shared time axis.
 */
import { toMonths, type MonthIndex } from './dates';

export interface Dated {
  startDate?: string | undefined;
  endDate?: string | undefined;
}

export interface Bar {
  /** Start of the bar, 0-100 along the axis. */
  x: number;
  /** Length of the bar, 0-100. */
  width: number;
}

export interface TimelineEntry<T> {
  item: T;
  current: boolean;
  bar?: Bar;
}

export interface Timeline<T> {
  entries: TimelineEntry<T>[];
  /** Year ticks inside the axis range. */
  years: { year: number; x: number }[];
}

export function buildTimeline<T extends Dated>(items: readonly T[], reference: Date, minWidth = 1.2): Timeline<T> {
  const dated = items.filter((item) => item.startDate);
  if (!dated.length) return { entries: items.map((item) => ({ item, current: !item.endDate })), years: [] };

  // An end month is inclusive: a role that ends in December covers December.
  const endOf = (item: Dated) =>
    item.endDate ? toMonths(item.endDate, reference) + 1 : toMonths(undefined, reference);
  const start = Math.min(...dated.map((item) => toMonths(item.startDate, reference)));
  const end = Math.max(toMonths(undefined, reference), ...dated.map(endOf));
  const span = Math.max(end - start, 1);
  const at = (month: MonthIndex) => ((month - start) / span) * 100;

  const entries = items.map((item) => {
    const current = !item.endDate;
    if (!item.startDate) return { item, current };
    const x = at(toMonths(item.startDate, reference));
    const width = Math.max(at(endOf(item)) - x, minWidth);
    return { item, current, bar: { x: round(x), width: round(Math.min(width, 100 - x)) } };
  });

  return { entries, years: yearTicks(start, end) };
}

/**
 * Year labels: the year the axis starts in, at its left edge, then every other year
 * (every fourth on long careers) at its exact position, skipping labels that would collide.
 */
export function yearTicks(start: MonthIndex, end: MonthIndex): { year: number; x: number }[] {
  const span = Math.max(end - start, 1);
  const first = Math.floor(start / 12);
  const last = Math.floor(end / 12);
  const step = last - first > 12 ? 4 : 2;
  const ticks = [{ year: first, x: 0 }];
  for (let year = first + step; year <= last; year += step) {
    const x = round(((year * 12 - start) / span) * 100);
    if (x - ticks.at(-1)!.x >= 10) ticks.push({ year, x });
  }
  return ticks;
}

/** Consecutive roles at the same organisation, for the printed CV. */
export function groupByOrganisation<T extends { name?: string | undefined }>(
  items: readonly T[],
): { name?: string | undefined; roles: T[] }[] {
  const groups: { name?: string | undefined; roles: T[] }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && item.name && last.name === item.name) last.roles.push(item);
    else groups.push({ name: item.name, roles: [item] });
  }
  return groups;
}

const round = (value: number) => Math.round(value * 100) / 100;
