/**
 * The public JSON Resume of every locale (/resume.json, /resume.en.json): the data the
 * pages are built from, projected on the schema (see core/public.ts). Linked from each page
 * with <link rel="alternate" type="application/json">, for agents and other tools.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getEntry } from 'astro:content';
import { publicResume } from '../core/public';
import { dataPath, locales } from '../site/context';
import { optimisedPhoto } from '../site/photo';

interface Props {
  locale: string;
}

export const getStaticPaths = (() =>
  locales.map((locale) => ({
    params: { file: dataPath(locale).slice(1, -'.json'.length) },
    props: { locale },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute<Props> = async ({ props, site }) => {
  const entry = await getEntry('resume', props.locale);
  if (!entry) return new Response(null, { status: 404 });
  const data = publicResume(entry.data) as { basics: Record<string, unknown> };
  // The photo is the site's own copy, as in the structured data, not the source URL.
  const photo = await optimisedPhoto(entry.data.basics.image, 168);
  if (photo && site) data.basics.image = new URL(photo.src, site).href;
  else Reflect.deleteProperty(data.basics, 'image');
  return new Response(`${JSON.stringify(data, null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
