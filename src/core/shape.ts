/**
 * Walking the Zod schema of a resume: the child schema of a key or of array items,
 * through optional and default wrappers. Shared by the private-path check and the
 * public projection, so both read the schema the same way.
 */
import type { z } from 'astro/zod';

export function unwrap(schema: z.ZodType | undefined): z.ZodType | undefined {
  let current = schema;
  for (let i = 0; i < 5 && current; i++) {
    const def = (current as unknown as { def?: { innerType?: z.ZodType } }).def;
    if (def?.innerType) current = def.innerType;
    else break;
  }
  return current;
}

/** Declared keys of an object schema, or undefined for anything else (records, scalars). */
export function shapeOf(schema: z.ZodType | undefined): Record<string, z.ZodType> | undefined {
  const inner = unwrap(schema);
  return inner && 'shape' in inner ? (inner.shape as Record<string, z.ZodType>) : undefined;
}

/** Schema of array items, or undefined if the schema is not an array. */
export function elementOf(schema: z.ZodType | undefined): z.ZodType | undefined {
  const inner = unwrap(schema);
  return inner && 'element' in inner ? (inner.element as z.ZodType) : undefined;
}

/** Child schema for a path segment: a declared key, or `*` for array items. */
export function childOf(schema: z.ZodType | undefined, key: string): z.ZodType | undefined {
  return key === '*' ? elementOf(schema) : shapeOf(schema)?.[key];
}
