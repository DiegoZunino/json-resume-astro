/**
 * The public JSON Resume of every locale (/resume.json, /resume.en.json): the same data
 * the pages are built from, private fields already removed. Linked from each page with
 * <link rel="alternate" type="application/json">, for agents and other tools.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getEntry } from 'astro:content';
import { dataPath, locales } from '../site/context';

export const getStaticPaths = (() =>
  locales.map((locale) => ({
    params: { file: dataPath(locale).slice(1, -'.json'.length) },
    props: { locale },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const entry = await getEntry('resume', (props as { locale: string }).locale);
  if (!entry) return new Response(null, { status: 404 });
  return new Response(`${JSON.stringify(entry.data, null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
