import { describe, expect, it } from 'vitest';
import { publicResume } from '../../src/core/public';
import { parseResume } from '../../src/core/schema';

describe('publicResume', () => {
  const resume = parseResume({
    basics: { name: 'Ada', 'x-notes': 'internal', location: { city: 'Torino', 'x-street': 'internal' } },
    work: [{ name: 'Uno', position: 'EM', 'x-sources': 'internal' }],
    certificates: [{ name: 'AZ-204', 'x-validUntil': '2027-05' }],
    volunteer: [{ organization: 'Hidden' }],
    'x-talks': [{ title: 't', url: 'https://example.org', 'x-notes': 'internal', rank: 3 }, 'plain', 42],
    'x-hidden': ['secret list'],
    'x-flag': true,
    notes: 'internal',
    meta: {
      version: '1',
      'x-sources': 'private/path',
      themeOptions: { expanded: 1, hide: ['volunteer', 'x-hidden'], labels: { 'x-talks': 'Talk' } },
    },
  });
  const out = publicResume(resume);
  const text = JSON.stringify(out);

  it('keeps only declared keys, at every level', () => {
    expect(text).not.toContain('internal');
    expect(out).not.toHaveProperty('x-flag');
    expect(out).not.toHaveProperty('notes');
    expect(out.basics).toEqual({ name: 'Ada', location: { city: 'Torino' }, profiles: [] });
  });

  it('keeps the documented extensions: x- lists and certificate validity', () => {
    expect(out['x-talks']).toEqual([{ title: 't', url: 'https://example.org' }, 'plain']);
    expect(text).toContain('"x-validUntil":"2027-05"');
  });

  it('leaves out hidden sections and tool metadata', () => {
    expect(out).not.toHaveProperty('volunteer');
    expect(out).not.toHaveProperty('x-hidden');
    expect(out.meta).toEqual({
      version: '1',
      themeOptions: { expanded: 1, hide: ['volunteer', 'x-hidden'], labels: { 'x-talks': 'Talk' } },
    });
  });
});
