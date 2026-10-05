import { expect, test } from '@playwright/test';

test.describe('first screen', () => {
  test('says who, what and offers the actions without scrolling', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ada Esempio');
    await expect(page.getByText('Engineering Manager', { exact: true }).first()).toBeInViewport();
    const download = page.getByRole('link', { name: /Scarica il CV/ }).first();
    await expect(download).toBeInViewport();
    await expect(download).toHaveAttribute('href', '/cv-it.pdf');
    await expect(page.getByRole('link', { name: 'Email' }).first()).toBeInViewport();
  });

  test('shows the photo, optimised and sized for the screen', async ({ page }) => {
    await page.goto('/');
    const photo = page.locator('img.photo');
    await expect(photo).toHaveAttribute('src', /^\/_astro\/.+\.webp$/);
    await expect(photo).toHaveAttribute('srcset', /\d+w,/);
    expect(await photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  });

  test('has a stable accessible structure', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main')).toMatchAriaSnapshot({ name: 'main.aria.yml' });
  });
});

test.describe('timeline', () => {
  test('opens the two most recent roles; a click toggles a role', async ({ page }) => {
    await page.goto('/');
    const roles = page.getByRole('region', { name: 'Esperienza' }).getByRole('button', { expanded: true });
    await expect(roles).toHaveCount(2);
    const third = page.getByRole('button', { name: /Software Engineer/ });
    await expect(third).toHaveAttribute('aria-expanded', 'false');
    await third.click();
    await expect(third).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Servizi di integrazione con i sistemi dei clienti.')).toBeVisible();
  });

  test('"open all" expands and collapses every role', async ({ page }) => {
    await page.goto('/');
    const section = page.getByRole('region', { name: 'Esperienza' });
    await section.getByRole('button', { name: 'Apri tutti' }).click();
    await expect(section.getByRole('button', { expanded: false })).toHaveCount(0);
    await section.getByRole('button', { name: 'Chiudi tutti' }).click();
    await expect(section.getByRole('button', { expanded: true })).toHaveCount(0);
  });

  test('keeps a role without dates', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Sviluppatrice/ })).toBeVisible();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('shows every role and hides the controls that need a script', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Servizi di integrazione con i sistemi dei clienti.')).toBeVisible();
    await expect(page.getByRole('group', { name: 'Tema' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Apri tutti' })).toBeHidden();
  });
});

test.describe('languages and pages', () => {
  test('switches language and declares the alternates', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', /\/$/);
    await page.getByRole('navigation', { name: 'Lingua' }).getByRole('link', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/en\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('link', { name: /Download the CV/ }).first()).toHaveAttribute('href', '/cv-en.pdf');
    await expect(page.getByRole('navigation', { name: 'Language' })).toBeVisible();
  });

  test('links the source code, the data and the accessibility statement from the footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer).toContainText('progetto open source');
    await expect(footer.getByRole('link', { name: 'Il codice è su GitHub' })).toHaveAttribute('href', /github\.com/);
    await expect(footer.getByRole('link', { name: 'I dati: resume.json' })).toHaveAttribute('href', '/resume.json');
    await expect(footer.locator('time')).toHaveAttribute('datetime', '2026-10-05');
    await footer.getByRole('link', { name: 'Accessibilità' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dichiarazione di accessibilità');
  });

  // The host serves 404.html for unknown paths; the local static server does not, so the page is opened directly.
  test('has a helpful 404 page in every language', async ({ page }) => {
    await page.goto('/404.html');
    await expect(page.locator('section[lang="en"]')).toContainText('Page not found');
    await expect(page.getByRole('link', { name: 'Vai alla pagina principale' })).toHaveAttribute('href', '/');
  });
});

test.describe('theme', () => {
  test('Auto, Chiaro, Scuro: a radio group that remembers the choice', async ({ page }) => {
    await page.goto('/');
    const group = page.getByRole('group', { name: 'Tema' });
    await expect(group.getByRole('radio', { name: 'Auto' })).toBeChecked();
    await group.getByRole('radio', { name: 'Chiaro' }).check();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.getByRole('radio', { name: 'Scuro' })).toBeChecked();
    await page.getByRole('radio', { name: 'Auto' }).check();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
  });
});

test.describe('contact', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('shows the address in full and copies it, announcing the result', async ({ page }) => {
    await page.goto('/');
    const contact = page.getByRole('region', { name: 'Contatti' });
    await expect(contact.getByText('ada@example.org', { exact: true })).toBeVisible();
    await contact.getByRole('button', { name: 'Copia l’indirizzo' }).click();
    await expect(contact.getByRole('status')).toHaveText('Indirizzo copiato');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('ada@example.org');
  });
});
