import { defineConfig, envField, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';
import resumeConfig from './resume.config';
import { sourceVariable } from './src/config/define';
import { ARTIFACT_ROUTES } from './src/config/paths';
import { resumeArtifacts } from './src/integrations/artifacts';
import { themeScriptHash } from './src/integrations/theme-script';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const locales = Object.keys(resumeConfig.sources);
// Unicode ranges of the Fontsource "latin" and "latin-ext" subsets.
const LATIN: [string, ...string[]] = [
  'U+0000-00FF',
  'U+0131',
  'U+0152-0153',
  'U+02BB-02BC',
  'U+02C6',
  'U+02DA',
  'U+02DC',
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
  'U+0100-02AF',
  'U+0304',
  'U+0308',
  'U+0329',
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
    src: [`@fontsource/schibsted-grotesk/files/schibsted-grotesk-${subset}-${weight}-normal.woff2`] as [string],
    weight,
    style: 'normal' as const,
    unicodeRange: subset === 'latin' ? LATIN : LATIN_EXT,
  })),
);
const [firstVariant, ...otherVariants] = fontVariants;

export default defineConfig({
  site: env.SITE_URL || resumeConfig.site,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  // No Markdown code blocks here: Shiki's inline styles would conflict with the CSP.
  markdown: { syntaxHighlight: false },

  i18n: {
    locales,
    defaultLocale: resumeConfig.defaultLocale,
    routing: { prefixDefaultLocale: false },
  },

  env: {
    schema: {
      SITE_URL: envField.string({ context: 'server', access: 'public', optional: true, url: true }),
      ...Object.fromEntries(
        locales.map((locale) => [
          sourceVariable(locale),
          envField.string({ context: 'server', access: 'public', optional: true }),
        ]),
      ),
    },
  },

  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Schibsted Grotesk',
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
    remotePatterns: [{ protocol: 'https' }],
  },

  security: {
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "base-uri 'self'",
        "form-action 'none'",
      ],
      scriptDirective: { hashes: [themeScriptHash] },
    },
  },

  integrations: [
    sitemap({ filter: (page) => !ARTIFACT_ROUTES.some((route) => new URL(page).pathname.startsWith(`/${route}/`)) }),
    resumeArtifacts(resumeConfig),
  ],
});
