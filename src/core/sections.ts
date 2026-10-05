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

/** One entry of an extension list, or undefined if it has no text to show. */
function extensionItem(entry: unknown): ExtensionItem | undefined {
  if (typeof entry === 'string') return entry.trim() ? { title: entry } : undefined;
  if (!isRecord(entry)) return undefined;
  const title = str(entry.title) ?? str(entry.name);
  if (!title) return undefined;
  return {
    title,
    url: safeUrl(entry.url),
    date: str(entry.date),
    meta: str(entry.event) ?? str(entry.publisher) ?? str(entry.meta),
    summary: str(entry.summary) ?? str(entry.description),
  };
}

/**
 * Normalises an extension list. Entries without text are skipped (and reported by
 * `extensionProblems`), so one bad entry does not hide the whole section.
 * Returns undefined if the value is not a list or nothing usable is left.
 */
export function extensionItems(value: unknown): ExtensionItem[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.map(extensionItem).filter((item): item is ExtensionItem => item !== undefined);
  return items.length ? items : undefined;
}

/** Entries of `x-` lists that cannot be shown, as "x-key[index]", for build warnings. */
export function extensionProblems(resume: Record<string, unknown>): string[] {
  return Object.entries(resume)
    .filter(([key, value]) => key.startsWith('x-') && Array.isArray(value))
    .flatMap(([key, value]) =>
      (value as unknown[]).flatMap((entry, index) => (extensionItem(entry) ? [] : [`${key}[${index}]`])),
    );
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

/** Section keys named in `order`, `hide` or `printHide` that match no section: likely typos. */
export function themeProblems(resume: Resume): string[] {
  const options = resume.meta.themeOptions ?? {};
  const known = new Set<string>([...SECTION_KEYS, ...Object.keys(resume).filter((key) => key.startsWith('x-'))]);
  return (['order', 'hide', 'printHide'] as const).flatMap((option) =>
    (options[option] ?? []).filter((key) => !known.has(key)).map((key) => `themeOptions.${option}: "${key}"`),
  );
}
