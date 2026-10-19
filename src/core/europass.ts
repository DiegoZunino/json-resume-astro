/**
 * JSON Resume → Europass CV XML ("Europass2 CV XML", schema v3.0.0 of 2020, root `Candidate`),
 * the file the Europass CV editor imports. A port of the author's Python converter: for the
 * same input the output is the same, byte for byte (see ADR 9 for the one deliberate change).
 *
 * Sources of the structure, since the XSD is not public:
 * - [DOC] ECV_Schema_Documentation_v3.0.0_20200602.pdf: elements and cardinalities, no examples;
 * - [REAL] the XML embedded in a PDF made by the Europass editor (2025): names, namespace
 *   prefixes and element order;
 * - [PHP] php-europass, whose output the editor imported: ProfileName, ExecutiveSummary,
 *   Others, the 99-character limit.
 * A structure attested by neither [REAL] nor [PHP] is not written, or only on request (the phone).
 */
import type { Resume } from './schema';
import { append, element, serialize, type XmlElement } from './xml';

const NAMESPACES = {
  '': 'http://www.europass.eu/1.0',
  hr: 'http://www.hr-xml.org/3',
  oa: 'http://www.openapplications.org/oagis/9',
  eures: 'http://www.europass_eures.eu/1.0',
  xsi: 'http://www.w3.org/2001/XMLSchema-instance',
};

/** [DOC][PHP] Organisation and skill names: at most 99 characters. */
const MAX_LABEL = 99;

/** [PHP] Free sections over about 3800 bytes of HTML may be cut or refused by the importer. */
const MAX_OTHER_BYTES = 3800;

/** Language names (Italian and English) and two-letter codes → lower-case ISO 639-2/B, as in [REAL]. */
const LANGUAGE_CODES = new Map(
  Object.entries({
    ita: ['italiano', 'italian', 'it'],
    eng: ['inglese', 'english', 'en'],
    fre: ['francese', 'french', 'fr'],
    ger: ['tedesco', 'german', 'de'],
    spa: ['spagnolo', 'spanish', 'es'],
    por: ['portoghese', 'portuguese', 'pt'],
    dut: ['olandese', 'dutch', 'nl'],
    rus: ['russo', 'russian', 'ru'],
    chi: ['cinese', 'chinese', 'zh'],
    jpn: ['giapponese', 'japanese', 'ja'],
    ara: ['arabo', 'arabic', 'ar'],
    pol: ['polacco', 'polish', 'pl'],
    rum: ['rumeno', 'romeno', 'romanian', 'ro'],
    gre: ['greco', 'greek', 'el'],
    swe: ['svedese', 'swedish', 'sv'],
    dan: ['danese', 'danish', 'da'],
    fin: ['finlandese', 'finnish', 'fi'],
    hun: ['ungherese', 'hungarian', 'hu'],
    cze: ['ceco', 'czech', 'cs'],
    hrv: ['croato', 'croatian', 'hr'],
    slv: ['sloveno', 'slovenian', 'sl'],
    alb: ['albanese', 'albanian', 'sq'],
    ukr: ['ucraino', 'ukrainian', 'uk'],
    tur: ['turco', 'turkish', 'tr'],
  }).flatMap(([code, names]) => names.map((name) => [name, code] as const)),
);

const NATIVE_WORDS = ['madrelingua', 'lingua madre', 'native', 'mother tongue', 'nativo', 'c2 native'];

/**
 * The five CEFR skills with the codes the editor writes [REAL] (the [DOC] spells them
 * without the second hyphen, e.g. "CEF-UnderstandingReading").
 */
const CEFR_DIMENSIONS = [
  ['listening', 'CEF-Understanding-Listening'],
  ['reading', 'CEF-Understanding-Reading'],
  ['spokenInteraction', 'CEF-Speaking-Interaction'],
  ['spokenProduction', 'CEF-Speaking-Production'],
  ['writing', 'CEF-Writing-Production'],
] as const;
type CefrSkill = (typeof CEFR_DIMENSIONS)[number][0];
type CefrLevels = Partial<Record<CefrSkill, string>>;

