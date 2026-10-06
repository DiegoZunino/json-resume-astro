/**
 * Everything a page needs to render one locale: the validated resume, labels, URLs,
 * the reference date. Pages call this once and pass plain values to components.
 */
import { getEntry } from 'astro:content';
import { getAbsoluteLocaleUrl, getRelativeLocaleUrl } from 'astro:i18n';
import resumeConfig from '../../resume.config';
import { referenceDate } from '../core/dates';
import { visibleSections, type Section } from '../core/sections';
import type { Resume } from '../core/schema';
import { shorten } from '../core/text';
import { labelsFor, languageName, type Labels } from '../i18n/labels';
import { contactFormFor } from '../config/define';
import { buildEnv } from '../config/env';
import { ogFile, pdfFile } from '../config/paths';
import { vcardName } from '../core/vcard';

export const locales = Object.keys(resumeConfig.sources);
export const defaultLocale = resumeConfig.defaultLocale;

export interface LocaleLink {
  locale: string;
  name: string;
  href: string;
}

export interface PageContext {
  locale: string;
  resume: Resume;
  labels: Labels;
  sections: Section[];
  reference: Date;
  description: string | undefined;
  homeUrl: string;
  absoluteHomeUrl: string;
  pdfUrl: string;
  dataUrl: string;
  ogImageUrl: string;
  accessibilityUrl: string;
  otherLocales: LocaleLink[];
  repository: string | undefined;
  privacyUrl: string;
  vcardUrl: string;
  contactForm: 'netlify' | undefined;
}

/** The contact form in use, from the configuration and the environment. */
export const contactForm = contactFormFor(resumeConfig, buildEnv(process.cwd()));

/** Route parameter for a rest route from a locale URL: "/" → undefined, "/en/x/" → "en/x". */
export const routeParam = (path: string): string | undefined => path.replace(/^\/|\/$/g, '') || undefined;

/** Path of the contact card of a locale: /vcard/ada-esempio.vcf, /vcard/ada-esempio.en.vcf. */
export async function vcardPath(locale: string): Promise<string> {
  const entry = await getEntry('resume', locale);
  const file = vcardName(entry?.data.basics.name ?? 'contact');
  return `/vcard/${locale === defaultLocale ? file : file.replace(/\.vcf$/, `.${locale}.vcf`)}`;
}

/** Path of the public JSON Resume of a locale: /resume.json, /resume.en.json. */
export const dataPath = (locale: string): string =>
  locale === defaultLocale ? '/resume.json' : `/resume.${locale}.json`;

export async function pageContext(locale: string, site: URL | undefined): Promise<PageContext> {
  const entry = await getEntry('resume', locale);
  if (!entry) throw new Error(`No resume entry for locale "${locale}".`);
  const resume = entry.data;
  const labels = labelsFor(locale);
  const options = resume.meta.themeOptions ?? {};
  const absolute = (path: string) => (site ? new URL(path, site).href : path);

  return {
    locale,
    resume,
    labels,
    sections: visibleSections(resume),
    reference: referenceDate(resume.meta.lastModified, new Date()),
    description: options.description ?? (resume.basics.summary ? shorten(resume.basics.summary) : undefined),
    homeUrl: getRelativeLocaleUrl(locale),
    absoluteHomeUrl: getAbsoluteLocaleUrl(locale),
    pdfUrl: `/${pdfFile(resumeConfig, locale)}`,
    dataUrl: dataPath(locale),
    ogImageUrl: absolute(`/${ogFile(locale)}`),
    accessibilityUrl: getRelativeLocaleUrl(locale, labels.accessibility.slug),
    otherLocales: locales
      .filter((other) => other !== locale)
      .map((other) => ({ locale: other, name: languageName(other), href: getRelativeLocaleUrl(other) })),
    repository: resumeConfig.repository,
    privacyUrl: getRelativeLocaleUrl(locale, labels.privacy.slug),
    vcardUrl: await vcardPath(locale),
    contactForm,
  };
}

/** hreflang alternates for a page that exists in every locale, plus x-default. */
export function alternatesFor(path: (locale: string) => string): { hreflang: string; href: string }[] {
  return [
    ...locales.map((locale) => ({ hreflang: locale, href: path(locale) })),
    { hreflang: 'x-default', href: path(defaultLocale) },
  ];
}

/** Open Graph locale: "it" → "it_IT", "en" → "en_GB" unless a region is given. */
export function ogLocale(locale: string): string {
  if (locale.includes('-')) return locale.replace('-', '_');
  const regions: Record<string, string> = { en: 'GB', it: 'IT', fr: 'FR', de: 'DE', es: 'ES', pt: 'PT', nl: 'NL' };
  return `${locale}_${regions[locale] ?? locale.toUpperCase()}`;
}
