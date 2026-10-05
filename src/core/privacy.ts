/**
 * Private fields: removed from the data before anything is rendered, and checked
 * again on the built output. Both steps fail closed: a path that does not match the
 * schema stops the build, and so does a withheld value found in a published file.
 */
import type { z } from 'astro/zod';
import { Resume } from './schema';
import { childOf } from './shape';

/** `basics.phone`, `x-objective`, `work.*.x-internal`: dot-separated, `*` for every array item. */
const PATH = /^(?:[A-Za-z][\w-]*|\*)(?:\.(?:[A-Za-z][\w-]*|\*))*$/;

/**
 * Checks that every configured path is well formed and, outside `x-` extensions,
 * names a field of the schema. A typo such as `basics.phnoe` must not silently
 * publish the phone number.
 */
export function assertKnownPaths(paths: readonly string[]): void {
  for (const path of paths) {
    if (!PATH.test(path)) throw new Error(`Private path "${path}" is not a dot-separated path.`);
    let shape: z.ZodType | undefined = Resume;
    for (const key of path.split('.')) {
      if (key.startsWith('x-')) break; // extensions are free-form below this point
      shape = childOf(shape, key);
      if (!shape) throw new Error(`Private path "${path}" does not match the JSON Resume schema (at "${key}").`);
    }
  }
}

export interface Withheld<T> {
  data: T;
  /** Every string removed from the data, for the leak check on the build output. */
  values: string[];
  /** Paths that removed something: a path that never matches may be a typo. */
  matched: string[];
}

/** Returns a copy of `data` without the private paths, and the values that were removed. */
export function withhold<T>(data: T, paths: readonly string[]): Withheld<T> {
  const copy = structuredClone(data);
  const values: string[] = [];
  const matched = paths.filter((path) => remove(copy, path.split('.'), values));
  return { data: copy, values, matched };
}

/** Removes the path from the node; true if something was removed. */
function remove(node: unknown, keys: string[], values: string[]): boolean {
  if (node === null || typeof node !== 'object') return false;
  const [key, ...rest] = keys;
  if (key === undefined) return false;
  let removed = false;
  const targets = key === '*' ? (Array.isArray(node) ? node.map((_, i) => i) : []) : [key];
  for (const target of targets) {
    const record = node as Record<string | number, unknown>;
    if (!(target in record)) continue;
    if (rest.length) removed = remove(record[target], rest, values) || removed;
    else {
      collectStrings(record[target], values);
      Reflect.deleteProperty(record, target);
      removed = true;
    }
  }
  return removed;
}

function collectStrings(value: unknown, into: string[]): void {
  if (typeof value === 'string') into.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, into));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, into));
}

/**
 * Finds withheld values in published text. Short values are ignored (too many false
 * positives); phone-like values are also searched without spaces and punctuation.
 */
export function findLeaks(text: string, values: readonly string[]): string[] {
  const compact = text.replace(/[\s().\-/]/g, '');
  return values.filter((value) => {
    const needle = value.trim();
    if (needle.length < 6) return false;
    if (text.includes(needle)) return true;
    const digits = needle.replace(/[\s().\-/]/g, '');
    return /^\+?\d{6,}$/.test(digits) && compact.includes(digits);
  });
}
