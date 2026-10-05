/**
 * Component tests with Astro's Container API (experimental in Astro 7: it may change in
 * minor releases). They check the server-rendered markup, i.e. what works without JavaScript.
 */
import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import Actions from '../../src/components/Actions.astro';
import Timeline from '../../src/components/Timeline.astro';
import Wire from '../../src/components/Wire.astro';
import { parseResume, type Resume } from '../../src/core/schema';
import { labelsFor } from '../../src/i18n/labels';

const resume: Resume = parseResume(JSON.parse(readFileSync('fixtures/resume.it.json', 'utf8')));
const labels = labelsFor('it');
let container: AstroContainer;

beforeAll(async () => {
  container = await AstroContainer.create();
});

describe('Timeline', () => {
  it('renders every role expanded; only roles with details are accordion buttons', async () => {
    const html = await container.renderToString(Timeline, {
      props: { work: resume.work, labels, reference: new Date(Date.UTC(2026, 9, 5)), expanded: 2 },
    });
    const detailed = resume.work.filter((role) => role.highlights?.length).length;
    expect(html.match(/<h3[^>]*><button[^>]*aria-expanded="true"/g)).toHaveLength(detailed);
    // Roles without details are headings with one hidden, readable name and an aria-hidden visual line.
    expect(
      html.match(/<h3[^>]*><span class="visually-hidden"[^>]*>[^<]+<\/span><span[^>]*aria-hidden="true"/g),
    ).toHaveLength(resume.work.length - detailed);
    expect(html).toContain('Sviluppatrice, Progetti personali</span>');
    expect(html).toMatch(/aria-label="Engineering Manager, Azienda Uno, mar 2022 – oggi"/);
    expect(html).toContain('Ruolo senza date');
    expect(html.match(/class="span"/g)).toHaveLength(3);
    expect(html).not.toMatch(/style="/);
  });
});

describe('Actions', () => {
  it('has one primary download and labelled secondary links', async () => {
    const html = await container.renderToString(Actions, {
      props: { resume, labels, pdfUrl: '/cv-it.pdf', label: 'Contatti' },
    });
    expect(html.match(/class="button primary"/g)).toHaveLength(1);
    expect(html).toMatch(/href="\/cv-it\.pdf"[^>]*download/);
    expect(html).toContain('href="mailto:ada@example.org"');
    expect(html).toContain('rel="me"');
    expect(html).not.toContain('ada@example.org</p>');
  });
});

describe('Wire', () => {
  it('keeps the two phrases readable and hides the drawing', async () => {
    const html = await container.renderToString(Wire, { props: { from: 'Da qui', to: 'a lì' } });
    expect(html).toMatch(/<span class="from"[^>]*>Da qui<\/span>/);
    expect(html).toMatch(/class="line"[^>]*aria-hidden="true"/);
  });
});
