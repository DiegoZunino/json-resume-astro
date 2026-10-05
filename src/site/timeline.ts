/**
 * Progressive enhancement of the timeline: collapse all but the first `data-open`
 * roles, toggle a role on click, offer "expand all / collapse all", and mark on the
 * time axis the years of the role under the pointer or keyboard focus.
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

    const span = timeline.querySelector<SVGRectElement>('[data-axis-span]');
    const hint = timeline.querySelector<HTMLElement>('[data-axis-hint]');
    const mark = (role: HTMLElement | null) => {
      if (!span) return;
      const x = role?.dataset.x;
      const w = role?.dataset.w;
      if (x && w) {
        span.setAttribute('x', `${x}%`);
        span.setAttribute('width', `${w}%`);
        span.style.opacity = '1';
      } else span.style.opacity = '0';
      if (hint) hint.textContent = (x && role?.dataset.when) || '';
    };
    for (const role of timeline.querySelectorAll<HTMLElement>('[data-role]')) {
      role.addEventListener('pointerenter', () => mark(role));
      role.addEventListener('pointerleave', () => mark(null));
      role.addEventListener('focusin', () => mark(role));
      role.addEventListener('focusout', () => mark(null));
    }

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
