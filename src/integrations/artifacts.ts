/**
 * Build integration: after Astro has written the site, it prints the CV of every locale
 * to PDF and renders its social card to PNG from dedicated pages, removes those pages
 * from the output, and checks that no private value reached a published file.
 */
import { createServer, type Server } from 'node:http';
import { readdir, readFile, rm } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import type { AstroIntegration, AstroIntegrationLogger } from 'astro';
import sirv from 'sirv';
import type { ResumeConfig } from '../config/define';
import { ARTIFACT_ROUTES, ogFile, pdfFile } from '../config/paths';
import { loadResume } from '../config/source';
import { findLeaks } from '../core/privacy';

const TEXT_FILES = new Set(['.html', '.json', '.xml', '.txt', '.svg', '.webmanifest']);

export function resumeArtifacts(config: ResumeConfig): AstroIntegration {
  let root = '';
  return {
    name: 'json-resume-artifacts',
    hooks: {
      'astro:config:done': ({ config: astroConfig }) => {
        root = fileURLToPath(astroConfig.root);
      },
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        await checkLeaks(config, root, out, logger);
        await renderArtifacts(config, out, logger);
        for (const route of ARTIFACT_ROUTES) await rm(join(out, route), { recursive: true, force: true });
      },
    },
  };
}

async function renderArtifacts(config: ResumeConfig, out: string, logger: AstroIntegrationLogger): Promise<void> {
  const server = await listen(createServer(sirv(out, { dev: true })));
  const address = server.address();
  const base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
  const browser = await chromium.launch();
  try {
    for (const locale of Object.keys(config.sources)) {
      const prefix = locale === config.defaultLocale ? '' : `${locale}/`;
      const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: 'light' });

      await page.goto(`${base}/print/${prefix}`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.pdf({
        path: join(out, pdfFile(config, locale)),
        preferCSSPageSize: true,
        printBackground: true,
        tagged: true,
        outline: true,
      });

      await page.goto(`${base}/og/${prefix}`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: join(out, ogFile(locale)), type: 'png' });

      await page.close();
      logger.info(`${locale}: ${pdfFile(config, locale)}, ${ogFile(locale)}`);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function checkLeaks(
  config: ResumeConfig,
  root: string,
  out: string,
  logger: AstroIntegrationLogger,
): Promise<void> {
  const withheld = new Set<string>();
  for (const locale of Object.keys(config.sources)) {
    const { withheld: values } = await loadResume(config, locale, { root, env: process.env });
    values.forEach((value) => withheld.add(value));
  }
  const leaks: string[] = [];
  for (const file of await walk(out)) {
    if (!TEXT_FILES.has(extname(file))) continue;
    for (const value of findLeaks(await readFile(file, 'utf8'), [...withheld]))
      leaks.push(`${file.slice(out.length)}: "${value}"`);
  }
  if (leaks.length) throw new Error(`Private values found in the build output:\n  ${leaks.join('\n  ')}`);
  logger.info(`privacy: ${withheld.size} private value(s), none published`);
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name));
}

function listen(server: Server): Promise<Server> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}
