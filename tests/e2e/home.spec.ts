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
    // A talk given in Italian keeps its language on the English page (WCAG 3.1.2), and says so.
    await expect(page.locator('p[lang="it"]', { hasText: 'Un talk di esempio' })).toBeVisible();
    await expect(page.getByText(/in Italian/).first()).toBeVisible();
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
  test('the box holds only the form; the contact card sits with the buttons at the top', async ({ page, request }) => {
    await page.goto('/');
    const contact = page.getByRole('region', { name: 'Contatti' });
    // No repeat of the buttons at the top: the form, with the address in full for who prefers to copy it.
    await expect(contact.getByRole('link')).toHaveText(['ada@example.org', 'Informativa privacy']);
    const card = page.getByRole('group', { name: 'CV e contatti' }).getByRole('link', { name: 'Salva contatto' });
    await expect(card).toHaveAttribute('download', '');
    const href = (await card.getAttribute('href'))!;
    expect(href).toMatch(/^\/vcard\/ada-esempio\.vcf$/);
    // The local server does not know .vcf; on Netlify the type comes from _headers.
    expect(await (await request.get('/_headers')).text()).toMatch(/\/vcard\/\*\s+Content-Type: text\/vcard/);
    const text = await (await request.get(href)).text();
    expect(text).toContain('FN:Ada Esempio');
    expect(text).toMatch(/PHOTO;ENCODING=b;TYPE=JPEG:/);
    expect(text).not.toMatch(/TEL|555/);
  });

  test('the form sends in place and announces the result', async ({ page }) => {
    let posted = '';
    await page.route('**/messaggio-inviato/', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      posted = route.request().postData() ?? '';
      await route.fulfill({ status: 200, body: 'ok' });
    });
    await page.goto('/');
    const form = page.locator('form[data-contact-form]');
    await form.getByLabel('Nome').fill('Grace');
    await form.getByLabel('Email').fill('grace@example.org');
    await form.getByLabel('Messaggio').fill('Ciao, parliamo di un ruolo?');
    await form.getByRole('button', { name: 'Invia' }).click();
    await expect(form.getByRole('status')).toHaveText(/^Messaggio inviato/);
    expect(new URLSearchParams(posted).get('form-name')).toBe('contact');
    expect(new URLSearchParams(posted).get('email')).toBe('grace@example.org');
    await expect(form.getByLabel('Nome')).toHaveValue('');
  });

  test('a failed send says where to write instead', async ({ page }) => {
    await page.route('**/messaggio-inviato/', (route) =>
      route.request().method() === 'POST' ? route.fulfill({ status: 500 }) : route.continue(),
    );
    await page.goto('/');
    const form = page.locator('form[data-contact-form]');
    await form.getByLabel('Nome').fill('Grace');
    await form.getByLabel('Email').fill('grace@example.org');
    await form.getByLabel('Messaggio').fill('Ciao');
    await form.getByRole('button', { name: 'Invia' }).click();
    await expect(form.getByRole('status')).toHaveText('Invio non riuscito.');
    await expect(form.locator('[data-fallback]').getByRole('link', { name: 'ada@example.org' })).toHaveAttribute(
      'href',
      'mailto:ada@example.org',
    );
    // The button keeps the keyboard focus through the attempt.
    await expect(form.getByRole('button', { name: 'Invia' })).toBeFocused();
  });

  test('without JavaScript the form posts to a confirmation page that search engines skip', async ({ page }) => {
    await page.goto('/');
    const form = page.locator('form[data-contact-form]');
    await expect(form).toHaveAttribute('method', 'POST');
    await expect(form).toHaveAttribute('action', '/messaggio-inviato/');
    // The contract with Netlify's form detection, read from the static HTML.
    await expect(form).toHaveAttribute('name', 'contact');
    await expect(form).toHaveAttribute('data-netlify', 'true');
    await expect(form).toHaveAttribute('netlify-honeypot', 'bot-field');
    await expect(form.locator('input[type="hidden"][name="form-name"]')).toHaveValue('contact');
    await expect(form.locator('input[name="bot-field"]')).toBeHidden();
    const csp = await page.locator('meta[http-equiv="content-security-policy"]').getAttribute('content');
    expect(csp).toContain("form-action 'self'");
    await page.goto('/messaggio-inviato/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Messaggio inviato');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });

  test('the privacy notice is one click away and names who handles the messages', async ({ page }) => {
    await page.goto('/');
    await page.locator('form[data-contact-form]').getByRole('link', { name: 'Informativa privacy' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Informativa sulla privacy');
    await expect(page.getByText(/Netlify, Inc\./).first()).toBeVisible();
    await expect(page.getByText(/non usa cookie/)).toBeVisible();
  });
});
