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
});
