// Writes the Europass CV XML of a JSON Resume, for the import into the Europass CV editor
// (europass.europa.eu). Nothing is published: like `npm run pdf`, it may keep private fields.
//
//   npm run europass -- --source cv/resume.json --out cv.xml [--lang it] [--photo <file or URL> | --no-photo]
//     [--with-phone] [--no-rendering] [--other-skill-group <name>] [--title x-key=Title]
//     [--profile-name <name>] [--keep basics.phone,x-privacy]
//
// The private fields of resume.config.ts are removed unless listed in --keep: the phone also
// needs --with-phone; without x-privacy the closing statement is meta.themeOptions.printNote.
// The photo defaults to basics.image (a file relative to the JSON, or a URL). Project modules
// are TypeScript: Vite, already used by the build, loads them.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { runnerImport } from 'vite';

const { values } = parseArgs({
  options: {
    source: { type: 'string' },
    out: { type: 'string' },
    lang: { type: 'string' },
    photo: { type: 'string' },
    'no-photo': { type: 'boolean', default: false },
    'with-phone': { type: 'boolean', default: false },
    'no-rendering': { type: 'boolean', default: false },
    'other-skill-group': { type: 'string', multiple: true, default: [] },
    title: { type: 'string', multiple: true, default: [] },
    'profile-name': { type: 'string' },
    keep: { type: 'string', multiple: true, default: [] },
  },
});
if (!values.source || !values.out) {
  console.error(
    'Usage: npm run europass -- --source <file or URL> --out <file.xml> [--lang <code>] [--photo <file or URL> | --no-photo]\n' +
      '  [--with-phone] [--no-rendering] [--other-skill-group <name>] [--title x-key=Title] [--profile-name <name>] [--keep <paths>]',
  );
  process.exit(2);
}

const load = async (path) => (await runnerImport(path)).module;
const [{ default: config }, { readRaw, privatePaths }, { withhold }, { parseResume }, { toEuropass }] =
  await Promise.all(
    [
      'resume.config.ts',
      'src/config/source.ts',
      'src/core/privacy.ts',
      'src/core/schema.ts',
      'src/core/europass.ts',
    ].map((path) => load(`./${path}`)),
  );

const isUrl = (value) => /^https?:\/\//.test(value);
const IMAGE_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };

/** --photo (a path from here or a URL), else basics.image (relative to the JSON, or to its URL). */
function photoLocation(raw) {
  if (values['no-photo']) return undefined;
  if (values.photo) return isUrl(values.photo) ? values.photo : resolve(values.photo);
  const image = raw.basics?.image;
  if (!image || isUrl(image)) return image;
  return isUrl(values.source) ? new URL(image, values.source).href : resolve(dirname(values.source), image);
}

async function readPhoto(location) {
  if (!isUrl(location)) {
    const type = IMAGE_TYPES[extname(location).toLowerCase()] ?? 'application/octet-stream';
    return { bytes: await readFile(location), type };
  }
  const response = await fetch(location, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Photo at ${location} answered ${response.status} ${response.statusText}.`);
  const type = response.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
  return { bytes: new Uint8Array(await response.arrayBuffer()), type };
}

/** "x-talks=Talks" → ["x-talks", "Talks"]. */
const titlePair = (pair) => [pair.slice(0, pair.indexOf('=')), pair.slice(pair.indexOf('=') + 1)];

const raw = await readRaw(values.source, { root: process.cwd(), env: process.env });
const location = photoLocation(raw);
const photo = location && (await readPhoto(location));
// Images reach the converter as bytes; their paths may be local files, which the schema of the
// site (URLs only) would refuse.
delete raw.basics?.image;
delete raw.meta?.themeOptions?.cover;

const { data } = withhold(raw, privatePaths(config, { RESUME_KEEP: values.keep.join(',') }));
const resume = parseResume(data, `JSON Resume (${values.source})`);
const xml = toEuropass(resume, {
  lang: values.lang ?? resume.meta['x-lang'] ?? 'it',
  photo,
  withPhone: values['with-phone'],
  closingStatement: !values['no-rendering'],
  otherSkillGroups: values['other-skill-group'],
  titles: Object.fromEntries(values.title.filter((pair) => pair.includes('=')).map(titlePair)),
  profileName: values['profile-name'],
  onWarning: (message) => console.warn(`Warning: ${message}`),
});
await writeFile(values.out, xml);
process.stdout.write(`Europass XML: ${values.out}\n`);
