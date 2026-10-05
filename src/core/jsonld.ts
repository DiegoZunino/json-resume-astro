/** schema.org structured data (ProfilePage with a Person) generated from the resume. */
import type { Resume } from './schema';

export function profilePage(resume: Resume, pageUrl: string, imageUrl?: string): Record<string, unknown> {
  const { basics } = resume;
  const current = resume.work.find((role) => !role.endDate && role.name);
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: pageUrl,
    ...(resume.meta.lastModified ? { dateModified: resume.meta.lastModified } : {}),
    mainEntity: {
      '@type': 'Person',
      name: basics.name,
      ...(basics.label ? { jobTitle: basics.label } : {}),
      ...(basics.summary ? { description: basics.summary } : {}),
      ...(imageUrl ? { image: imageUrl } : {}),
      ...(basics.url ? { url: basics.url } : {}),
      ...(basics.location?.city
        ? {
            address: {
              '@type': 'PostalAddress',
              addressLocality: basics.location.city,
              addressCountry: basics.location.countryCode,
            },
          }
        : {}),
      sameAs: basics.profiles.map((profile) => profile.url).filter(Boolean),
      ...(current ? { worksFor: { '@type': 'Organization', name: current.name } } : {}),
      alumniOf: resume.education
        .filter((entry) => entry.institution)
        .map((entry) => ({ '@type': 'EducationalOrganization', name: entry.institution })),
      knowsLanguage: resume.languages.map((entry) => entry.language).filter(Boolean),
      hasCredential: resume.certificates
        .filter((certificate) => certificate.name)
        .map((certificate) => ({
          '@type': 'EducationalOccupationalCredential',
          name: certificate.name,
          ...(certificate.issuer ? { recognizedBy: { '@type': 'Organization', name: certificate.issuer } } : {}),
        })),
    },
  };
}

/**
 * Serialises JSON for a `<script type="application/ld+json">` block. `<` is escaped so
 * that a value containing `</script>` cannot close the element.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
