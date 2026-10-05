/**
 * What /resume.json publishes: an allowlist, not the source minus the private fields.
 * Top-level keys of the official schema plus `x-` lists (rendered as sections), and only
 * the documented `meta` fields, so tool metadata such as `meta.x-sources` stays out.
 */
import type { Resume } from './schema';

const SCHEMA_KEYS = new Set([
  '$schema',
  'basics',
  'work',
  'volunteer',
  'education',
  'awards',
  'certificates',
  'publications',
  'skills',
  'languages',
  'interests',
  'references',
  'projects',
]);
const META_KEYS = ['canonical', 'version', 'lastModified', 'themeOptions'] as const;

export function publicResume(resume: Resume): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(resume)) {
    if (SCHEMA_KEYS.has(key) || (key.startsWith('x-') && Array.isArray(value))) out[key] = value;
  }
  const meta: Record<string, unknown> = {};
  for (const key of META_KEYS) if (resume.meta[key] !== undefined) meta[key] = resume.meta[key];
  out.meta = meta;
  return out;
}
