import { describe, expect, it } from 'vitest';
import { entriesFor, extensionEntries } from '../../src/core/entries';
import { parseResume } from '../../src/core/schema';
import { languageLine } from '../../src/core/text';

const text = { intl: 'en-GB', ongoing: 'present' };

describe('entriesFor', () => {
  const resume = parseResume({
    basics: { name: 'Ada' },
    projects: [{ name: 'P', url: 'https://x.org', entity: 'Acme', roles: ['lead', 'dev'], startDate: '2024-03' }],
    volunteer: [{ organization: 'Club', position: 'Board', startDate: '2023', endDate: '2025' }],
    awards: [{ title: 'Prize', awarder: 'Jury', date: '2022-05-01' }],
    publications: [{ name: 'Article', publisher: 'Blog', releaseDate: '2021-01' }],
    interests: [{ name: 'Music', keywords: ['jazz', 'piano'] }],
    references: [{ name: 'Bob', reference: 'Great' }],
  });

  it('maps every list section to title, link, meta line and text', () => {
    expect(entriesFor('projects', resume, text)[0]).toMatchObject({
      title: 'P',
      url: 'https://x.org',
      meta: 'Acme · lead, dev · Mar 2024 – present',
    });
    expect(entriesFor('volunteer', resume, text)[0]).toMatchObject({ title: 'Club · Board', meta: '2023 – 2025' });
    expect(entriesFor('awards', resume, text)[0]).toMatchObject({ meta: 'Jury · May 2022' });
    expect(entriesFor('publications', resume, text)[0]).toMatchObject({ meta: 'Blog · Jan 2021' });
    expect(entriesFor('interests', resume, text)[0]).toMatchObject({ summary: 'jazz, piano' });
    expect(entriesFor('references', resume, text)[0]).toEqual({ title: 'Bob', summary: 'Great' });
  });
});

describe('extensionEntries', () => {
  const options = { ...text, upcoming: 'upcoming', reference: new Date(Date.UTC(2026, 9, 5)) };

  it('marks a future date as upcoming, computed from the reference date', () => {
    const [next, past] = extensionEntries(
      [
        { title: 'Next', meta: 'Conf', date: '2026-12' },
        { title: 'Past', meta: 'Conf', date: '2026-01' },
      ],
      options,
    );
    expect(next!.meta).toBe('Conf · Dec 2026 · upcoming');
    expect(past!.meta).toBe('Conf · Jan 2026');
  });

  it('does not repeat a bare year already in the event name, and keeps free-text dates', () => {
    const [same, free] = extensionEntries(
      [
        { title: 'A', meta: 'AI Week 2026', date: '2026' },
        { title: 'B', date: 'spring' },
      ],
      options,
    );
    expect(same!.meta).toBe('AI Week 2026');
    expect(free!.meta).toBe('spring');
  });
});

describe('languageLine', () => {
  it('puts the level in brackets, flattening a level that has its own', () => {
    expect(languageLine('Italian', 'Native')).toBe('Italian (Native)');
    expect(languageLine('English', 'B2 (CEFR)')).toBe('English (B2, CEFR)');
    expect(languageLine('German', undefined)).toBe('German');
  });
});
