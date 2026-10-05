import { describe, expect, it } from 'vitest';
import { entriesFor, extensionEntries, listLanguage } from '../../src/core/entries';
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
  const options = {
    ...text,
    upcoming: 'upcoming',
    reference: new Date(Date.UTC(2026, 9, 5)),
    locale: 'en-GB',
    inLanguage: (name: string) => `in ${name}`,
  };

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

describe('extensionEntries and languages', () => {
  it('marks an entry in another language, for the reader and for screen readers', () => {
    const options = {
      ...text,
      upcoming: 'upcoming',
      reference: new Date(Date.UTC(2026, 9, 5)),
      locale: 'en-GB',
      inLanguage: (name: string) => `in ${name}`,
    };
    const [italian, english] = extensionEntries(
      [
        { title: 'Un talk', meta: 'Conf', lang: 'it' },
        { title: 'A talk', meta: 'Conf', lang: 'en' },
      ],
      options,
    );
    expect(italian).toMatchObject({ lang: 'it', meta: 'Conf · in Italian' });
    expect(english).toMatchObject({ lang: undefined, meta: 'Conf' });
  });

  it('says a language shared by the whole list once, above it', () => {
    const items = [
      { title: 'Uno', meta: 'Conf', lang: 'it' },
      { title: 'Due', meta: 'Conf', lang: 'it' },
    ];
    const options = {
      ...text,
      upcoming: 'upcoming',
      reference: new Date(Date.UTC(2026, 9, 5)),
      locale: 'en-GB',
      inLanguage: (name: string) => `in ${name}`,
    };
    expect(extensionEntries(items, options).map((entry) => [entry.meta, entry.lang])).toEqual([
      ['Conf', 'it'],
      ['Conf', 'it'],
    ]);
    expect(listLanguage(items, 'en-GB', options.inLanguage)).toEqual({ note: 'In Italian.', lang: 'it' });
    expect(listLanguage(items, 'it-IT', options.inLanguage)).toBeUndefined();
  });
});

describe('languageLine', () => {
  it('puts the level in brackets, flattening a level that has its own', () => {
    expect(languageLine('Italian', 'Native')).toBe('Italian (Native)');
    expect(languageLine('English', 'B2 (CEFR)')).toBe('English (B2, CEFR)');
    expect(languageLine('German', undefined)).toBe('German');
  });
});