/** A level as a whole word ("B2", "b2 (CEFR)"), with word boundaries that count accented letters. */
const CEFR_LEVEL = /(?<![\p{L}\p{N}_])([ABC][12])(?![\p{L}\p{N}_])/iu;

/** [REAL] Use codes of the social networks the editor knows; the others are "other" with their name. */
const SOCIAL_USE_CODES = new Map([
  ['linkedin', 'linkedin'],
  ['twitter', 'twitter'],
  ['x', 'twitter'],
]);

/** Section titles of known `x-` keys; the others are titled after the key. */
const DEFAULT_TITLES: Record<string, Record<string, string>> = {
  it: { 'x-leadership': 'Leadership e gestione', 'x-speaking': 'Conferenze, community e divulgazione' },
  en: { 'x-leadership': 'Leadership and management', 'x-speaking': 'Conferences, communities and outreach' },
};
const VALID_UNTIL: Record<string, string> = { it: 'Valida fino a' };

/** `x-` keys that are not a section of their own: the privacy statement closes the document. */
const X_KEYS_HANDLED_ELSEWHERE = new Set(['x-privacy']);

/** [REAL] The look of the CV in the editor, as it exports it. */
const DESIGN = [
  ['Template', 'Template1'],
  ['Color', 'Default'],
  ['FontSize', 'Medium'],
  ['Logo', 'FirstPage'],
  ['PageNumbers', 'false'],
] as const;

/** JSON Resume sections without an attested Europass structure. */
const UNMAPPED_SECTIONS = ['awards', 'publications', 'interests', 'references', 'projects'] as const;

export interface EuropassPhoto {
  bytes: Uint8Array;
  /** `image/jpeg` or `image/png`. */
  type: string;
}

export interface EuropassOptions {
  /** Language of the profile (`CandidateProfile/@languageCode`, default titles); default `it`. */
  lang?: string;
  /** Profile picture; the editor exports a square 250×250 PNG. */
  photo?: EuropassPhoto | undefined;
  /** Writes `basics.phone`, with a structure that no real export attests. */
  withPhone?: boolean;
  /** The privacy statement (`x-privacy`, else `meta.themeOptions.printNote`) at the end; default on. */
  closingStatement?: boolean;
  /** Skill groups that go to a free section instead of "Digital skills". */
  otherSkillGroups?: readonly string[];
  /** Section titles for `x-` keys, e.g. `{ "x-talks": "Talks" }`. */
  titles?: Readonly<Record<string, string>>;
  /** Name of the CV in the Europass library; default "CV <given name> <family name>". */
  profileName?: string | undefined;
  /** Identifier generator for the document, the supplier and the profile; default random UUIDs. */
  newId?: () => string;
  /** Date of the closing statement, YYYY-MM-DD; default today. */
  today?: string;
  /** Receives what could not be converted (unmapped sections, invalid dates, the withheld phone). */
  onWarning?: (message: string) => void;
}

type Warn = (message: string) => void;

// ---------------------------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------------------------

/** A non-empty string, or undefined: extension fields are free-form. */
const text = (value: unknown): string | undefined => (typeof value === 'string' && value ? value : undefined);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Trimmed, and cut to `max` characters (code points) with an ellipsis. */
function clip(value: string | undefined, max = MAX_LABEL): string {
  const characters = [...(value ?? '').trim()];
  if (characters.length <= max) return characters.join('');
  const kept = characters.slice(0, max - 3).join('');
  return `${kept.trimEnd()}...`;
}

