/**
 * Maps the list-like sections of a resume to one shape (title, link, meta line,
 * summary, points), so a single component renders projects, talks, awards and so on.
 */
import { formatDate, formatRange, toMonths } from './dates';
import type { Resume } from './schema';
import type { ExtensionItem } from './sections';
import { joinParts } from './text';

export interface Entry {
  title: string;
  url?: string | undefined;
  meta?: string | undefined;
  summary?: string | undefined;
  points?: string[] | undefined;
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
 * Entries of an `x-` list. A date in the future of the reference date is marked as
 * upcoming (computed at build time, so a talk given last month is no longer "upcoming");
 * a bare year already present in the meta line ("AI Week 2026") is not repeated.
 */
export function extensionEntries(
  items: readonly ExtensionItem[],
  { intl, ongoing, upcoming, reference }: EntryText & { upcoming: string; reference: Date },
): Entry[] {
  return items.map((item) => {
    const isDate = item.date !== undefined && PARTIAL_DATE.test(item.date);
    const future = isDate && toMonths(item.date, reference) > toMonths(undefined, reference);
    const redundantYear = isDate && item.date!.length === 4 && Boolean(item.meta?.includes(item.date!));
    return {
      title: item.title,
      url: item.url,
      meta: joinParts([
        item.meta,
        redundantYear ? undefined : isDate ? formatDate(item.date, intl, ongoing) : item.date,
        future ? upcoming : undefined,
      ]),
      summary: item.summary,
    };
  });
}
