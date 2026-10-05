/** Small text helpers shared by the page, the PDF and the metadata. */

/** "https://www.linkedin.com/in/x/" → "linkedin.com/in/x" */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

/** "Ada Lovelace Byron" → "AB": first and last initials, for the monogram. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * Shortens text to whole words within `max` characters, preferring a sentence end.
 * Used for the meta description when the theme does not provide one.
 */
export function shorten(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const sentence = slice.lastIndexOf('. ');
  if (sentence > max * 0.5) return slice.slice(0, sentence + 1);
  return `${slice.slice(0, slice.lastIndexOf(' ')).replace(/[,;:]$/, '')}…`;
}

/** Joins non-empty parts with a separator. */
export function joinParts(parts: readonly (string | undefined | null | false)[], separator = ' · '): string {
  return parts.filter((part): part is string => Boolean(part)).join(separator);
}

/** "English (B2)"; a level that has its own brackets is flattened: "B2 (CEFR)" → "English (B2, CEFR)". */
export function languageLine(language: string | undefined, fluency: string | undefined): string {
  const level = fluency
    ?.replace(/\s*\(([^)]*)\)\s*/g, ', $1')
    .replace(/^,\s*/, '')
    .trim();
  return joinParts([language, level && `(${level})`], ' ');
}
