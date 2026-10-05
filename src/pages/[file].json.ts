/**
 * The public JSON Resume of every locale (/resume.json, /resume.en.json): the data the
 * pages are built from, through an allowlist (see core/public.ts). Linked from each page
 * with <link rel="alternate" type="application/json">, for agents and other tools.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getEntry } from 'astro:content';
import { publicResume } from '../core/public';
import { dataPath, locales } from '../site/context';

interface Props {
  locale: string;
}

export const getStaticPaths = (() =>
  locales.map((locale) => ({
    params: { file: dataPath(locale).slice(1, -'.json'.length) },
    props: { locale },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<Props> = async ({ props }) => {
  const entry = await getEntry('resume', props.locale);
  if (!entry) return new Response(null, { status: 404 });
  return new Response(`${JSON.stringify(publicResume(entry.data), null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
