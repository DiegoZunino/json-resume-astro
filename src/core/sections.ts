/**
 * Which sections a page shows, and in which order. Built-in sections come from the
 * schema; any top-level `x-` key holding a list becomes an extension section.
 */
import { SECTION_KEYS, type Resume, type SectionKey } from './schema';

/** An entry of an extension list: a plain string, or an object with at least a name or title. */
export interface ExtensionItem {
  title: string;
  url?: string | undefined;
  date?: string | undefined;
  meta?: string | undefined;
  summary?: string | undefined;
}

export type Section =
  | { kind: 'builtin'; key: Exclude<SectionKey, 'education'> }
  | { kind: 'education'; key: 'education' }
  | { kind: 'extension'; key: string; items: ExtensionItem[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() ? value : undefined);

const safeUrl = (value: unknown): string | undefined => {
  const url = str(value);
  if (!url) return undefined;
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol) ? url : undefined;
  } catch {
    return undefined;
  }
};

/** Normalises an extension list; returns undefined if the value is not a usable list. */
export function extensionItems(value: unknown): ExtensionItem[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const items: ExtensionItem[] = [];
  for (const entry of value) {
    if (typeof entry === 'string') items.push({ title: entry });
    else if (isRecord(entry)) {
      const title = str(entry.title) ?? str(entry.name);
      if (!title) return undefined;
      items.push({
        title,
        url: safeUrl(entry.url),
        date: str(entry.date),
        meta: str(entry.event) ?? str(entry.publisher) ?? str(entry.meta),
        summary: str(entry.summary) ?? str(entry.description),
      });
    } else return undefined;
  }
  return items;
}

/** Sections with content, in theme order, without the hidden ones. Private keys never reach here. */
export function visibleSections(resume: Resume): Section[] {
  const options = resume.meta.themeOptions ?? {};
  const hidden = new Set(options.hide ?? []);
  const available = new Map<string, Section>();

  for (const key of SECTION_KEYS) {
    if (key === 'education') {
      if (resume.education.length || resume.certificates.length || resume.languages.length)
        available.set(key, { kind: 'education', key });
    } else if (resume[key].length) available.set(key, { kind: 'builtin', key });
  }
  for (const [key, value] of Object.entries(resume)) {
    if (!key.startsWith('x-')) continue;
    const items = extensionItems(value);
    if (items) available.set(key, { kind: 'extension', key, items });
  }

  const order = [...(options.order ?? []), ...SECTION_KEYS, ...available.keys()];
  const seen = new Set<string>();
  const sections: Section[] = [];
  for (const key of order) {
    if (seen.has(key) || hidden.has(key)) continue;
    seen.add(key);
    const section = available.get(key);
    if (section) sections.push(section);
  }
  return sections;
}
