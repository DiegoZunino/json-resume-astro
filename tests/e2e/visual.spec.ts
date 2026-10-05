import { expect, test } from '@playwright/test';

/** Visual regression on the fixture (stable data, fixed reference date). */
for (const colorScheme of ['light', 'dark'] as const) {
  test(`home page, ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`home-${colorScheme}.png`, { fullPage: true });
  });
}
