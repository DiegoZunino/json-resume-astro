import { describe, expect, it } from 'vitest';
import { assertKnownPaths, findLeaks, withhold } from '../../src/core/privacy';

describe('assertKnownPaths', () => {
  it('accepts schema fields, array wildcards and x- extensions', () => {
    expect(() =>
      assertKnownPaths(['basics.phone', 'work.*.summary', 'x-objective', 'work.*.x-internal']),
    ).not.toThrow();
  });

  it('rejects a typo instead of silently publishing the field', () => {
    expect(() => assertKnownPaths(['basics.phnoe'])).toThrow(/does not match the JSON Resume schema \(at "phnoe"\)/);
  });

  it('rejects malformed paths', () => {
    expect(() => assertKnownPaths(['basics..phone'])).toThrow(/not a dot-separated path/);
    expect(() => assertKnownPaths(['basics.phone '])).toThrow();
  });
});

describe('withhold', () => {
  const data = {
    basics: { name: 'Ada', phone: '+39 011 555 0199' },
    work: [
      { name: 'A', 'x-internal': 'secret one' },
      { name: 'B', 'x-internal': ['secret two'] },
    ],
    'x-objective': { text: 'secret three' },
  };

  it('removes every configured path, including array wildcards, without touching the input', () => {
    const { data: out, values } = withhold(data, ['basics.phone', 'work.*.x-internal', 'x-objective']);
    expect(out).toEqual({ basics: { name: 'Ada' }, work: [{ name: 'A' }, { name: 'B' }] });
    expect(values).toEqual(['+39 011 555 0199', 'secret one', 'secret two', 'secret three']);
    expect(data.basics.phone).toBe('+39 011 555 0199');
  });

  it('ignores paths that are absent from this resume', () => {
    expect(withhold({ basics: { name: 'Ada' } }, ['basics.phone']).values).toEqual([]);
  });
});

describe('findLeaks', () => {
  it('finds withheld values, also phone numbers written differently', () => {
    expect(findLeaks('call +39 011 555 0199', ['+39 011 555 0199'])).toHaveLength(1);
    expect(findLeaks('tel:+390115550199', ['+39 011 555 0199'])).toHaveLength(1);
    expect(findLeaks('nothing here', ['+39 011 555 0199', 'secret one'])).toEqual([]);
  });

  it('ignores very short values, which would match by chance', () => {
    expect(findLeaks('yes', ['yes'])).toEqual([]);
  });
});
