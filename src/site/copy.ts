/**
 * Copy buttons: `<button data-copy="text" data-copied="…" data-failed="…">` next to a
 * `role="status"` element, which shows the result and announces it to screen readers.
 * Hidden without JavaScript or without the Clipboard API: the text stays selectable.
 */
export function initCopyButtons(): void {
  if (!navigator.clipboard) return;
  for (const button of document.querySelectorAll<HTMLButtonElement>('button[data-copy]')) {
    const status = button.parentElement?.querySelector<HTMLElement>('[role="status"]');
    let timer: ReturnType<typeof setTimeout> | undefined;
    const say = (message: string) => {
      if (!status) return;
      clearTimeout(timer);
      status.textContent = message;
      timer = setTimeout(() => (status.textContent = ''), 4000);
    };
    button.hidden = false;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy ?? '');
        say(button.dataset.copied ?? '');
      } catch {
        say(button.dataset.failed ?? '');
      }
    });
  }
}
