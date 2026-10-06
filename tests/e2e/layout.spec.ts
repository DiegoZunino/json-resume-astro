import { expect, test, type Locator, type Page } from '@playwright/test';

/** Boxes that share any area overlap. */
async function overlap(a: Locator, b: Locator): Promise<boolean> {
  const [p, q] = [await a.boundingBox(), await b.boundingBox()];
  if (!p || !q) return false;
  return p.x < q.x + q.width && q.x < p.x + p.width && p.y < q.y + q.height && q.y < p.y + p.height;
}

const workHeading = (page: Page) => page.getByRole('heading', { level: 2, name: 'Esperienza' });

test.describe('the Experience heading', () => {
  test('without JavaScript the roles start below the heading and no button is shown', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 800 } });
    const page = await context.newPage();
    await page.goto('/');
    const heading = await workHeading(page).boundingBox();
    const first = await page.locator('.roles > li').first().boundingBox();
    expect(first!.y).toBeGreaterThanOrEqual(heading!.y + heading!.height);
    await expect(page.locator('[data-toggle-all]')).toBeHidden();
    await context.close();
  });

  for (const zoom of ['130%', '150%']) {
    test(`with text at ${zoom} "open all" never covers the heading`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto('/');
      await page.evaluate((size) => (document.documentElement.style.fontSize = size), zoom);
      const toggle = page.locator('[data-toggle-all]');
      await expect(toggle).toBeVisible();
      expect(await overlap(toggle, workHeading(page))).toBe(false);
      expect(await overlap(toggle, page.locator('.roles > li').first())).toBe(false);
    });
  }
});

test.describe('the time axis', () => {
  test.skip(({ isMobile }) => isMobile, 'the axis is shown on wide screens only');

  test('marks the years of the role under the pointer or the keyboard focus', async ({ page }) => {
    await page.goto('/');
    const span = page.locator('[data-axis-span]');
    const roles = page.locator('[data-role][data-x]');
    const second = roles.nth(1);
    await second.hover();
    await expect(span).toHaveAttribute('data-on', '');
    await expect(span).toHaveAttribute('x', `${await second.getAttribute('data-x')}%`);
    await expect(page.locator('[data-axis-hint]')).toHaveText((await second.getAttribute('data-when'))!);

    await page.mouse.move(0, 0);
    await expect(span).not.toHaveAttribute('data-on', '');
    const third = roles.nth(2);
    await third.locator('button').focus();
    await expect(span).toHaveAttribute('x', `${await third.getAttribute('data-x')}%`);
  });
});

test('with reduced motion nothing moves on load', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  const names = await page.evaluate(() =>
    ['.wire .from', '.wire .stroke', '.wire .to', '.roles .span', '.roles .panel', '.now', '.hero .photo'].map(
      (selector) => [selector, getComputedStyle(document.querySelector(selector)!).animationName],
    ),
  );
  expect(names.filter(([, name]) => name !== 'none')).toEqual([]);
  await context.close();
});

test('Ctrl+P prints every role in full, even the closed ones', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h3 > button[aria-expanded="false"]').first()).toBeAttached();
  await page.emulateMedia({ media: 'print' });
  const panels = await page.locator('.roles .panel').evaluateAll((all) =>
    all.map((panel) => {
      const style = getComputedStyle(panel);
      return [style.display, style.opacity, panel.getBoundingClientRect().height > 0];
    }),
  );
  expect(panels.length).toBeGreaterThan(0);
  for (const panel of panels) expect(panel).toEqual(['block', '1', true]);
});

test.describe('the wire', () => {
  test('never points at an empty line end', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [1366, 900, 700, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const [from, line, to] = await Promise.all(
        ['.hero .from', '.hero .line', '.hero .to'].map((s) => page.locator(s).boundingBox()),
      );
      const oneLine = Math.abs(from!.y - to!.y) < 2;
      if (oneLine) {
        // Wire between the phrases.
        expect(line!.x).toBeGreaterThan(from!.x + from!.width - 1);
        expect(to!.x).toBeGreaterThan(line!.x + line!.width - 1);
      } else {
        // Stacked: phrase, wire, phrase, all from the left edge.
        expect(line!.y).toBeGreaterThan(from!.y);
        expect(to!.y).toBeGreaterThan(line!.y);
        expect(Math.round(line!.x)).toBe(Math.round(from!.x));
      }
    }
  });
});

test.describe('the cover', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`shows only the ${colorScheme} image, served by the site, behind the photo`, async ({ browser }) => {
      const context = await browser.newContext({ colorScheme, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto('/');
      const visible = page.locator('.cover img:visible');
      await expect(visible).toHaveCount(1);
      await expect(visible).toHaveAttribute('src', new RegExp(`^/_astro/cover-${colorScheme}.+\\.webp$`));
      await expect(page.locator('.cover')).toHaveAttribute('aria-hidden', 'true');
      // The photo rises into the band's lower part, as on a profile page.
      const [band, photo, name] = await Promise.all(
        ['.cover', '.hero .photo', 'h1'].map((s) => page.locator(s).boundingBox()),
      );
      expect(photo!.y).toBeLessThan(band!.y + band!.height);
      expect(photo!.y + photo!.height).toBeGreaterThan(band!.y + band!.height);
      // The name follows the photo: beside it on wide screens, below it on phones.
      expect(name!.y + name!.height).toBeGreaterThan(band!.y + band!.height);
      await context.close();
    });
  }
});
