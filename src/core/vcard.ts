/**
 * A contact card (vCard 3.0, the version every address book reads, Outlook included)
 * built from `basics`: name, role, email, site, city and profiles, with the photo when
 * there is one. The phone is never written: it is a private field of the resume.
 */
import type { Resume } from './schema';

/** Text values escape backslash, comma, semicolon and newlines (RFC 2426 §5). */
const escape = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\r?\n/g, '\\n');

/** Lines longer than 75 octets continue on the next line, indented by one space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const decoder = new TextDecoder();
  const parts: string[] = [];
  let start = 0;
  while (start < bytes.length) {
    let end = Math.min(start + (start === 0 ? 75 : 74), bytes.length);
    // Never split a UTF-8 character: step back to the start of the next one.
    while (end < bytes.length && (bytes[end]! & 0xc0) === 0x80) end--;
    parts.push(decoder.decode(bytes.slice(start, end)));
    start = end;
  }
  return parts.join('\r\n ');
}

/** "Ada Lovelace King" → family "King", given "Ada Lovelace": a guess, but FN keeps the name whole. */
function nameParts(name: string): [family: string, given: string] {
  const words = name.trim().split(/\s+/);
  return words.length > 1 ? [words.at(-1)!, words.slice(0, -1).join(' ')] : [name.trim(), ''];
}

export interface VCardInput {
  basics: Resume['basics'];
  /** The site, when the resume has no `basics.url`. */
  site?: string | undefined;
  /** JPEG bytes, base64-encoded. */
  photo?: string | undefined;
  /** ISO date of the last change. */
  revision?: string | undefined;
}

export function vcard({ basics, site, photo, revision }: VCardInput): string {
  const [family, given] = nameParts(basics.name);
  const place = basics.location;
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escape(family)};${escape(given)};;;`,
    `FN:${escape(basics.name)}`,
    basics.label && `TITLE:${escape(basics.label)}`,
    basics.email && `EMAIL;TYPE=INTERNET,PREF:${basics.email}`,
    (basics.url ?? site) && `URL:${basics.url ?? site}`,
    place &&
      (place.city || place.region || place.countryCode) &&
      `ADR;TYPE=WORK:;;;${escape(place.city ?? '')};${escape(place.region ?? '')};;${escape(place.countryCode ?? '')}`,
    // Profiles twice: X-SOCIALPROFILE for the address books that show them, URL for the
    // ones (iOS among them) that drop it on import.
    ...basics.profiles
      .filter((profile) => profile.url)
      .flatMap((profile) => [
        `X-SOCIALPROFILE;TYPE=${escape((profile.network ?? 'web').toLowerCase())}:${profile.url}`,
        `URL;TYPE=${escape((profile.network ?? 'web').toLowerCase())}:${profile.url}`,
      ]),
    photo && `PHOTO;ENCODING=b;TYPE=JPEG:${photo}`,
    revision && `REV:${revision}`,
    'END:VCARD',
  ].filter((line): line is string => Boolean(line));
  return `${lines.map(fold).join('\r\n')}\r\n`;
}

/** File name of the card: the name in lower case, ASCII only: "ada-esempio.vcf". */
export function vcardName(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug || 'contact'}.vcf`;
}
