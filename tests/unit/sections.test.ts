import { describe, expect, it } from 'vitest';
import { extensionItems, visibleSections } from '../../src/core/sections';
import { parseResume } from '../../src/core/schema';

describe('extensionItems', () => {
  it('accepts strings and objects with a title or a name', () => {
    expect(extensionItems(['a', { name: 'b', url: 'https://x.org', event: 'E', date: '2025' }])).toEqual([
      { title: 'a' },
      { title: 'b', url: 'https://x.org', date: '2025', meta: 'E', summary: undefined },
    ]);
  });

  it('drops unsafe URLs and rejects lists that are not lists of entries', () => {
    expect(extensionItems([{ title: 't', url: 'javascript:alert(1)' }])?.[0]?.url).toBeUndefined();
    expect(extensionItems('text')).toBeUndefined();
    expect(extensionItems([{ other: 1 }])).toBeUndefined();
    expect(extensionItems([])).toBeUndefined();
  });
});

describe('visibleSections', () => {
  const resume = parseResume({
    basics: { name: 'Ada' },
    work: [{ name: 'A' }],
    skills: [{ name: 's' }],
    volunteer: [{ organization: 'v' }],
    languages: [{ language: 'it' }],
    'x-talks': ['t'],
    'x-flag': true,
    meta: { themeOptions: { order: ['work', 'x-talks'], hide: ['volunteer'] } },
  });

  it('follows the theme order, then the default order, without hidden or empty sections', () => {
    expect(visibleSections(resume).map((section) => section.key)).toEqual(['work', 'x-talks', 'skills', 'education']);
  });
});
