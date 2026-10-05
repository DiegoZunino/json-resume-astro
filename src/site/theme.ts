/**
 * Theme choice: Auto (follows the system), Light, Dark — three native radio buttons.
 * The choice is stored in localStorage and applied before paint by the inline script
 * in the document head; without JavaScript the control stays hidden and the page simply
 * follows the system.
 */
import { THEME_STORAGE_KEY } from './theme-key';

type Choice = 'system' | 'light' | 'dark';
const isChoice = (value: string): value is Choice => value === 'system' || value === 'light' || value === 'dark';

export function readTheme(): Choice {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(choice: Choice): void {
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
  const current = readTheme();
  for (const group of document.querySelectorAll<HTMLFieldSetElement>('[data-theme-switch]')) {
    for (const input of group.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
      input.checked = input.value === current;
      input.addEventListener('change', () => {
        if (input.checked && isChoice(input.value)) applyTheme(input.value);
      });
    }
    group.hidden = false;
  }
  // A choice made in another tab applies here too.
  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    const choice = readTheme();
    applyTheme(choice);
    for (const input of document.querySelectorAll<HTMLInputElement>('[data-theme-switch] input[type="radio"]'))
      input.checked = input.value === choice;
  });
}
