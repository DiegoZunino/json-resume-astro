import { describe, expect, it } from 'vitest';
import { publicResume } from '../../src/core/public';
import { parseResume } from '../../src/core/schema';

describe('publicResume', () => {
  it('publishes schema fields and x- lists, never tool metadata or unknown keys', () => {
    const resume = parseResume({
      basics: { name: 'Ada' },
      'x-talks': ['t'],
      'x-flag': true,
      notes: 'internal',
      meta: { version: '1', 'x-sources': 'private/path', themeOptions: { expanded: 1 } },
    });
    const out = publicResume(resume);
    expect(out['x-talks']).toEqual(['t']);
    expect(out).not.toHaveProperty('x-flag');
    expect(out).not.toHaveProperty('notes');
    expect(out.meta).toEqual({ version: '1', themeOptions: { expanded: 1 } });
  });
});
