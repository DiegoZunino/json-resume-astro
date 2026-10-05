import { expect, test } from '@playwright/test';
import { extractText, getDocumentProxy } from 'unpdf';

/**
 * The text of the PDF in the order a recruiting system reads it (the order of the file,
 * not of the page): every point under its own role, every title before its date.
 */
test.describe('PDF text order', () => {
  test.skip(({ isMobile }) => isMobile, 'the PDF is the same for every device');

  test('points stay under their role and titles come before dates', async ({ request }) => {
    const body = await (await request.get('/cv-it.pdf')).body();
    const { text } = await extractText(await getDocumentProxy(new Uint8Array(body)), { mergePages: true });
    const at = (needle: string) => {
      const index = text.indexOf(needle);
      expect(index, needle).toBeGreaterThanOrEqual(0);
      return index;
    };
    // A highlight of the first role sits between that role and the next one.
    expect(at('Rilasci settimanali')).toBeGreaterThan(at('Engineering Manager'));
    expect(at('Rilasci settimanali')).toBeLessThan(at('Tech Lead'));
    // A dated entry: title first, then its meta line.
    expect(at('Un talk di esempio')).toBeLessThan(at('Conferenza di esempio'));
  });
});
