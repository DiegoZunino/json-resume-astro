/**
 * Progressive enhancement of the timeline: collapse all but the first `data-open`
 * roles, toggle a role on click, and offer "expand all / collapse all".
 */
export function initTimelines(): void {
  for (const timeline of document.querySelectorAll<HTMLElement>('[data-timeline]')) {
    const buttons = [...timeline.querySelectorAll<HTMLButtonElement>('h3 > button[aria-expanded]')];
    const open = Number(timeline.dataset.open ?? buttons.length);
    const toggleAll = timeline.querySelector<HTMLButtonElement>('[data-toggle-all]');

    const refreshToggleAll = () => {
      if (!toggleAll) return;
      const allOpen = buttons.every((button) => button.getAttribute('aria-expanded') === 'true');
      toggleAll.textContent = (allOpen ? toggleAll.dataset.collapse : toggleAll.dataset.expand) ?? '';
      toggleAll.dataset.allOpen = String(allOpen);
    };

    buttons.forEach((button, index) => {
      button.setAttribute('aria-expanded', String(index < open));
      button.addEventListener('click', () => {
        button.setAttribute('aria-expanded', String(button.getAttribute('aria-expanded') !== 'true'));
        refreshToggleAll();
      });
    });

    if (toggleAll) {
      toggleAll.hidden = false;
      toggleAll.addEventListener('click', () => {
        const expand = toggleAll.dataset.allOpen !== 'true';
        buttons.forEach((button) => button.setAttribute('aria-expanded', String(expand)));
        refreshToggleAll();
      });
      refreshToggleAll();
    }
  }
}
