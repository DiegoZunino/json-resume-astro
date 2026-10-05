/**
 * JSON Resume v1.0.0 (https://jsonresume.org/schema) as a Zod schema.
 *
 * Like the official JSON Schema, every object accepts additional properties
 * (`z.looseObject`), so `x-` extensions and theme options pass through. Formats
 * that the official schema only annotates (`uri`, `email`) are enforced here,
 * because the values end up in `href` attributes.
 */
import { z } from 'astro/zod';

/** Partial ISO 8601 date (YYYY, YYYY-MM or YYYY-MM-DD), same pattern as the official schema. */
export const isoDate = z
  .string()
  .regex(
    /^([1-2][0-9]{3}-[0-1][0-9]-[0-3][0-9]|[1-2][0-9]{3}-[0-1][0-9]|[1-2][0-9]{3})$/,
    'expected an ISO 8601 date (YYYY, YYYY-MM or YYYY-MM-DD)',
  );

/** Absolute http(s) URL: anything else (javascript:, data:) is rejected before reaching an href. */
export const webUrl = z.string().refine((value) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}, 'expected an absolute http(s) URL');

const text = z.string();
const list = z.array(z.string());

export const Location = z.looseObject({
  address: text.optional(),
  postalCode: text.optional(),
  city: text.optional(),
  countryCode: text.optional(),
  region: text.optional(),
});

export const Profile = z.looseObject({
  network: text.optional(),
  username: text.optional(),
  url: webUrl.optional(),
});

export const Basics = z.looseObject({
  name: text.min(1),
  label: text.optional(),
  image: webUrl.optional(),
  email: z.email().optional(),
  phone: text.optional(),
  url: webUrl.optional(),
  summary: text.optional(),
  location: Location.optional(),
  profiles: z.array(Profile).default([]),
});

export const Work = z.looseObject({
  name: text.optional(),
  location: text.optional(),
  description: text.optional(),
  position: text.optional(),
  url: webUrl.optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  summary: text.optional(),
  highlights: list.optional(),
});

export const Volunteer = z.looseObject({
  organization: text.optional(),
  position: text.optional(),
  url: webUrl.optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  summary: text.optional(),
  highlights: list.optional(),
});

export const Education = z.looseObject({
  institution: text.optional(),
  url: webUrl.optional(),
  area: text.optional(),
  studyType: text.optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  score: text.optional(),
  courses: list.optional(),
});

export const Award = z.looseObject({
  title: text.optional(),
  date: isoDate.optional(),
  awarder: text.optional(),
  summary: text.optional(),
});

export const Certificate = z.looseObject({
  name: text.optional(),
  date: isoDate.optional(),
  url: webUrl.optional(),
  issuer: text.optional(),
  /** Extension: expiry date of the certification. */
  'x-validUntil': isoDate.optional(),
});

export const Publication = z.looseObject({
  name: text.optional(),
  publisher: text.optional(),
  releaseDate: isoDate.optional(),
  url: webUrl.optional(),
  summary: text.optional(),
});

export const Skill = z.looseObject({ name: text.optional(), level: text.optional(), keywords: list.optional() });
export const Language = z.looseObject({ language: text.optional(), fluency: text.optional() });
export const Interest = z.looseObject({ name: text.optional(), keywords: list.optional() });
export const Reference = z.looseObject({ name: text.optional(), reference: text.optional() });

export const Project = z.looseObject({
  name: text.optional(),
  description: text.optional(),
  highlights: list.optional(),
  keywords: list.optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  url: webUrl.optional(),
  roles: list.optional(),
  entity: text.optional(),
  type: text.optional(),
});

/** Built-in section keys, in the default order of the page. */
export const SECTION_KEYS = [
  'work',
  'projects',
  'volunteer',
  'skills',
  'education',
  'awards',
  'publications',
  'interests',
  'references',
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

/**
 * Theme options live where the schema reserves room for tooling (`meta.themeOptions`).
 * Every option is optional: a plain JSON Resume renders without any of them.
 */
export const ThemeOptions = z.looseObject({
  /** Two-part line joined by a drawn wire, shown under the name and role. */
  tagline: z.object({ from: text, to: text }).optional(),
  /** Paragraphs under the tagline; defaults to `basics.summary`. */
  intro: list.optional(),
  /** Meta description; defaults to a shortened `basics.summary`. */
  description: text.max(200).optional(),
  /** Section titles, including `x-` extensions, e.g. `{ "x-talks": "Talks" }`. */
  labels: z.record(z.string(), z.string()).optional(),
  /** Section order (built-in keys and `x-` keys); unlisted sections follow in default order. */
  order: list.optional(),
  /** Sections not shown on the page or in the PDF (the data stays in the source). */
  hide: list.optional(),
  /** Sections shown on the page but left out of the PDF, to keep it short (e.g. a list of talks). */
  printHide: list.optional(),
  /** How many of the most recent roles start expanded (default 2). */
  expanded: z.number().int().min(0).optional(),
});

export const Meta = z.looseObject({
  canonical: webUrl.optional(),
  version: text.optional(),
  /** ISO 8601 date or date-time: it becomes "updated on" and the reference date of the timeline. */
  lastModified: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}([T ][\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/, 'expected an ISO 8601 date or date-time')
    .optional(),
  themeOptions: ThemeOptions.optional(),
});

export const Resume = z.looseObject({
  basics: Basics,
  work: z.array(Work).default([]),
  volunteer: z.array(Volunteer).default([]),
  education: z.array(Education).default([]),
  awards: z.array(Award).default([]),
  certificates: z.array(Certificate).default([]),
  publications: z.array(Publication).default([]),
  skills: z.array(Skill).default([]),
  languages: z.array(Language).default([]),
  interests: z.array(Interest).default([]),
  references: z.array(Reference).default([]),
  projects: z.array(Project).default([]),
  meta: Meta.default({}),
});

export type Resume = z.infer<typeof Resume>;
export type WorkItem = z.infer<typeof Work>;
export type ThemeOptions = z.infer<typeof ThemeOptions>;

/** Validates raw data and turns Zod issues into one readable error listing every field path. */
export function parseResume(raw: unknown, label = 'JSON Resume'): Resume {
  const parsed = Resume.safeParse(raw);
  if (parsed.success) return parsed.data;
  const issues = parsed.error.issues
    .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`${label} is not valid:\n${issues}`);
}
