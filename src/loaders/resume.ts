/**
 * Content loader: one entry per locale, id = locale. Astro validates each entry
 * against the collection schema and stores it with a digest, so unchanged data is
 * not processed again in incremental builds.
 */
import type { Loader } from 'astro/loaders';
import { loadResume } from '../config/source';
import type { ResumeConfig } from '../config/define';

export function resumeLoader(config: ResumeConfig, env: Record<string, string | undefined>): Loader {
  return {
    name: 'json-resume',
    async load({ store, parseData, generateDigest, logger, config: astroConfig }) {
      const root = new URL('.', astroConfig.root).pathname;
      store.clear();
      for (const locale of Object.keys(config.sources)) {
        const { resume, source, withheld } = await loadResume(config, locale, { root, env });
        const data = await parseData({ id: locale, data: resume as Record<string, unknown> });
        store.set({ id: locale, data, digest: generateDigest(data) });
        logger.info(`${locale}: ${source} (${withheld.length} private value(s) withheld)`);
      }
    },
  };
}