const escapeHtml = (value: string, quote = false): string => {
  const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return quote ? escaped.replace(/"/g, '&quot;').replace(/'/g, '&#x27;') : escaped;
};

/** Plain text → an HTML paragraph, or nothing. */
const paragraph = (value: string | undefined): string => (value?.trim() ? `<p>${escapeHtml(value.trim())}</p>` : '');

/** Plain texts → an HTML list, or nothing. */
function list(items: readonly unknown[] | undefined): string {
  const entries = (items ?? []).map((item) => (item ? String(item).trim() : '')).filter(Boolean);
  return entries.length ? `<ul>${entries.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}</ul>` : '';
}

/** "Genova, da remoto" → "Genova". */
const cityOf = (location: string | undefined): string | undefined => location?.split(',')[0]!.trim() || undefined;

/** [DOC] BR-COM-06: YYYY-MM-DD, YYYY-MM or YYYY, the formats of JSON Resume; anything else is left out. */
function formatDate(value: unknown, where: string, warn: Warn): string | undefined {
  if (!value) return undefined;
  const date = String(value).trim();
  if (/^\p{Nd}{4}(-\p{Nd}{2}(-\p{Nd}{2})?)?$/u.test(date)) return date;
  warn(`unrecognised date in ${where}: "${date}" (left out)`);
  return undefined;
}

/** JSON Resume has one name: the last word is the family name, unless `x-givenName`/`x-familyName` say otherwise. */
function splitName(basics: Resume['basics']): [given: string, family: string] {
  const given = text(basics['x-givenName']);
  const family = text(basics['x-familyName']);
  if (given && family) return [given, family];
  const words = basics.name.split(/\s+/).filter(Boolean);
  if (words.length < 2)
    throw new Error('basics.name needs a given and a family name (or x-givenName and x-familyName).');
  return [words.slice(0, -1).join(' '), words.at(-1)!];
}

const languageCode = (name: unknown): string | undefined =>
  typeof name === 'string' ? LANGUAGE_CODES.get(name.trim().toLowerCase()) : undefined;

/** `x-code` is a language name or code like `language`, or directly an ISO 639-2/B code ("eng"). */
function isoCode(code: unknown): string | undefined {
  const value = typeof code === 'string' ? code.trim().toLowerCase() : '';
  return languageCode(value) ?? (/^[a-z]{3}$/.test(value) ? value : undefined);
}

const isNative = (language: Resume['languages'][number]): boolean => {
  const fluency = (language.fluency ?? '').toLowerCase();
  return NATIVE_WORDS.some((word) => fluency.includes(word));
};

/** Levels per skill from `x-cefr`, or the single level in `fluency` ("B2") for all five. */
function cefrLevels(language: Resume['languages'][number]): CefrLevels | undefined {
  const perSkill = language['x-cefr'];
  if (isRecord(perSkill)) {
    const levels: CefrLevels = {};
    for (const [skill] of CEFR_DIMENSIONS) {
      const level = String(perSkill[skill] ?? '').toUpperCase();
      if (/^[ABC][12]$/.test(level)) levels[skill] = level;
    }
    return Object.keys(levels).length ? levels : undefined;
  }
  const level = CEFR_LEVEL.exec(language.fluency ?? '')?.[1]?.toUpperCase();
  return level ? Object.fromEntries(CEFR_DIMENSIONS.map(([skill]) => [skill, level])) : undefined;
}

const base64 = (bytes: Uint8Array): string => btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));

// ---------------------------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------------------------

function personName(parent: XmlElement, given: string, family: string): void {
  const name = append(parent, 'PersonName');
  append(name, 'oa:GivenName', given);
  append(name, 'hr:FamilyName', family);
}

/** [REAL] ChannelCode Email | Web | Social Media, with UseCode and OtherTitle for social networks. */
function communication(parent: XmlElement, channel: string, uri: string, useCode?: string, otherTitle?: string): void {
  const node = append(parent, 'Communication');
  append(node, 'ChannelCode', channel);
  if (useCode) append(node, 'UseCode', useCode);
  if (otherTitle) append(node, 'OtherTitle', otherTitle);
  append(node, 'oa:URI', uri);
}

