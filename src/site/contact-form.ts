/**
 * The contact form sent in place (Netlify Forms accepts a urlencoded POST to "/"): the
 * button shows the progress, the status line announces the result, and on success the
 * fields are cleared. Without JavaScript the form posts normally to the confirmation page.
 */
export function initContactForms(): void {
  for (const form of document.querySelectorAll<HTMLFormElement>('form[data-contact-form]')) {
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const status = form.querySelector<HTMLElement>('[role="status"]');
    const fallback = form.querySelector<HTMLElement>('[data-fallback]');
    const label = button?.textContent ?? '';
    let sending = false;

    // The last result goes away as soon as the visitor starts writing again.
    form.addEventListener('input', () => {
      if (status && !sending) status.textContent = '';
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (sending) return;
      if (!button || !status) return form.submit();
      // The button keeps the focus (a disabled button would drop it on the page body).
      sending = true;
      button.setAttribute('aria-disabled', 'true');
      button.textContent = form.dataset.sending ?? label;
      status.textContent = '';
      if (fallback) fallback.hidden = true;
      try {
        const body = new URLSearchParams();
        for (const [key, value] of new FormData(form)) body.append(key, String(value));
        // Netlify takes the POST on any path of the site: the form's own action keeps both ways alike.
        const response = await fetch(form.getAttribute('action') ?? '/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        form.reset();
        status.textContent = form.dataset.sent ?? '';
      } catch {
        status.textContent = form.dataset.failed ?? '';
        if (fallback) fallback.hidden = false;
      } finally {
        sending = false;
        button.removeAttribute('aria-disabled');
        button.textContent = label;
      }
    });
  }
}
