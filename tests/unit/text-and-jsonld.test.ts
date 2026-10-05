import { describe, expect, it } from 'vitest';
import { profilePage, serializeJsonLd } from '../../src/core/jsonld';
import { parseResume } from '../../src/core/schema';
import { displayUrl, initials, shorten } from '../../src/core/text';

describe('text helpers', () => {
  it('shortens on a sentence or word boundary', () => {
    expect(shorten('Short.')).toBe('Short.');
    const long = 'First sentence is here and it is long enough. ' + 'word '.repeat(60);
    expect(shorten(long, 80)).toBe('First sentence is here and it is long enough.');
    expect(shorten('word '.repeat(60), 40).endsWith('…')).toBe(true);
    expect(shorten('word '.repeat(60), 40).length).toBeLessThanOrEqual(41);
  });

  it('builds initials and readable URLs', () => {
    expect(initials('Ada Lovelace Byron')).toBe('AB');
    expect(initials('Ada')).toBe('A');
    expect(displayUrl('https://www.linkedin.com/in/x/')).toBe('linkedin.com/in/x');
  });
});

describe('structured data', () => {
  it('describes the person of a ProfilePage', () => {
    const resume = parseResume({
      basics: { name: 'Ada', label: 'EM', profiles: [{ url: 'https://github.com/ada' }] },
      work: [{ name: 'Now Inc', startDate: '2020' }],
    });
    const data = profilePage(resume, 'https://ada.example/') as { mainEntity: Record<string, unknown> };
    expect(data.mainEntity).toMatchObject({
      '@type': 'Person',
      name: 'Ada',
      jobTitle: 'EM',
      sameAs: ['https://github.com/ada'],
    });
    expect(data.mainEntity.worksFor).toEqual({ '@type': 'Organization', name: 'Now Inc' });
  });

  it('cannot be closed early by a value containing </script>', () => {
    const json = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(json).not.toContain('</script>');
    expect(JSON.parse(json)).toEqual({ name: '</script><script>alert(1)</script>' });
  });
});
