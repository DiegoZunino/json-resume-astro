/**
 * Maps the list-like sections of a resume to one shape (title, link, meta line,
 * summary, points), so a single component renders projects, talks, awards and so on.
 */
import { formatDate, formatRange, isAfter } from './dates';
import type { Resume } from './schema';
import type { ExtensionItem } from './sections';
import { joinParts } from './text';

export interface Entry {
  title: string;
  url?: string | undefined;
  meta?: string | undefined;
  summary?: string | undefined;
  points?: string[] | undefined;
  /** BCP 47 language of the title, when it differs from the page (WCAG 3.1.2). */
  lang?: string | undefined;
}

export type ListKey = 'projects' | 'volunteer' | 'awards' | 'publications' | 'interests' | 'references';

export interface EntryText {
  /** Locale for dates, e.g. "it-IT", "en-GB". */
  intl: string;
  /** Word for a missing end date ("present"). */
  ongoing: string;
}

export function entriesFor(key: ListKey, resume: Resume, { intl, ongoing }: EntryText): Entry[] {
  const date = (value?: string) => (value ? formatDate(value, intl, ongoing) : undefined);
  const range = (start?: string, end?: string) => (start || end ? formatRange(start, end, intl, ongoing) : undefined);
  switch (key) {
    case 'projects':
      return resume.projects.map((project) => ({
        title: project.name ?? '',
        url: project.url,
        meta: joinParts([project.entity, project.roles?.join(', '), range(project.startDate, project.endDate)]),
        summary: project.description,
        points: project.highlights,
      }));
    case 'volunteer':
      return resume.volunteer.map((entry) => ({
        title: joinParts([entry.organization, entry.position], ' · '),
        url: entry.url,
        meta: range(entry.startDate, entry.endDate),
        summary: entry.summary,
        points: entry.highlights,
      }));
    case 'awards':
      return resume.awards.map((award) => ({
        title: award.title ?? '',
        meta: joinParts([award.awarder, date(award.date)]),
        summary: award.summary,
      }));
    case 'publications':
      return resume.publications.map((publication) => ({
        title: publication.name ?? '',
        url: publication.url,
        meta: joinParts([publication.publisher, date(publication.releaseDate)]),
        summary: publication.summary,
      }));
    case 'interests':
      return resume.interests.map((interest) => ({
        title: interest.name ?? '',
        summary: interest.keywords?.join(', '),
      }));
    case 'references':
      return resume.references.map((reference) => ({ title: reference.name ?? '', summary: reference.reference }));
  }
}

const PARTIAL_DATE = /^\d{4}(-\d{2})?(-\d{2})?$/;

/**
 * Entries of an `x-` list. A date after the build date is marked as upcoming (the site
 * is rebuilt at least weekly, so a talk already given loses the mark);
 * a bare year already present in the meta line ("AI Week 2026") is not repeated.
 */
export function extensionEntries(
  items: readonly ExtensionItem[],
  {
    intl,
    ongoing,
    upcoming,
    today,
    locale,
    inLanguage,
  }: EntryText & { upcoming: string; today: Date; locale: string; inLanguage: (name: string) => string },
): Entry[] {
  const languageOf = (lang: string) => new Intl.DisplayNames([locale], { type: 'language' }).of(lang) ?? lang;
  // When the whole list shares one other language, the list says it once (listLanguage).
  const shared = sharedForeignLanguage(items, locale);
  return items.map((item) => {
    const isDate = item.date !== undefined && PARTIAL_DATE.test(item.date);
    const future = isDate && isAfter(item.date!, today);
    const redundantYear = isDate && item.date!.length === 4 && Boolean(item.meta?.includes(item.date!));
    const foreign = isForeign(item.lang, locale) ? item.lang : undefined;
    return {
      title: item.title,
      url: item.url,
      meta: joinParts([
        item.meta,
        redundantYear ? undefined : isDate ? formatDate(item.date, intl, ongoing) : item.date,
        future ? upcoming : undefined,
        foreign && !shared && inLanguage(languageOf(foreign)),
      ]),
      summary: item.summary,
      lang: foreign,
    };
  });
}

const isForeign = (lang: string | undefined, locale: string): lang is string =>
  Boolean(lang) && lang!.split('-')[0] !== locale.split('-')[0];

function sharedForeignLanguage(items: readonly ExtensionItem[], locale: string): string | undefined {
  const first = items[0]?.lang;
  return items.length > 1 && isForeign(first, locale) && items.every((item) => item.lang === first) ? first : undefined;
}

/** "In Italian." under the title of a list whose entries are all in another language. */
export function listLanguage(
  items: readonly ExtensionItem[],
  locale: string,
  inLanguage: (name: string) => string,
): { note: string; lang: string } | undefined {
  const lang = sharedForeignLanguage(items, locale);
  if (!lang) return undefined;
  const name = new Intl.DisplayNames([locale], { type: 'language' }).of(lang) ?? lang;
  const text = inLanguage(name);
  return { note: `${text.charAt(0).toLocaleUpperCase(locale)}${text.slice(1)}.`, lang };
}
