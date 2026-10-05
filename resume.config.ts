// What this site publishes. Sources can be overridden per locale with
// RESUME_SOURCE_<LOCALE> (a file path or an http(s) URL), the site URL with SITE_URL.
import { defineResumeConfig } from './src/config/define';

export default defineResumeConfig({
  site: 'https://example.org',
  defaultLocale: 'it',
  sources: {
    it: 'fixtures/resume.it.json',
    en: 'fixtures/resume.en.json',
  },
  private: ['basics.phone', 'x-objective', 'x-privacy', 'work.*.x-internal'],
  pdfName: 'cv',
  repository: 'https://github.com/DiegoZunino/json-resume-astro',
});
