/**
 * The contact card of every locale (/vcard/ada-esempio.vcf, /vcard/ada-esempio.en.vcf): "Add to
 * contacts" in the Contact box. Built from the same data as the page, without private fields.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getEntry } from 'astro:content';
import { vcard } from '../../core/vcard';
import { locales, vcardPath } from '../../site/context';
import { vcardPhoto } from '../../site/vcard-photo';

interface Props {
  locale: string;
}

export const getStaticPaths = (async () =>
  Promise.all(
    locales.map(async (locale) => ({
      params: { file: (await vcardPath(locale)).slice('/vcard/'.length, -'.vcf'.length) },
      props: { locale },
    })),
  )) satisfies GetStaticPaths;

export const GET: APIRoute<Props> = async ({ props, site }) => {
  const entry = await getEntry('resume', props.locale);
  if (!entry) return new Response(null, { status: 404 });
  const { basics, meta } = entry.data;
  const body = vcard({
    basics,
    site: site?.href,
    photo: await vcardPhoto(basics.image),
    revision: meta.lastModified?.slice(0, 10),
  });
  return new Response(body, { headers: { 'Content-Type': 'text/vcard; charset=utf-8' } });
};
