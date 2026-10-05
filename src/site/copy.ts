/**
 * Copy buttons: `<button data-copy="text" data-copied="Copied">` next to a `role="status"`
 * element, which announces the result to screen readers. Hidden without JavaScript or
 * without the Clipboard API: the text stays selectable.
 */
export function initCopyButtons(): void {
  if (!navigator.clipboard) return;
  for (const button of document.querySelectorAll<HTMLButtonElement>('button[data-copy]')) {
    const status = button.parentElement?.querySelector<HTMLElement>('[role="status"]');
    button.hidden = false;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy ?? '');
        if (status) status.textContent = button.dataset.copied ?? '';
        setTimeout(() => {
          if (status) status.textContent = '';
        }, 4000);
      } catch {
        /* permission refused: the address stays visible and selectable */
      }
    });
  }
}
