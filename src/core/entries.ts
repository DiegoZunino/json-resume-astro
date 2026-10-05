/**
 * Maps the list-like sections of a resume to one shape (title, link, meta line,
 * summary, points), so a single component renders projects, talks, awards and so on.
 */
import { formatDate, formatRange } from './dates';
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

export function entriesFor(key: ListKey, resume: Resume, locale: string, ongoing: string): Entry[] {
  const date = (value?: string) => (value ? formatDate(value, locale, ongoing) : undefined);
  const range = (start?: string, end?: string) => (start || end ? formatRange(start, end, locale, ongoing) : undefined);
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

export function extensionEntries(items: readonly ExtensionItem[], locale: string, ongoing: string): Entry[] {
  return items.map((item) => ({
    title: item.title,
    url: item.url,
    meta: joinParts([
      item.meta,
      item.date && /^\d{4}(-\d{2})?(-\d{2})?$/.test(item.date) ? formatDate(item.date, locale, ongoing) : item.date,
    ]),
    summary: item.summary,
  }));
}
