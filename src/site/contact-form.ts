/**
 * The contact form sent in place (Netlify Forms accepts a urlencoded POST to "/"): the
 * button shows the progress, the status line announces the result, and on success the
 * fields are cleared. Without JavaScript the form posts normally to the confirmation page.
 */
export function initContactForms(): void {
  for (const form of document.querySelectorAll<HTMLFormElement>('form[data-contact-form]')) {
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const status = form.querySelector<HTMLElement>('[role="status"]');
    const label = button?.textContent ?? '';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!button || !status) return form.submit();
      button.disabled = true;
      button.textContent = form.dataset.sending ?? label;
      status.textContent = '';
      try {
        const body = new URLSearchParams();
        for (const [key, value] of new FormData(form)) body.append(key, String(value));
        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        form.reset();
        status.textContent = form.dataset.sent ?? '';
      } catch {
        status.textContent = form.dataset.failed ?? '';
      } finally {
        button.disabled = false;
        button.textContent = label;
      }
    });
  }
}
