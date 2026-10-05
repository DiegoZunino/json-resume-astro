/**
 * What /resume.json publishes: a projection on the schema, not the source minus the
 * private fields. At every level only declared keys survive (so `basics.x-notes` or
 * `work[0].x-sources` stay out), `meta` keeps its documented fields, hidden sections are
 * left out, and `x-` lists keep only the fields the page can show.
 */
import type { z } from 'astro/zod';
import { Resume } from './schema';
import { elementOf, shapeOf } from './shape';

const EXTENSION_FIELDS = ['title', 'name', 'url', 'date', 'event', 'publisher', 'meta', 'summary', 'description'];

function project(value: unknown, schema: z.ZodType | undefined): unknown {
  if (Array.isArray(value)) return value.map((item) => project(item, elementOf(schema)));
  const shape = shapeOf(schema);
  if (!shape || value === null || typeof value !== 'object') return value; // scalars and records as they are
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) if (key in shape) out[key] = project(child, shape[key]);
  return out;
}

function extensionList(items: unknown[]): unknown[] {
  return items.map((item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).filter(([key]) => EXTENSION_FIELDS.includes(key)))
      : item,
  );
}

export function publicResume(resume: Resume): Record<string, unknown> {
  const hidden = new Set(resume.meta.themeOptions?.hide ?? []);
  const out = project(resume, Resume) as Record<string, unknown>;
  for (const [key, value] of Object.entries(resume))
    if (key.startsWith('x-') && Array.isArray(value)) out[key] = extensionList(value);
  for (const key of hidden) Reflect.deleteProperty(out, key);
  return out;
}
