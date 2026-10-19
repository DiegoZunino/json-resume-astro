/**
 * Contract test: the data this site accepts must also be valid for the official JSON
 * Resume schema (draft-07, via Ajv), so the same file works with every other JSON Resume tool.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';
import { parseResume } from '../../src/core/schema';

const require = createRequire(import.meta.url);
const officialSchema = require('@jsonresume/schema/schema.json') as object;
const { version: schemaVersion } = require('@jsonresume/schema/package.json') as { version: string };
const validate = addFormats(new Ajv({ allErrors: true, strict: false })).compile(officialSchema);

const fixtures = ['fixtures/resume.it.json', 'fixtures/resume.en.json'];
// More files (for example real resumes) can be checked with CONTRACT_FILES=a.json,b.json.
const extra = (process.env.CONTRACT_FILES ?? '').split(',').filter(Boolean);

describe.each([...fixtures, ...extra])('%s', (file) => {
  const data: unknown = JSON.parse(readFileSync(file, 'utf8'));

  it('is valid for the official JSON Resume schema', () => {
    expect(validate(data), JSON.stringify(validate.errors, null, 2)).toBe(true);
  });

  it('declares the schema version it is validated against', () => {
    const declared = (data as { $schema?: unknown }).$schema;
    if (declared === undefined) return;
    // e.g. https://unpkg.com/@jsonresume/schema@1.3.1/schema.json or …/resume-schema/v1.2.1/schema.json
    const version = /(?:@|\/v)(\d+\.\d+\.\d+)\/schema\.json$/.exec(String(declared))?.[1];
    expect(version, `unrecognised $schema: ${String(declared)}`).toBe(schemaVersion);
  });

  it('is valid for this site', () => {
    expect(() => parseResume(data)).not.toThrow();
  });
});
