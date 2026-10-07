// Prints the PDF CVs only, without publishing anything: for the versions to send, which may
// keep fields the site withholds (the phone) or leave out the photo.
//
//   npm run pdf -- --source it=cv/resume.json --source en=cv/resume.en.json --out export \
//     [--keep basics.phone] [--no-photo] [--name 'Surname_Name_CV_{locale}']
//
// Sources are files or URLs, as in RESUME_SOURCE_<LOCALE>. A photo or cover given as a local
// path (relative to its JSON file) is served on 127.0.0.1 while the build runs. The PDFs land
// in --out as <name>.pdf, where {locale} is replaced (without it: <name>-<locale>.pdf); by
// default as published, <pdfName>-<locale>.pdf.
import { spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import sirv from 'sirv';

const { values } = parseArgs({
  options: {
    source: { type: 'string', multiple: true, default: [] },
    out: { type: 'string' },
    keep: { type: 'string', multiple: true, default: [] },
    'no-photo': { type: 'boolean', default: false },
    name: { type: 'string' },
  },
});
if (!values.out || values.source.length === 0) {
  console.error(
    'Usage: npm run pdf -- --source <locale>=<file or URL> [...] --out <dir> [--keep <path>] [--no-photo] [--name <base>]',
  );
  process.exit(2);
}

const PORT = 4599; // the local image host allowed by astro.config.ts (FIXTURE_PHOTO_SERVER)
const work = await mkdtemp(join(tmpdir(), 'resume-pdf-'));
const images = join(work, 'images');
await mkdir(images);
const isUrl = (value) => /^https?:\/\//.test(value);

/** A local image is copied next to the others and addressed through the local server. */
async function serveLocal(value, from) {
  if (!value || isUrl(value)) return value;
  const file = resolve(from, value);
  const name = `${(await readdir(images)).length}-${basename(file)}`;
  await copyFile(file, join(images, name));
  return `http://127.0.0.1:${PORT}/${encodeURIComponent(name)}`;
}

const env = { ...process.env, FIXTURE_PHOTO_SERVER: '1', CONTACT_FORM: 'off', RESUME_KEEP: values.keep.join(',') };
for (const pair of values.source) {
  const [locale, source] = [pair.slice(0, pair.indexOf('=')), pair.slice(pair.indexOf('=') + 1)];
  if (!locale || !source) throw new Error(`--source expects <locale>=<file or URL>, got "${pair}"`);
  if (isUrl(source)) {
    env[`RESUME_SOURCE_${locale.toUpperCase().replace('-', '_')}`] = source;
    continue;
  }
  const path = resolve(source);
  const resume = JSON.parse(await readFile(path, 'utf8'));
  if (values['no-photo']) delete resume.basics?.image;
  else if (resume.basics?.image) resume.basics.image = await serveLocal(resume.basics.image, dirname(path));
  const cover = resume.meta?.themeOptions?.cover;
  if (cover) for (const key of Object.keys(cover)) cover[key] = await serveLocal(cover[key], dirname(path));
  const copy = join(work, `${locale}.json`);
  await writeFile(copy, JSON.stringify(resume));
  env[`RESUME_SOURCE_${locale.toUpperCase().replace('-', '_')}`] = copy;
}

const server = createServer(sirv(images, { dev: true })).listen(PORT, '127.0.0.1');
await new Promise((done) => server.once('listening', done));
const dist = join(work, 'dist');
const build = spawn('npx', ['astro', 'build', '--outDir', dist], { stdio: 'inherit', env });
const code = await new Promise((done) => build.once('exit', done));
server.close();
if (code !== 0) process.exit(code ?? 1);

await mkdir(values.out, { recursive: true });
for (const file of (await readdir(dist)).filter((entry) => entry.endsWith('.pdf'))) {
  const locale = file.slice(file.lastIndexOf('-') + 1, -'.pdf'.length);
  const named = values.name?.includes('{locale}')
    ? values.name.replaceAll('{locale}', locale)
    : `${values.name}-${locale}`;
  const target = join(values.out, values.name ? `${named}.pdf` : file);
  await copyFile(join(dist, file), target);
  process.stdout.write(`PDF: ${target}\n`);
}
await rm(work, { recursive: true, force: true });