/** [REAL] The smallest attested address: city and lower-case ISO 3166 country; street and postcode are not mapped. */
function address(parent: XmlElement, city: string | undefined, country: string | undefined): void {
  if (!city && !country) return;
  const node = append(append(parent, 'Communication'), 'Address');
  if (city) append(node, 'oa:CityName', city);
  if (country) append(node, 'CountryCode', country.toLowerCase());
}

/**
 * [DOC] only: neither a real export nor [PHP] has a phone, so its namespaces are a guess
 * (CountryDialling like CountryCode, DialNumber like oa:URI). Written only on request.
 */
function phone(parent: XmlElement, number: string): void {
  const digits = number.replace(/[^\p{Nd}+]/gu, '');
  const node = append(parent, 'Communication');
  append(node, 'ChannelCode', 'MobileTelephone');
  if (/^\+\p{Nd}{7,}$/u.test(digits) && digits.startsWith('+39')) {
    append(node, 'CountryDialling', 'it');
    append(node, 'oa:DialNumber', digits.slice(3));
  } else append(node, 'oa:DialNumber', digits);
}

interface PeriodNames {
  period: string;
  start: string;
  end: string;
  ongoing: string;
}
const EMPLOYMENT_PERIOD: PeriodNames = {
  period: 'eures:EmploymentPeriod',
  start: 'eures:StartDate',
  end: 'eures:EndDate',
  ongoing: 'hr:CurrentIndicator',
};
const ATTENDANCE_PERIOD: PeriodNames = {
  period: 'AttendancePeriod',
  start: 'StartDate',
  end: 'EndDate',
  ongoing: 'Ongoing',
};
const ACTIVITY_PERIOD: PeriodNames = { ...ATTENDANCE_PERIOD, period: 'Date' };

/** Start, end and whether it is ongoing (no end date), under the element names of each section. */
function period(parent: XmlElement, names: PeriodNames, start: string | undefined, end: string | undefined): void {
  if (!start && !end) return;
  const node = append(parent, names.period);
  if (start) append(append(node, names.start), 'hr:FormattedDateTime', start);
  if (end) append(append(node, names.end), 'hr:FormattedDateTime', end);
  append(node, names.ongoing, String(!end));
}

// ---------------------------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------------------------

/**
 * work[] → EmploymentHistory [REAL]: one EmployerHistory with one PositionHistory per entry,
 * as the editor does even for several roles at the same company. The location goes only to
 * City; the industry (x-industry) is not mapped, a NACE code cannot be derived reliably.
 */
function employment(profile: XmlElement, work: Resume['work'], defaultCountry: string | undefined, warn: Warn): void {
  if (!work.length) return;
  const history = append(profile, 'EmploymentHistory');
  work.forEach((job, i) => {
    const employer = append(history, 'EmployerHistory');
    if (job.name) append(employer, 'hr:OrganizationName', clip(job.name));
    const city = cityOf(job.location);
    const country = (text(job['x-countryCode']) ?? defaultCountry ?? '').toLowerCase() || undefined;
    if (city || job.url) {
      const contact = append(employer, 'OrganizationContact');
      address(contact, city, country);
      if (job.url) communication(contact, 'Web', job.url);
    }
    const position = append(employer, 'PositionHistory');
    append(position, 'PositionTitle', job.position || '-', { typeCode: 'FREETEXT' });
    period(
      position,
      EMPLOYMENT_PERIOD,
      formatDate(job.startDate, `work[${i}].startDate`, warn),
      formatDate(job.endDate, `work[${i}].endDate`, warn),
    );
    const description = paragraph(job.description) + paragraph(job.summary) + list(job.highlights);
    if (description) append(position, 'oa:Description', description);
    if (city) append(position, 'City', city);
    if (country) append(position, 'Country', country);
  });
}

interface Attendance {
  organization: string | undefined;
  degree: string | undefined;
  start?: string | undefined;
  end: string | undefined;
  city?: string | undefined;
  country?: string | undefined;
  url: string | undefined;
  details: string;
  grade?: string | undefined;
}

