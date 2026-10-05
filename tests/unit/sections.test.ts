import { describe, expect, it } from 'vitest';
import { extensionItems, extensionProblems, themeProblems, visibleSections } from '../../src/core/sections';
import { parseResume } from '../../src/core/schema';

describe('extensionItems', () => {
  it('accepts strings and objects with a title or a name', () => {
    expect(extensionItems(['a', { name: 'b', url: 'https://x.org', event: 'E', date: '2025' }])).toEqual([
      { title: 'a' },
      { title: 'b', url: 'https://x.org', date: '2025', meta: 'E', summary: undefined },
    ]);
  });

  it('drops unsafe URLs and ignores values that are not lists of entries', () => {
    expect(extensionItems([{ title: 't', url: 'javascript:alert(1)' }])?.[0]?.url).toBeUndefined();
    expect(extensionItems('text')).toBeUndefined();
    expect(extensionItems([{ other: 1 }])).toBeUndefined();
    expect(extensionItems([])).toBeUndefined();
  });

  it('skips a bad entry instead of hiding the whole list, and reports it', () => {
    expect(extensionItems(['ok', { other: 1 }, 42])).toEqual([{ title: 'ok' }]);
    expect(extensionProblems({ 'x-talks': ['ok', { other: 1 }], 'x-flag': true, basics: [] })).toEqual(['x-talks[1]']);
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

describe('themeProblems', () => {
  it('reports section keys that match nothing, such as a typo in printHide', () => {
    const resume = parseResume({
      basics: { name: 'Ada' },
      'x-talks': ['t'],
      meta: { themeOptions: { order: ['work', 'x-talks'], hide: ['volunteer'], printHide: ['x-talk'] } },
    });
    expect(themeProblems(resume)).toEqual(['themeOptions.printHide: "x-talk"']);
  });
});
