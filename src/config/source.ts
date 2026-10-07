/**
 * Reads the JSON Resume of a locale from a file or a URL, removes the private fields
 * and validates the rest. Shared by the content loader (rendering) and the build
 * integration (leak check), so both see exactly the same data.
 */
import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { withhold } from '../core/privacy';
import { parseResume, type Resume } from '../core/schema';
import { sourceVariable, type ResumeConfig } from './define';

export interface LoadedResume {
  locale: string;
  source: string;
  resume: Resume;
  /** Values removed by the private paths, searched for in the build output. */
  withheld: string[];
  /** Private paths that matched something in this source. */
  matched: string[];
}

export interface SourceOptions {
  /** Project root, to resolve relative file paths. */
  root: string;
  /** Environment (normally `process.env`), for the `RESUME_SOURCE_<LOCALE>` overrides. */
  env: Record<string, string | undefined>;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export function sourceFor(config: ResumeConfig, locale: string, env: SourceOptions['env']): string {
  const override = env[sourceVariable(locale)]?.trim();
  const source = override || config.sources[locale];
  if (!source) throw new Error(`No JSON Resume source for locale "${locale}".`);
  return source;
}

export async function readRaw(source: string, options: SourceOptions): Promise<unknown> {
  if (/^https?:\/\//.test(source)) {
    const fetcher = options.fetch ?? fetch;
    const response = await fetcher(source, { signal: AbortSignal.timeout(options.timeoutMs ?? 15_000) });
    if (!response.ok) throw new Error(`JSON Resume at ${source} answered ${response.status} ${response.statusText}.`);
    try {
      return await response.json();
    } catch (error) {
      throw new Error(`JSON Resume at ${source} is not valid JSON: ${(error as Error).message}`, { cause: error });
    }
  }
  const path = isAbsolute(source) ? source : resolve(options.root, source);
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read JSON Resume at ${path}: ${(error as Error).message}`, { cause: error });
  }
}

/**
 * The private paths of this build. `RESUME_KEEP` (comma-separated paths) keeps some of them
 * for a build that is never published, such as the PDFs to send (`npm run pdf`).
 */
export function privatePaths(config: ResumeConfig, env: SourceOptions['env']): string[] {
  const keep = new Set((env.RESUME_KEEP ?? '').split(',').map((path) => path.trim()));
  return config.private.filter((path) => !keep.has(path));
}

export async function loadResume(config: ResumeConfig, locale: string, options: SourceOptions): Promise<LoadedResume> {
  const source = sourceFor(config, locale, options.env);
  const raw = await readRaw(source, options);
  const { data, values, matched } = withhold(raw, privatePaths(config, options.env));
  return {
    locale,
    source,
    resume: parseResume(data, `JSON Resume for "${locale}" (${source})`),
    withheld: values,
    matched,
  };
}
