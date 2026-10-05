/** Favicon: the monogram of the resume's name on the identity colours. */
import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { initials } from '../core/text';
import { defaultLocale } from '../site/context';

export const GET: APIRoute = async () => {
  const entry = await getEntry('resume', defaultLocale);
  const letters = initials(entry?.data.basics.name ?? '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#22303c"/><text x="32" y="41" font-family="system-ui,sans-serif" font-size="26" font-weight="700" fill="#eef1f3" text-anchor="middle">${letters}</text><rect x="14" y="50" width="36" height="3" rx="1.5" fill="#f2b705"/></svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
