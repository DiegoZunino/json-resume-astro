import { describe, expect, it } from 'vitest';
import { formatDate, formatRange, referenceDate, toMonths } from '../../src/core/dates';

const ref = new Date(Date.UTC(2026, 9, 5));

describe('dates', () => {
  it('counts months from partial ISO dates; a missing date is the reference date', () => {
    expect(toMonths('2021-10', ref)).toBe(2021 * 12 + 9);
    expect(toMonths('2021', ref)).toBe(2021 * 12);
    expect(toMonths(undefined, ref)).toBe(2026 * 12 + 9);
  });

  it('formats dates per locale, in UTC', () => {
    expect(formatDate('2021-10', 'it', 'oggi')).toBe('ott 2021');
    expect(formatDate('2021-10', 'en', 'present')).toBe('Oct 2021');
    expect(formatDate('2015', 'it', 'oggi')).toBe('2015');
    expect(formatRange('2024-01', undefined, 'it', 'oggi')).toBe('gen 2024 – oggi');
    expect(formatRange(undefined, undefined, 'it', 'oggi')).toBe('');
  });

  it('uses meta.lastModified as the reference date when it is valid', () => {
    const fallback = new Date(0);
    expect(referenceDate('2026-10-03', fallback).toISOString()).toBe('2026-10-03T00:00:00.000Z');
    expect(referenceDate('soon', fallback)).toBe(fallback);
    expect(referenceDate(undefined, fallback)).toBe(fallback);
  });
});
