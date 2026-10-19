import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { toEuropass, type EuropassOptions } from '../../src/core/europass';
import { parseResume } from '../../src/core/schema';
import { append, element, serialize } from '../../src/core/xml';

const fixture = (locale: string) =>
  parseResume(JSON.parse(readFileSync(new URL(`../../fixtures/resume.${locale}.json`, import.meta.url), 'utf8')));

/** Fixed identifiers and date, the same the golden files were generated with. */
function convert(resume: ReturnType<typeof parseResume>, options: EuropassOptions = {}) {
  let id = 0;
  const warnings: string[] = [];
  const xml = toEuropass(resume, {
    today: '2026-10-19',
    newId: () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}`,
    onWarning: (message) => warnings.push(message),
    ...options,
  });
  return { xml, warnings };
}

const minimal = (extra: Record<string, unknown> = {}, basics: Record<string, unknown> = {}) =>
  parseResume({ basics: { name: 'Ada Esempio', ...basics }, ...extra });

/** Text of every element with this name, in document order. */
const texts = (xml: string, name: string): string[] =>
  [...xml.matchAll(new RegExp(`<${name}(?: [^>]*)?>([^<]*)</${name}>`, 'g'))].map((match) => match[1]!);

describe('toEuropass', () => {
  // Golden files written by the original Python converter with the same inputs.
  it('writes the same document as the reference converter', async () => {
    await expect(convert(fixture('it'), { lang: 'it' }).xml).toMatchFileSnapshot('__snapshots__/europass.it.xml');
    const en = convert(fixture('en'), {
      lang: 'en',
      withPhone: true,
      closingStatement: false,
      otherSkillGroups: ['Leadership'],
      titles: { 'x-objective': 'Objective' },
      profileName: "Ada's CV",
    });
    await expect(en.xml).toMatchFileSnapshot('__snapshots__/europass.en.xml');
  });

  it('declares only the namespaces in use, default first, on the Candidate root', () => {
    const { xml } = convert(minimal());
    expect(xml).toMatch(
      /^<\?xml version='1.0' encoding='UTF-8'\?>\n<Candidate xmlns="http:\/\/www.europass.eu\/1.0" xmlns:hr="[^"]+" xmlns:oa="[^"]+" xmlns:xsi="[^"]+" xsi:schemaLocation="http:\/\/www.europass.eu\/1.0 Candidate.xsd">/,
    );
    expect(xml).not.toContain('xmlns:eures');
    expect(convert(fixture('it')).xml).toContain('xmlns:eures="http://www.europass_eures.eu/1.0"');
  });

  it('lists the standard sections with content in SectionsOrder, or none', () => {
    expect(texts(convert(fixture('it')).xml, 'Title').slice(-5)).toEqual([
      'work-experience',
      'education-training',
      'language',
      'profile-skills',
      'membership',
    ]);
    const native = minimal({ languages: [{ language: 'Italiano', fluency: 'Madrelingua' }] });
    expect(convert(native).xml).not.toContain('SectionsOrder');
    const certified = minimal({ certificates: [{ name: 'AZ-204', issuer: 'Microsoft', date: '2022-05' }] });
    expect(texts(convert(certified).xml, 'Title')).toEqual(['education-training']);
  });

  it('writes native languages as PrimaryLanguageCode and the others with five CEFR skills', () => {
    const { xml } = convert(fixture('it'));
    expect(xml).toContain('<PrimaryLanguageCode name="NORMAL">ita</PrimaryLanguageCode>');
    expect(xml).toContain('<CompetencyID schemeName="NORMAL">eng</CompetencyID>');
    expect(texts(xml, 'hr:CompetencyDimensionTypeCode')).toEqual([
      'CEF-Understanding-Listening',
      'CEF-Understanding-Reading',
      'CEF-Speaking-Interaction',
      'CEF-Speaking-Production',
      'CEF-Writing-Production',
    ]);
    expect(texts(xml, 'hr:ScoreText')).toEqual(['C1', 'C1', 'C1', 'C1', 'C1']);
  });

  it('reads levels per skill, a level inside the fluency text, and ISO 639-2/B codes in x-code', () => {
    const { xml, warnings } = convert(
      minimal({
        languages: [
          { language: 'English', fluency: 'B2 (CEFR)' },
          { language: 'Deutsch', 'x-code': 'ger', 'x-cefr': { listening: 'b1', reading: 'B2', writing: 'Z9' } },
          { language: 'Français', 'x-code': 'fr', fluency: 'scolasticoB1' },
          { language: 'Klingon', fluency: 'C2' },
        ],
      }),
    );
    expect(texts(xml, 'CompetencyID')).toEqual(['eng', 'ger', 'fre']);
    expect(texts(xml, 'hr:ScoreText')).toEqual(['B2', 'B2', 'B2', 'B2', 'B2', 'B1', 'B2']);
    expect(warnings).toEqual([
      'language "Français" has no CEFR level: written without levels',
      'unknown language "Klingon": add x-code (ISO 639-2/B, e.g. "eng")',
    ]);
  });

  it('writes partial ISO dates and leaves out anything else, with a warning', () => {
    const { xml, warnings } = convert(fixture('it'));
    expect(xml).toContain('<hr:FormattedDateTime>2022-03</hr:FormattedDateTime>');
    expect(texts(xml, 'hr:CurrentIndicator')).toEqual(['true', 'false', 'false']);
    expect(warnings).not.toContainEqual(expect.stringMatching(/date/));
    const birth = convert(minimal({}, { 'x-birthDate': '13/05/1990', 'x-nationality': ['IT'] }));
    expect(birth.xml).not.toContain('BirthDate');
    expect(birth.xml).toContain('<NationalityCode>it</NationalityCode>');
    expect(birth.warnings).toEqual(['unrecognised date in basics.x-birthDate: "13/05/1990" (left out)']);
    expect(convert(minimal({}, { 'x-birthDate': '1990-05-13' })).xml).toContain(
      '<hr:BirthDate>1990-05-13</hr:BirthDate>',
    );
  });

  it('clips organisation and skill names to 99 characters, without a space before the ellipsis', () => {
    const long = 'Organizzazione'.repeat(10);
    const spaced = `${'Azienda '.repeat(20)}Srl`;
    const { xml } = convert(
      minimal({ work: [{ name: long }, { name: spaced }], skills: [{ name: 'Strumenti', keywords: [long] }] }),
    );
    const [organization, company] = texts(xml, 'hr:OrganizationName');
    expect([...organization!]).toHaveLength(99);
    expect(organization).toBe(`${long.slice(0, 96)}...`);
    expect(company).toMatch(/Azienda\.\.\.$/);
    expect(texts(xml, 'hr:CompetencyName')).toEqual([organization]);
  });

  it('writes the phone only on request', () => {
    const resume = minimal({}, { phone: '+39 011 555 0199' });
    const without = convert(resume);
    expect(without.xml).not.toMatch(/Telephone|555/);
    expect(without.warnings).toContainEqual(expect.stringMatching(/^phone not written/));
    const withPhone = convert(resume, { withPhone: true }).xml;
    expect(withPhone).toContain('<ChannelCode>MobileTelephone</ChannelCode>');
    expect(withPhone).toContain('<CountryDialling>it</CountryDialling>');
    expect(withPhone).toContain('<oa:DialNumber>0115550199</oa:DialNumber>');
    const abroad = convert(minimal({}, { phone: '+44 20 7946 0958' }), { withPhone: true }).xml;
    expect(abroad).toContain('<oa:DialNumber>+442079460958</oa:DialNumber>');
    expect(abroad).not.toContain('CountryDialling');
  });

  it('turns x- texts and lists of texts into free sections, and warns about other values', () => {
    const resume = minimal({
      'x-leadership': ['Team di otto persone', ' '],
      'x-side-projects': 'Un <b>gioco</b> & altro',
      'x-talks': [{ title: 'Talk' }],
      'x-empty': [],
    });
    const { xml, warnings } = convert(resume, { titles: { 'x-leadership': 'Guida' } });
    expect(texts(xml, 'Title')).toEqual(['Guida', 'Guida', 'Side projects', 'Side projects']);
    expect(xml).toContain('<Description>&lt;ul&gt;&lt;li&gt;Team di otto persone&lt;/li&gt;&lt;/ul&gt;</Description>');
    expect(xml).toContain('&lt;p&gt;Un &amp;lt;b&amp;gt;gioco&amp;lt;/b&amp;gt; &amp;amp; altro&lt;/p&gt;');
    expect(warnings).toEqual(['key x-talks is not mapped (expected a text or a list of texts)']);
    expect(convert(minimal({ 'x-speaking': ['Meetup'] }), { lang: 'en' }).xml).toContain(
      '<Title>Conferences, communities and outreach</Title>',
    );
  });

  it('warns when a free section is longer than the importer keeps', () => {
    expect(convert(minimal({ 'x-notes': 'a'.repeat(4000) })).warnings).toEqual([
      'section "Notes" is over 3800 bytes: the import may cut or refuse it',
    ]);
  });

  it('moves the chosen skill groups to free sections', () => {
    const { xml } = convert(fixture('it'), { otherSkillGroups: ['Guida'] });
    expect(texts(xml, 'Title')).toContain('Guida');
    expect(xml.match(/<SkillsGroup>/g)).toHaveLength(1);
    expect(xml).toContain('<Description>&lt;ul&gt;&lt;li&gt;mentoring&lt;/li&gt;');
  });

  it('closes with the privacy statement, or the PDF note, unless turned off', () => {
    const { xml } = convert(fixture('it'));
    expect(xml).toMatch(
      /<ClosingStatement>\s*<Statement>Consenso di esempio[^<]*<\/Statement>\s*<Place>Torino<\/Place>\s*<Date>\s*<hr:FormattedDateTime>2026-10-19</,
    );
    expect(convert(fixture('it'), { closingStatement: false }).xml).not.toContain('ClosingStatement');
    const note = minimal({ meta: { themeOptions: { printNote: 'Autorizzo il trattamento.' } } });
    expect(texts(convert(note).xml, 'Statement')).toEqual(['Autorizzo il trattamento.']);
    expect(texts(convert(note).xml, 'Place')).toEqual([]);
  });

  it('embeds the photo as the base64 of its data URI, as the editor does', () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const { xml } = convert(minimal(), { photo: { bytes, type: 'image/jpeg' } });
    const [embedded] = texts(xml, 'oa:EmbeddedData');
    expect(atob(embedded!)).toBe('data:image/jpeg;base64,/9j/4A==');
    expect(xml).toContain('<hr:Instructions>ProfilePicture</hr:Instructions>');
    expect(() => convert(minimal(), { photo: { bytes, type: 'image/gif' } })).toThrow(/JPEG or PNG/);
    const large = convert(minimal(), { photo: { bytes: new Uint8Array(2 * 1024 * 1024 + 1), type: 'image/png' } });
    expect(large.warnings).toEqual(['the photo is over 2 MB: the import may refuse it']);
  });

  it('maps education, certificates and memberships with their details', () => {
    const { xml } = convert(
      minimal({
        education: [{ institution: 'Università', courses: ['Statistica'], score: '110', 'x-countryCode': 'IT' }],
        certificates: [{ name: 'AZ-204', issuer: 'Microsoft', 'x-validUntil': '2027-05' }],
        volunteer: [{ position: 'Mentor', url: 'https://example.org/?a=1&b="2"', 'x-location': 'Genova' }],
      }),
      { lang: 'en' },
    );
    expect(texts(xml, 'hr:DegreeName')).toEqual(['-', 'AZ-204']);
    expect(xml).toContain('<hr:ScoreText>110</hr:ScoreText>');
    expect(xml).toContain('<CountryCode>it</CountryCode>');
    expect(xml).toContain('&lt;p&gt;Valid until 2027-05&lt;/p&gt;');
    expect(texts(xml, 'Title')[0]).toBe('Mentor');
    expect(xml).toContain('href="https://example.org/?a=1&amp;amp;b=&amp;quot;2&amp;quot;"');
    expect(xml).toContain('<Location>Genova</Location>');
  });

  it('writes contacts and social profiles with the codes the editor knows', () => {
    const { xml } = convert(
      minimal(
        {},
        {
          url: 'https://example.org',
          profiles: [
            { network: 'X', url: 'https://x.com/ada' },
            { network: 'GitHub', url: 'https://github.com/ada' },
            { url: 'https://example.org/blog' },
            { network: 'Mastodon' },
          ],
        },
      ),
    );
    expect(texts(xml, 'UseCode')).toEqual(['twitter', 'other', 'other']);
    expect(texts(xml, 'OtherTitle')).toEqual(['GitHub', 'Web']);
    expect(texts(xml, 'ChannelCode')).toEqual(['Web', 'Social Media', 'Social Media', 'Social Media']);
  });

  it('splits the name on the last word unless x-givenName and x-familyName are given', () => {
    const compound = convert(
      minimal({}, { name: 'Ada De Esempio', 'x-givenName': 'Ada', 'x-familyName': 'De Esempio' }),
    );
    expect(texts(compound.xml, 'hr:FamilyName')).toEqual(['De Esempio', 'De Esempio']);
    expect(texts(compound.xml, 'hr:ProfileName')).toEqual(['CV Ada De Esempio']);
    expect(() => convert(minimal({}, { name: 'Ada' }))).toThrow(/given and a family name/);
  });

  it('warns about the JSON Resume sections it cannot map', () => {
    expect(convert(fixture('it')).warnings).toEqual([
      'phone not written (structure not attested): add it in the editor, or use withPhone',
      'key x-talks is not mapped (expected a text or a list of texts)',
      ...['awards', 'publications', 'interests', 'references', 'projects'].map(
        (key) => `section "${key}" is not mapped (structure not attested): add it in the editor`,
      ),
    ]);
  });
});

describe('serialize', () => {
  it('closes empty elements, escapes attributes and refuses unknown prefixes', () => {
    const root = element('root', undefined, { note: 'a "b" & <c>\n' });
    append(root, 'empty', '');
    append(root, 'x:child', 'text');
    expect(() => serialize(root, { '': 'urn:default' })).toThrow(/prefix "x"/);
    expect(serialize(root, { '': 'urn:default', x: 'urn:x' })).toBe(
      `<?xml version='1.0' encoding='UTF-8'?>\n<root xmlns="urn:default" xmlns:x="urn:x" note="a &quot;b&quot; &amp; &lt;c&gt;&#10;">\n  <empty />\n  <x:child>text</x:child>\n</root>`,
    );
  });
});
