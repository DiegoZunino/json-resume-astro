import { describe, expect, it } from 'vitest';
import { defineResumeConfig, sourceVariable } from '../../src/config/define';
import { loadResume, sourceFor } from '../../src/config/source';

const base = { site: 'https://ada.example', defaultLocale: 'it', sources: { it: 'fixtures/resume.it.json' } };

describe('defineResumeConfig', () => {
  it('validates the configuration, including private paths', () => {
    expect(defineResumeConfig(base).pdfName).toBe('cv');
    expect(() => defineResumeConfig({ ...base, private: ['basics.phnoe'] })).toThrow(/phnoe/);
    expect(() => defineResumeConfig({ ...base, defaultLocale: 'en' })).toThrow(/defaultLocale/);
  });
});

describe('sources', () => {
  const config = defineResumeConfig({ ...base, private: ['basics.phone', 'x-objective', 'work.*.x-internal'] });

  it('can be overridden per locale from the environment', () => {
    expect(sourceVariable('en-GB')).toBe('RESUME_SOURCE_EN_GB');
    expect(sourceFor(config, 'it', {})).toBe('fixtures/resume.it.json');
    expect(sourceFor(config, 'it', { RESUME_SOURCE_IT: 'https://x.example/r.json' })).toBe('https://x.example/r.json');
  });

  it('reads, withholds private fields and validates', async () => {
    const loaded = await loadResume(config, 'it', { root: process.cwd(), env: {} });
    expect(loaded.resume.basics.phone).toBeUndefined();
    expect(loaded.resume['x-objective']).toBeUndefined();
    expect(loaded.withheld).toContain('+39 011 555 0199');
  });

  it('keeps the paths listed in RESUME_KEEP, for a build that is never published', async () => {
    const loaded = await loadResume(config, 'it', { root: process.cwd(), env: { RESUME_KEEP: 'basics.phone, other' } });
    expect(loaded.resume.basics.phone).toBe('+39 011 555 0199');
    expect(loaded.resume['x-objective']).toBeUndefined();
    expect(loaded.withheld).not.toContain('+39 011 555 0199');
  });

  it('reads URLs with the given fetch and reports HTTP errors', async () => {
    const ok = (async () => new Response(JSON.stringify({ basics: { name: 'Remote' } }))) as typeof fetch;
    const missing = (async () => new Response('', { status: 404, statusText: 'Not Found' })) as typeof fetch;
    const env = { RESUME_SOURCE_IT: 'https://x.example/r.json' };
    await expect(loadResume(config, 'it', { root: '.', env, fetch: ok })).resolves.toMatchObject({
      resume: { basics: { name: 'Remote' } },
    });
    await expect(loadResume(config, 'it', { root: '.', env, fetch: missing })).rejects.toThrow(/404 Not Found/);
  });
});
