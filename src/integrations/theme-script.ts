/**
 * The only inline script: it applies the saved theme before the first paint, so a
 * visitor who chose "dark" never sees a flash of the light theme. Its hash is added
 * to the Content Security Policy, so no 'unsafe-inline' is needed.
 */
import { createHash } from 'node:crypto';
import { THEME_STORAGE_KEY } from '../site/theme-key';

export const themeScript = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export const themeScriptHash = `sha256-${createHash('sha256').update(themeScript).digest('base64')}` as const;
