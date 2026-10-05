import { describe, expect, it } from 'vitest';
import { buildTimeline, groupByOrganisation, yearTicks } from '../../src/core/timeline';

const ref = new Date(Date.UTC(2026, 0, 1));

describe('buildTimeline', () => {
  const work = [
    { name: 'A', startDate: '2022', endDate: undefined },
    { name: 'B', startDate: '2016', endDate: '2021-12' },
    { name: 'C' },
  ];

  it('keeps every role, bars only for dated ones', () => {
    const { entries } = buildTimeline(work, ref);
    expect(entries.map((entry) => entry.item.name)).toEqual(['A', 'B', 'C']);
    expect(entries[2]?.bar).toBeUndefined();
    expect(entries[0]?.current).toBe(true);
  });

  it('places bars proportionally on a shared axis', () => {
    const { entries } = buildTimeline(work, ref);
    expect(entries[1]?.bar).toEqual({ x: 0, width: 60 });
    expect(entries[0]?.bar?.x).toBe(60);
    expect((entries[0]?.bar?.x ?? 0) + (entries[0]?.bar?.width ?? 0)).toBeCloseTo(100, 5);
  });

  it('keeps every bar inside the axis even when the reference date is older than the data', () => {
    const stale = new Date(Date.UTC(2020, 0, 1));
    const { entries } = buildTimeline(work, stale);
    for (const { bar } of entries.filter((entry) => entry.bar)) {
      expect(bar!.x).toBeGreaterThanOrEqual(0);
      expect(bar!.width).toBeGreaterThan(0);
      expect(bar!.x + bar!.width).toBeLessThanOrEqual(100);
    }
  });

  it('works without any date', () => {
    expect(buildTimeline<{ name: string; startDate?: string }>([{ name: 'X' }], ref)).toEqual({
      entries: [{ item: { name: 'X' }, current: true }],
      years: [],
    });
  });
});

describe('yearTicks', () => {
  it('starts at the first year and spaces labels so they do not collide', () => {
    const ticks = yearTicks(2010 * 12 + 9, 2026 * 12 + 9);
    expect(ticks[0]).toEqual({ year: 2010, x: 0 });
    expect(ticks.map((tick) => tick.year)).toEqual([2010, 2014, 2018, 2022, 2026]);
    ticks.slice(1).forEach((tick, i) => expect(tick.x - ticks[i]!.x).toBeGreaterThanOrEqual(10));
  });
});

describe('groupByOrganisation', () => {
  it('groups consecutive roles at the same organisation', () => {
    const groups = groupByOrganisation([{ name: 'A' }, { name: 'A' }, { name: 'B' }, { name: 'A' }, {}]);
    expect(groups.map((group) => [group.name, group.roles.length])).toEqual([
      ['A', 2],
      ['B', 1],
      ['A', 1],
      [undefined, 1],
    ]);
  });
});
