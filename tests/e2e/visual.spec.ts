import { expect, test } from '@playwright/test';

/** Visual regression on the fixture (stable data, fixed reference date). */
for (const colorScheme of ['light', 'dark'] as const) {
  test(`home page, ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/');
    // Every face and image loaded up front: a full-page capture reveals text and images below
    // the fold, and a late font or image would shift the layout between captures.
    await page.evaluate(async () => {
      await Promise.all([...document.fonts].map((face) => face.load().catch(() => undefined)));
      // Only the images on show: the cover of the other theme is lazy and never loads.
      const shown = [...document.images].filter((image) => image.checkVisibility());
      shown.forEach((image) => (image.loading = 'eager'));
      await Promise.all(shown.map((image) => image.decode().catch(() => undefined)));
    });
    await expect(page).toHaveScreenshot(`home-${colorScheme}.png`, { fullPage: true });
  });
}
