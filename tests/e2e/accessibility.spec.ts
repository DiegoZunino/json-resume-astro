import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { contrast } from './helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

async function expandAll(page: Page) {
  const toggle = page.getByRole('button', { name: 'Apri tutti' });
  if (await toggle.isVisible()) await toggle.click();
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    for (const path of ['/', '/en/', '/accessibilita/']) {
      test(`axe finds no violations on ${path}, with every role open`, async ({ page }) => {
        await page.goto(path);
        await expandAll(page);
        const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
      });
    }

    test('the focus indicator contrasts at least 3:1 with the page (WCAG 1.4.11)', async ({ page }) => {
      await page.goto('/');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      const [outline, background] = await page.evaluate(() => [
        getComputedStyle(document.activeElement!).outlineColor,
        getComputedStyle(document.body).backgroundColor,
      ]);
      expect(contrast(outline!, background!)).toBeGreaterThanOrEqual(3);
    });
  });
}

test('keyboard order: skip link, theme, language, then the actions', async ({ page }) => {
  await page.goto('/');
  const names: string[] = [];
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    names.push(await page.evaluate(() => (document.activeElement?.textContent ?? '').trim().replace(/\s+/g, ' ')));
  }
  expect(names[0]).toBe('Vai al contenuto');
  expect(names[1]).toMatch(/^Tema/);
  expect(names[2]).toBe('English');
  expect(names[3]).toMatch(/^Scarica il CV/);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('interactive targets are at least 24×24 CSS pixels (WCAG 2.5.8)', async ({ page }) => {
  await page.goto('/');
  const small = await page.$$eval('button:not([hidden]), .actions a, nav a', (elements) =>
    elements
      .map((el) => ({ text: el.textContent?.trim(), ...el.getBoundingClientRect().toJSON() }))
      .filter((box) => box.width > 0 && (box.width < 24 || box.height < 24)),
  );
  expect(small).toEqual([]);
});

test('reflows at 320 CSS pixels without horizontal scrolling (WCAG 1.4.10)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
