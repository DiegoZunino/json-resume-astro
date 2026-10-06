import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseResume } from '../../src/core/schema';

const fixture = (name: string) => JSON.parse(readFileSync(new URL(`../../fixtures/${name}`, import.meta.url), 'utf8'));

describe('parseResume', () => {
  it('accepts the fixtures and keeps extensions', () => {
    const resume = parseResume(fixture('resume.it.json'));
    expect(resume.basics.name).toBe('Ada Esempio');
    expect(resume['x-talks']).toBeDefined();
    expect(resume.certificates[0]?.['x-validUntil']).toBe('2027-01');
  });

  it('fills missing sections with empty lists', () => {
    const resume = parseResume({ basics: { name: 'Min' } });
    expect(resume.work).toEqual([]);
    expect(resume.basics.profiles).toEqual([]);
  });

  it('lists every invalid field with its path', () => {
    expect(() =>
      parseResume({ basics: { name: 'Ada', email: 'not-an-email' }, work: [{ startDate: '2024-13-99x' }] }),
    ).toThrow(/basics\.email[\s\S]*work\.0\.startDate/);
  });

  it('rejects non-http URLs, which would end up in href attributes', () => {
    expect(() => parseResume({ basics: { name: 'Ada', url: 'javascript:alert(1)' } })).toThrow(/basics\.url/);
    expect(() =>
      parseResume({ basics: { name: 'Ada', profiles: [{ network: 'x', url: 'data:text/html,hi' }] } }),
    ).toThrow(/basics\.profiles\.0\.url/);
  });

  it('takes a cover as one or two absolute image URLs', () => {
    const cover = (value: unknown) =>
      parseResume({ basics: { name: 'Ada' }, meta: { themeOptions: { cover: value } } });
    expect(cover({ light: 'https://example.org/a.png' }).meta.themeOptions?.cover?.dark).toBeUndefined();
    expect(() => cover({ light: 'https://example.org/a.png', dark: 'file:///b.png' })).toThrow(/cover\.dark/);
    expect(() => cover({ dark: 'https://example.org/b.png' })).toThrow(/cover\.light/);
  });

  it('accepts lastModified only as a real date or date-time', () => {
    const meta = (lastModified: string) => () => parseResume({ basics: { name: 'Ada' }, meta: { lastModified } });
    expect(meta('2026-10-05')).not.toThrow();
    expect(meta('2026-10-05T10:00:00Z')).not.toThrow();
    expect(meta('2026-13-01')).toThrow(/meta\.lastModified/);
    expect(meta('2026-02-31')).toThrow(/meta\.lastModified/);
  });
});