function attendance(history: XmlElement, entry: Attendance): void {
  const node = append(history, 'EducationOrganizationAttendance');
  if (entry.organization) append(node, 'hr:OrganizationName', clip(entry.organization));
  if (entry.city || entry.country) address(append(node, 'OrganizationContact'), entry.city, entry.country);
  period(node, ATTENDANCE_PERIOD, entry.start, entry.end);
  const degree = append(node, 'EducationDegree');
  append(degree, 'hr:DegreeName', entry.degree || '-');
  if (entry.grade) append(append(degree, 'FinalGrade'), 'hr:ScoreText', entry.grade);
  if (entry.details) append(degree, 'OccupationalSkillsCovered', entry.details); // [PHP]
  if (entry.url) append(node, 'Link', entry.url);
}

/**
 * education[] and certificates[] → EducationHistory [REAL]. Certificates go here, as in the
 * real export (its <Certifications/> is empty): issuer as organisation, date as end date,
 * x-validUntil in the text. The EQF level needs official codes JSON Resume does not have.
 */
function education(profile: XmlElement, resume: Resume, lang: string, warn: Warn): void {
  if (!resume.education.length && !resume.certificates.length) return;
  const history = append(profile, 'EducationHistory');
  resume.education.forEach((entry, i) =>
    attendance(history, {
      organization: entry.institution,
      degree: [entry.studyType, entry.area].filter(Boolean).join(' '),
      start: formatDate(entry.startDate, `education[${i}].startDate`, warn),
      end: formatDate(entry.endDate, `education[${i}].endDate`, warn),
      city: cityOf(text(entry['location'])),
      country: text(entry['x-countryCode']),
      url: entry.url,
      details: list(entry.courses),
      grade: entry.score,
    }),
  );
  const validUntil = VALID_UNTIL[lang] ?? 'Valid until';
  resume.certificates.forEach((certificate, i) =>
    attendance(history, {
      organization: certificate.issuer,
      degree: certificate.name,
      end: formatDate(certificate.date, `certificates[${i}].date`, warn),
      url: certificate.url,
      details: certificate['x-validUntil'] ? paragraph(`${validUntil} ${certificate['x-validUntil']}`) : '',
    }),
  );
}

interface ForeignLanguage {
  code: string;
  levels: CefrLevels | undefined;
}

/**
 * languages[]: native ones → CandidatePerson/PrimaryLanguageCode [REAL]; the others are
 * returned for PersonQualifications. The overall ProficiencyLevel of the [DOC] is not in the
 * real export and is not written.
 */
function languages(person: XmlElement, entries: Resume['languages'], warn: Warn): ForeignLanguage[] {
  const foreign: ForeignLanguage[] = [];
  for (const entry of entries) {
    const code = languageCode(entry.language) ?? isoCode(entry['x-code']);
    if (!code) {
      warn(`unknown language "${entry.language}": add x-code (ISO 639-2/B, e.g. "eng")`);
      continue;
    }
    if (isNative(entry)) {
      append(person, 'PrimaryLanguageCode', code, { name: 'NORMAL' });
      continue;
    }
    const levels = cefrLevels(entry);
    if (!levels) warn(`language "${entry.language}" has no CEFR level: written without levels`);
    foreign.push({ code, levels });
  }
  return foreign;
}

/** [REAL] One PersonCompetency per foreign language, with the five CEFR skills. */
function qualifications(profile: XmlElement, foreign: readonly ForeignLanguage[]): void {
  if (!foreign.length) return;
  const node = append(profile, 'PersonQualifications');
  for (const { code, levels } of foreign) {
    const competency = append(node, 'PersonCompetency');
    append(competency, 'CompetencyID', code, { schemeName: 'NORMAL' });
    append(competency, 'hr:TaxonomyID', 'language');
    for (const [skill, dimension] of CEFR_DIMENSIONS) {
      const level = levels?.[skill];
      if (!level) continue;
      const scored = append(competency, 'eures:CompetencyDimension');
      append(scored, 'hr:CompetencyDimensionTypeCode', dimension);
      append(append(scored, 'eures:Score'), 'hr:ScoreText', level);
    }
  }
}

