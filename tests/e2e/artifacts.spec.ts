import { expect, test } from '@playwright/test';
import { PRIVATE_VALUES } from './helpers';

test.describe('published files', () => {
  test('never contain private fields', async ({ request }) => {
    for (const path of ['/', '/en/', '/resume.json', '/resume.en.json', '/accessibilita/', '/en/accessibility/']) {
      const body = await (await request.get(path)).text();
      for (const value of PRIVATE_VALUES) expect(body, `${value} in ${path}`).not.toContain(value);
    }
  });

  test('the PDF CV of each locale is a small A4 document with embedded TrueType fonts', async ({ request }) => {
    for (const locale of ['it', 'en']) {
      const response = await request.get(`/cv-${locale}.pdf`);
      expect(response.ok()).toBe(true);
      const pdf = (await response.body()).toString('latin1');
      expect(pdf.startsWith('%PDF-')).toBe(true);
      const pages = pdf.match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
      expect(pages).toBeGreaterThanOrEqual(1);
      expect(pages).toBeLessThanOrEqual(2);
      expect(pdf).not.toContain('/Type3');
      expect(pdf).toContain('/MediaBox [0 0 594.95996 841.91998]');
    }
  });

  test('social cards are 1200×630 PNGs and are referenced by the pages', async ({ page, request }) => {
    const png = await (await request.get('/og-it.png')).body();
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
    await page.goto('/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og-it\.png$/);
  });

  test('pages used only to produce artifacts are not published', async ({ request }) => {
    expect((await request.get('/print/')).status()).toBe(404);
    expect((await request.get('/og/')).status()).toBe(404);
  });

  test('robots.txt, sitemap, favicon and structured data are in place', async ({ page, request }) => {
    expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: ');
    const sitemap = await (await request.get('/sitemap-0.xml')).text();
    expect(sitemap).toContain('/en/');
    expect(sitemap).not.toContain('/print/');
    expect((await request.get('/favicon.svg')).headers()['content-type']).toContain('image/svg+xml');
    await page.goto('/');
    const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
    expect(jsonLd).toMatchObject({ '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name: 'Ada Esempio' } });
    await expect(page.locator('meta[http-equiv="content-security-policy"]')).toHaveAttribute('content', /script-src/);
  });
});
