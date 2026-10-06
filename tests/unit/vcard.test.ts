import { describe, expect, it } from 'vitest';
import { contactFormFor } from '../../src/config/define';
import { parseResume } from '../../src/core/schema';
import { vcard, vcardName } from '../../src/core/vcard';

const basics = parseResume({
  basics: {
    name: 'Ada Lovelace Byron',
    label: 'Engineering Manager, platform; data',
    email: 'ada@example.org',
    phone: '+39 011 555 0199',
    location: { city: 'Torino', countryCode: 'IT' },
    profiles: [{ network: 'LinkedIn', url: 'https://www.linkedin.com/in/ada' }],
  },
}).basics;

describe('vcard', () => {
  const card = vcard({ basics, site: 'https://example.org/', revision: '2026-10-01' });

  it('is a vCard 3.0 with CRLF line endings', () => {
    expect(card.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')).toBe(true);
    expect(card.endsWith('END:VCARD\r\n')).toBe(true);
    expect(card.replace(/\r\n/g, '')).not.toMatch(/\n/);
  });

  it('writes name, role, email, site, city and profiles, escaping text values', () => {
    expect(card).toContain('N:Byron;Ada Lovelace;;;');
    expect(card).toContain('FN:Ada Lovelace Byron');
    expect(card).toContain('TITLE:Engineering Manager\\, platform\\; data');
    expect(card).toContain('EMAIL;TYPE=INTERNET,PREF:ada@example.org');
    expect(card).toContain('URL:https://example.org/');
    expect(card).toContain('ADR;TYPE=WORK:;;;Torino;;;IT');
    expect(card).toContain('X-SOCIALPROFILE;TYPE=linkedin:https://www.linkedin.com/in/ada');
    expect(card).toContain('URL;TYPE=linkedin:https://www.linkedin.com/in/ada');
    expect(card).toContain('REV:2026-10-01');
  });

  it('never writes the phone', () => {
    expect(card).not.toMatch(/TEL|555/);
  });

  it('folds long lines at 75 octets without splitting a character', () => {
    const photo = 'A'.repeat(300);
    const lines = vcard({ basics: { ...basics, name: 'Àda Lovelace' }, photo }).split('\r\n');
    for (const line of lines) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(lines.filter((line) => line.startsWith(' ')).length).toBeGreaterThan(2);
  });

  it('names the file after the person, in ASCII', () => {
    expect(vcardName('Àda Lovelace')).toBe('ada-lovelace.vcf');
    expect(vcardName('***')).toBe('contact.vcf');
  });
});

describe('contactFormFor', () => {
  it('takes the environment over the file, and refuses unknown hosts', () => {
    expect(contactFormFor({ contactForm: undefined }, {})).toBeUndefined();
    expect(contactFormFor({ contactForm: 'netlify' }, {})).toBe('netlify');
    expect(contactFormFor({ contactForm: undefined }, { CONTACT_FORM: 'netlify' })).toBe('netlify');
    expect(contactFormFor({ contactForm: 'netlify' }, { CONTACT_FORM: '' })).toBeUndefined();
    expect(() => contactFormFor({}, { CONTACT_FORM: 'formspree' })).toThrow(/not supported/);
  });
});