/**
 * [REAL][PHP] eures:Attachment of type photo. As in the real export, oa:EmbeddedData holds the
 * base64 of the whole data URI ("data:image/png;base64,iVBOR..."): base64 twice.
 */
function photo(profile: XmlElement, image: EuropassPhoto, warn: Warn): void {
  if (image.type !== 'image/jpeg' && image.type !== 'image/png')
    throw new Error(`The photo must be a JPEG or PNG image, not ${image.type}.`);
  if (image.bytes.length > 2 * 1024 * 1024) warn('the photo is over 2 MB: the import may refuse it');
  const node = append(profile, 'eures:Attachment');
  append(node, 'oa:EmbeddedData', btoa(`data:${image.type};base64,${base64(image.bytes)}`));
  append(node, 'oa:FileType', 'photo');
  append(node, 'hr:Instructions', 'ProfilePicture');
}

/**
 * skills[] → Skills/SkillsGroup [REAL], the editor's "Digital skills": one PersonCompetency per
 * keyword, without duplicates [DOC]. Groups listed in `otherGroups` are returned for a free
 * section instead. skills[].level is not mapped: digital skills have no level in the editor.
 */
function skills(profile: XmlElement, groups: Resume['skills'], otherGroups: ReadonlySet<string>): Resume['skills'] {
  const isOther = (group: Resume['skills'][number]): boolean => group.name !== undefined && otherGroups.has(group.name);
  const digital = groups.filter((group) => !isOther(group));
  if (digital.length) {
    const node = append(profile, 'Skills');
    for (const group of digital) {
      const groupNode = append(node, 'SkillsGroup');
      append(groupNode, 'Title', clip(group.name || '-'));
      const seen = new Set<string>();
      for (const keyword of group.keywords ?? []) {
        const name = clip(keyword);
        if (seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        const competency = append(groupNode, 'PersonCompetency');
        append(competency, 'hr:TaxonomyID', 'Digital_Skill');
        append(competency, 'hr:CompetencyName', name);
      }
    }
  }
  return groups.filter(isOther);
}

/**
 * volunteer[] → NetworksAndMemberships [REAL]. VoluntaryWorks exists but is empty in the real
 * export, so its inner structure is not attested: the editor can move an entry there by hand.
 */
function memberships(profile: XmlElement, volunteer: Resume['volunteer'], warn: Warn): void {
  if (!volunteer.length) return;
  const node = append(profile, 'NetworksAndMemberships');
  volunteer.forEach((entry, i) => {
    const membership = append(node, 'NetworkAndMembership');
    const activity = append(membership, 'Activity');
    append(activity, 'Title', clip(entry.organization || entry.position || '-'));
    period(
      activity,
      ACTIVITY_PERIOD,
      formatDate(entry.startDate, `volunteer[${i}].startDate`, warn),
      formatDate(entry.endDate, `volunteer[${i}].endDate`, warn),
    );
    let description = paragraph(entry.position) + paragraph(entry.summary) + list(entry.highlights);
    if (entry.url) description += `<p><a href="${escapeHtml(entry.url, true)}">${escapeHtml(entry.url, true)}</a></p>`;
    if (description) append(activity, 'Description', description);
    const location = text(entry['x-location']);
    if (location) append(membership, 'Location', location);
  });
}

interface FreeSection {
  title: string;
  body: string;
}

/** Free sections → Others/Other [PHP]: one Other per Others, since the editor kept only the last one. */
function others(profile: XmlElement, sections: readonly FreeSection[], warn: Warn): void {
  for (const { title, body } of sections) {
    if (!body) continue;
    if (new TextEncoder().encode(body).length > MAX_OTHER_BYTES)
      warn(`section "${title}" is over ${MAX_OTHER_BYTES} bytes: the import may cut or refuse it`);
    const node = append(profile, 'Others');
    append(node, 'Title', title);
    const record = append(node, 'Other');
    append(record, 'Title', title);
    append(record, 'Description', body);
  }
}

/** Other skill groups, then the top-level `x-` keys holding a text or a list of texts. */
function freeSections(
  resume: Resume,
  otherGroups: Resume['skills'],
  titles: Readonly<Record<string, string>>,
  warn: Warn,
): FreeSection[] {
  const sections = otherGroups.map((group): FreeSection => ({ title: group.name!, body: list(group.keywords) }));
  for (const [key, value] of Object.entries(resume)) {
    if (!key.startsWith('x-') || X_KEYS_HANDLED_ELSEWHERE.has(key)) continue;
    const words = key.slice(2).replaceAll('-', ' ');
    const title = titles[key] ?? words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
    if (Array.isArray(value) && value.every((item) => typeof item === 'string'))
      sections.push({ title, body: list(value) });
    else if (typeof value === 'string') sections.push({ title, body: paragraph(value) });
    else warn(`key ${key} is not mapped (expected a text or a list of texts)`);
  }
  return sections;
}

/** Identifiers the importer accepts in SectionsOrder, for the standard sections that have content. */
function sectionsOrder(resume: Resume): string[] {
  const present: [string, boolean][] = [
    ['work-experience', resume.work.length > 0],
    ['education-training', resume.education.length > 0 || resume.certificates.length > 0],
    ['language', resume.languages.some((language) => !isNative(language))],
    ['profile-skills', resume.skills.length > 0],
    ['membership', resume.volunteer.length > 0],
  ];
  return present.filter(([, has]) => has).map(([name]) => name);
}

/**
 * RenderingInformation [REAL], outside the profile and absent from the [DOC]. SectionsOrder is
 * essential: the importer turns it into the editor's profile structure, and the editor shows
 * only the standard sections listed there (free sections appear anyway). Without it the
 * import succeeds but experience, education, languages, skills and memberships stay hidden.
 */
function rendering(
  root: XmlElement,
  sections: readonly string[],
  closing: { statement: string; city: string | undefined; date: string } | undefined,
): void {
  const node = append(root, 'RenderingInformation');
  const design = append(node, 'Design');
  for (const [name, value] of DESIGN) append(design, name, value);
  if (sections.length) {
    const order = append(design, 'SectionsOrder');
    for (const name of sections) append(append(order, 'Section'), 'Title', name);
  }
  if (!closing) return;
  const statement = append(node, 'ClosingStatement');
  append(statement, 'Statement', closing.statement);
  if (closing.city) append(statement, 'Place', closing.city);
  append(append(statement, 'Date'), 'hr:FormattedDateTime', closing.date);
}

/** Today in local time, YYYY-MM-DD. */
function localToday(): string {
  const now = new Date();
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// ---------------------------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------------------------

/** CandidatePerson [REAL]: name, contacts, nationality, birth date, native languages, in this order. */
function candidatePerson(
  root: XmlElement,
  resume: Resume,
  name: [given: string, family: string],
  options: { withPhone: boolean; country: string | undefined; warn: Warn },
): ForeignLanguage[] {
  const { basics } = resume;
  const person = append(root, 'CandidatePerson');
  personName(person, ...name);
  if (basics.email) communication(person, 'Email', basics.email);
  if (basics.phone) {
    if (options.withPhone) phone(person, basics.phone);
    else options.warn('phone not written (structure not attested): add it in the editor, or use withPhone');
  }
  address(person, basics.location?.city, options.country); // attested for organisations, here by analogy
  if (basics.url) communication(person, 'Web', basics.url);
  for (const profile of basics.profiles) {
    if (!profile.url) continue;
    const network = (profile.network ?? '').trim();
    const useCode = SOCIAL_USE_CODES.get(network.toLowerCase());
    if (useCode) communication(person, 'Social Media', profile.url, useCode);
    else communication(person, 'Social Media', profile.url, 'other', network || 'Web');
  }
  const nationalities = basics['x-nationality'];
  for (const nationality of Array.isArray(nationalities) ? nationalities : [])
    append(person, 'NationalityCode', String(nationality).toLowerCase());
  const birthDate = formatDate(basics['x-birthDate'], 'basics.x-birthDate', options.warn);
  if (birthDate) append(person, 'hr:BirthDate', birthDate);
  return languages(person, resume.languages, options.warn);
}

/** [REAL] The person supplies their own CV. */
function candidateSupplier(root: XmlElement, basics: Resume['basics'], name: [string, string], id: string): void {
  const supplier = append(root, 'CandidateSupplier');
  append(supplier, 'hr:PartyID', id, { schemeName: 'PartyID', schemeAgencyName: 'EUROPASS', schemeVersionID: '1.0' });
  append(supplier, 'hr:PartyName', 'Owner');
  const contact = append(supplier, 'PersonContact');
  personName(contact, ...name);
  if (basics.email) communication(contact, 'Email', basics.email);
  append(supplier, 'hr:PrecedenceCode', '1');
}

export function toEuropass(resume: Resume, options: EuropassOptions = {}): string {
  const lang = options.lang ?? 'it';
  const warn: Warn = options.onWarning ?? (() => undefined);
  const newId = options.newId ?? (() => crypto.randomUUID());
  const { basics } = resume;
  const name = splitName(basics);
  const country = basics.location?.countryCode?.toLowerCase() || undefined;
  const titles = { ...(DEFAULT_TITLES[lang] ?? DEFAULT_TITLES['en']), ...options.titles };

  const root = element('Candidate', undefined, { 'xsi:schemaLocation': `${NAMESPACES['']} Candidate.xsd` });
  append(root, 'hr:DocumentID', newId(), {
    schemeID: 'jsonresume-to-europass',
    schemeName: 'DocumentIdentifier',
    schemeAgencyName: 'EUROPASS',
    schemeVersionID: '4.0',
  });
  candidateSupplier(root, basics, name, newId());
  const foreign = candidatePerson(root, resume, name, { withPhone: options.withPhone ?? false, country, warn });

  // One profile, in the language of the document [DOC].
  const profile = append(root, 'CandidateProfile', undefined, { languageCode: lang });
  append(profile, 'hr:ID', newId(), {
    schemeName: 'CandidateProfileID',
    schemeAgencyName: 'EUROPASS',
    schemeVersionID: '1.0',
  });
  append(profile, 'hr:ProfileName', options.profileName || `CV ${name[0]} ${name[1]}`);
  const summary = paragraph(basics.label) + paragraph(basics.summary);
  if (summary) append(profile, 'hr:ExecutiveSummary', summary); // "About me" [PHP][DOC]
  employment(profile, resume.work, country, warn);
  education(profile, resume, lang, warn);
  qualifications(profile, foreign);
  if (options.photo) photo(profile, options.photo, warn);
  const otherGroups = skills(profile, resume.skills, new Set(options.otherSkillGroups));
  memberships(profile, resume.volunteer, warn);
  others(profile, freeSections(resume, otherGroups, titles, warn), warn);
  for (const key of UNMAPPED_SECTIONS)
    if (resume[key].length) warn(`section "${key}" is not mapped (structure not attested): add it in the editor`);

  const statement =
    options.closingStatement === false ? undefined : (text(resume['x-privacy']) ?? resume.meta.themeOptions?.printNote);
  rendering(
    root,
    sectionsOrder(resume),
    statement ? { statement, city: basics.location?.city, date: options.today ?? localToday() } : undefined,
  );
  return serialize(root, NAMESPACES);
}
