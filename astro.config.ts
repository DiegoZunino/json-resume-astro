import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import resumeConfig from './resume.config';
import { contactFormFor } from './src/config/define';
import { buildEnv } from './src/config/env';
import { ARTIFACT_ROUTES } from './src/config/paths';
import { labelsFor } from './src/i18n/labels';
import { resumeArtifacts } from './src/integrations/artifacts';
import { themeScriptHash } from './src/integrations/theme-script';

// SITE_URL and RESUME_SOURCE_<LOCALE> come from the environment or .env files (see README).
const env = buildEnv(process.cwd());
const locales = Object.keys(resumeConfig.sources);
// Unicode ranges of the Fontsource "latin" and "latin-ext" subsets, copied from
// @fontsource/bricolage-grotesque/index.css: each file is downloaded only if the page uses its range.
const LATIN: [string, ...string[]] = [
  'U+0000-00FF',
  'U+0131',
  'U+0152-0153',
  'U+02BB-02BC',
  'U+02C6',
  'U+02DA',
  'U+02DC',
  'U+0304',
  'U+0308',
  'U+0329',
  'U+2000-206F',
  'U+20AC',
  'U+2122',
  'U+2191',
  'U+2193',
  'U+2212',
  'U+2215',
  'U+FEFF',
  'U+FFFD',
];
const LATIN_EXT: [string, ...string[]] = [
  'U+0100-02BA',
  'U+02BD-02C5',
  'U+02C7-02CC',
  'U+02CE-02D7',
  'U+02DD-02FF',
  'U+0304',
  'U+0308',
  'U+0329',
  'U+1D00-1DBF',
  'U+1E00-1E9F',
  'U+1EF2-1EFF',
  'U+2020',
  'U+20A0-20AB',
  'U+20AD-20C0',
  'U+2113',
  'U+2C60-2C7F',
  'U+A720-A7FF',
];
const fontVariants = [400, 500, 600, 700].flatMap((weight) =>
  (['latin', 'latin-ext'] as const).map((subset) => ({
    src: [`@fontsource/bricolage-grotesque/files/bricolage-grotesque-${subset}-${weight}-normal.woff2`] as [string],
    weight,
    style: 'normal' as const,
    unicodeRange: subset === 'latin' ? LATIN : LATIN_EXT,
  })),
);
const [firstVariant, ...otherVariants] = fontVariants;

export default defineConfig({
  site: env.SITE_URL || resumeConfig.site,
  trailingSlash: 'ignore',
  // Small pages: inline the CSS instead of a render-blocking request (the CSP hashes it).
  build: { format: 'directory', inlineStylesheets: 'always' },
  // No Markdown code blocks here: Shiki's inline styles would conflict with the CSP.
  markdown: { syntaxHighlight: false },

  i18n: {
    locales,
    defaultLocale: resumeConfig.defaultLocale,
    routing: { prefixDefaultLocale: false },
  },

  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Bricolage Grotesque',
      cssVariable: '--font-sans',
      fallbacks: ['system-ui', 'sans-serif'],
      options: {
        // Static instances, not the variable font: Chromium embeds them in the PDF as
        // TrueType instead of Type 3, so the CV text stays selectable and ATS-friendly.
        variants: [firstVariant!, ...otherVariants],
      },
    },
  ],

  image: {
    // Profile photos are remote (basics.image is a URL): optimise them at build time.
    // The example photo is served locally by scripts/build-fixtures.mjs, only in that build.
    remotePatterns: [
      { protocol: 'https' },
      ...(process.env.FIXTURE_PHOTO_SERVER === '1' ? [{ protocol: 'http', hostname: '127.0.0.1', port: '4599' }] : []),
    ],
  },

  security: {
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "object-src 'none'",
        "img-src 'self' data:",
        "font-src 'self'",
        "base-uri 'self'",
        // The contact form posts to the site itself (Netlify Forms); without it, no form at all.
        contactFormFor(resumeConfig, env) ? "form-action 'self'" : "form-action 'none'",
      ],
      scriptDirective: { hashes: [themeScriptHash] },
    },
  },

  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        const sent = locales.map((locale) => `/${labelsFor(locale).contact.sentPage.slug}/`);
        return (
          !ARTIFACT_ROUTES.some((route) => path.startsWith(`/${route}/`)) && !sent.some((end) => path.endsWith(end))
        );
      },
      // Each URL lists its language alternates (xhtml:link), like the pages' hreflang links.
      i18n: {
        defaultLocale: resumeConfig.defaultLocale,
        locales: Object.fromEntries(Object.keys(resumeConfig.sources).map((locale) => [locale, locale])),
      },
    }),
    resumeArtifacts(resumeConfig),
  ],
});
