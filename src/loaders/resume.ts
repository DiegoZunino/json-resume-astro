/**
 * Content loader: one entry per locale, id = locale. Astro validates each entry
 * against the collection schema and stores it with a digest, so unchanged data is
 * not processed again in incremental builds.
 */
import { fileURLToPath } from 'node:url';
import type { Loader } from 'astro/loaders';
import type { ResumeConfig } from '../config/define';
import { buildEnv } from '../config/env';
import { loadResume } from '../config/source';
import { extensionProblems } from '../core/sections';

export function resumeLoader(config: ResumeConfig): Loader {
  return {
    name: 'json-resume',
    async load({ store, parseData, generateDigest, logger, config: astroConfig }) {
      const root = fileURLToPath(astroConfig.root);
      const env = buildEnv(root);
      store.clear();
      for (const locale of Object.keys(config.sources)) {
        const { resume, source, withheld } = await loadResume(config, locale, { root, env });
        for (const problem of extensionProblems(resume))
          logger.warn(`${locale}: ${problem} has no text and is not shown`);
        const data = await parseData({ id: locale, data: resume as Record<string, unknown> });
        store.set({ id: locale, data, digest: generateDigest(data) });
        logger.info(`${locale}: ${source} (${withheld.length} private value(s) withheld)`);
      }
    },
  };
}
