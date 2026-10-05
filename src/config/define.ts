/**
 * Site configuration, validated when Astro starts. It is read by `astro.config.ts`,
 * the content loader and the build integration, so it must not import `astro:*` modules.
 */
import { z } from 'astro/zod';
import { assertKnownPaths } from '../core/privacy';
import { hasLabels } from '../i18n/labels';

const Locale = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, 'expected a language tag such as "it" or "en-GB"');

export const ResumeConfig = z
  .object({
    /** Absolute URL of the published site; `SITE_URL` overrides it. */
    site: z.url(),
    defaultLocale: Locale,
    /** One JSON Resume per locale: a path relative to the project root or an http(s) URL. */
    sources: z.record(Locale, z.string().min(1)),
    /** Dot paths removed before rendering, e.g. `basics.phone`, `work.*.x-internal`. */
    private: z.array(z.string()).default([]),
    /** File name of the PDFs: `<pdfName>-<locale>.pdf`. */
    pdfName: z
      .string()
      .regex(/^[\w-]+$/)
      .default('cv'),
    /** Public repository of this site, linked in the footer. */
    repository: z.url().optional(),
  })
  .superRefine((config, ctx) => {
    if (!(config.defaultLocale in config.sources))
      ctx.addIssue({ code: 'custom', path: ['defaultLocale'], message: 'defaultLocale must have a source' });
    for (const locale of Object.keys(config.sources))
      if (!hasLabels(locale))
        ctx.addIssue({
          code: 'custom',
          path: ['sources', locale],
          message: `no interface text for "${locale}": add it to src/i18n/labels.ts`,
        });
    try {
      assertKnownPaths(config.private);
    } catch (error) {
      ctx.addIssue({ code: 'custom', path: ['private'], message: (error as Error).message });
    }
  });

export type ResumeConfig = z.output<typeof ResumeConfig>;

export function defineResumeConfig(config: z.input<typeof ResumeConfig>): ResumeConfig {
  const parsed = ResumeConfig.safeParse(config);
  if (!parsed.success) throw new Error(`resume.config.ts is not valid:\n${z.prettifyError(parsed.error)}`);
  return parsed.data;
}

/** Name of the environment variable that overrides the source of a locale: `RESUME_SOURCE_EN_GB`. */
export const sourceVariable = (locale: string): string => `RESUME_SOURCE_${locale.replace('-', '_').toUpperCase()}`;
