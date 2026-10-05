/**
 * Theme switch: automatic (follows the system) → light → dark → automatic.
 * The choice is stored in localStorage and applied before paint by the inline script
 * in the document head; without JavaScript the button stays hidden and the page simply
 * follows the system.
 */
import { THEME_STORAGE_KEY } from './theme-key';

type Choice = 'system' | 'light' | 'dark';
const next: Record<Choice, Choice> = { system: 'light', light: 'dark', dark: 'system' };

function read(): Choice {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function apply(choice: Choice): void {
  const root = document.documentElement;
  if (choice === 'system') delete root.dataset.theme;
  else root.dataset.theme = choice;
  try {
    if (choice === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
}

export function initThemeSwitch(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme-switch]')) {
    const text = button.querySelector<HTMLElement>('[data-theme-text]');
    const render = (choice: Choice) => {
      const state = button.dataset[choice] ?? choice;
      if (text) text.textContent = `${button.dataset.label ?? 'Theme'}: ${state}`;
    };
    let choice = read();
    render(choice);
    button.hidden = false;
    button.addEventListener('click', () => {
      choice = next[choice];
      apply(choice);
      render(choice);
    });
  }
}
