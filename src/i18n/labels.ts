/**
 * Interface text. A locale without labels falls back to English; section titles can be
 * overridden per resume with `meta.themeOptions.labels`.
 */

export interface Labels {
  sections: Record<
    | 'work'
    | 'volunteer'
    | 'education'
    | 'awards'
    | 'certificates'
    | 'publications'
    | 'skills'
    | 'languages'
    | 'interests'
    | 'projects'
    | 'references'
    | 'contact',
    string
  >;
  profile: string;
  ongoing: string;
  validUntil: string;
  skipToContent: string;
  languageNav: string;
  downloadCv: string;
  downloadCvDetail: string;
  email: string;
  expandAll: string;
  collapseAll: string;
  theme: { label: string; system: string; light: string; dark: string };
  footer: { updated: string; builtWith: string; data: string; source: string; accessibility: string };
  accessibility: { slug: string; title: string; paragraphs: (contactEmail?: string) => string[] };
  notFound: { title: string; body: string; home: string };
  photoAlt: string;
}

const en: Labels = {
  sections: {
    work: 'Experience',
    volunteer: 'Volunteering',
    education: 'Education',
    awards: 'Awards',
    certificates: 'Certifications',
    publications: 'Publications',
    skills: 'Skills',
    languages: 'Languages',
    interests: 'Interests',
    projects: 'Projects',
    references: 'References',
    contact: 'Contact',
  },
  profile: 'Profile',
  ongoing: 'present',
  validUntil: 'valid until',
  skipToContent: 'Skip to content',
  languageNav: 'Language',
  downloadCv: 'Download the CV',
  downloadCvDetail: 'PDF, English',
  email: 'Email',
  expandAll: 'Expand all',
  collapseAll: 'Collapse all',
  theme: { label: 'Theme', system: 'automatic', light: 'light', dark: 'dark' },
  footer: {
    updated: 'Updated',
    builtWith: 'Built with Astro from a',
    data: 'JSON Resume',
    source: 'source code',
    accessibility: 'Accessibility',
  },
  accessibility: {
    slug: 'accessibility',
    title: 'Accessibility statement',
    paragraphs: (email) => [
      'This site aims to conform to the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA.',
      'Every change is checked automatically: axe rules for WCAG 2.2 AA in light and dark theme, the accessible structure of the page, keyboard navigation and contrast of the focus indicator. Automated tests do not find every problem: if you run into one, please tell me.',
      'The site works without JavaScript, follows the system theme and reduced-motion settings, and can be zoomed to 400% without horizontal scrolling.',
      email
        ? `If something does not work for you, please write to ${email}: I will reply and fix it.`
        : 'If something does not work for you, please get in touch: I will reply and fix it.',
    ],
  },
  notFound: { title: 'Page not found', body: 'This address does not exist (any more).', home: 'Go to the home page' },
  photoAlt: '',
};

const it: Labels = {
  sections: {
    work: 'Percorso',
    volunteer: 'Volontariato',
    education: 'Formazione',
    awards: 'Riconoscimenti',
    certificates: 'Certificazioni',
    publications: 'Pubblicazioni',
    skills: 'Competenze',
    languages: 'Lingue',
    interests: 'Interessi',
    projects: 'Progetti',
    references: 'Referenze',
    contact: 'Contatti',
  },
  profile: 'Profilo',
  ongoing: 'oggi',
  validUntil: 'valida fino a',
  skipToContent: 'Vai al contenuto',
  languageNav: 'Lingua',
  downloadCv: 'Scarica il CV',
  downloadCvDetail: 'PDF, italiano',
  email: 'Email',
  expandAll: 'Apri tutti',
  collapseAll: 'Chiudi tutti',
  theme: { label: 'Tema', system: 'automatico', light: 'chiaro', dark: 'scuro' },
  footer: {
    updated: 'Aggiornato il',
    builtWith: 'Realizzato con Astro da un',
    data: 'JSON Resume',
    source: 'codice sorgente',
    accessibility: 'Accessibilità',
  },
  accessibility: {
    slug: 'accessibilita',
    title: 'Dichiarazione di accessibilità',
    paragraphs: (email) => [
      'Questo sito punta alla conformità alle linee guida WCAG 2.2 (Web Content Accessibility Guidelines) di livello AA.',
      'Ogni modifica è verificata in automatico: regole axe per WCAG 2.2 AA in tema chiaro e scuro, struttura accessibile della pagina, navigazione da tastiera e contrasto dell’indicatore di focus. I test automatici non trovano tutti i problemi: se ne incontri uno, segnalamelo.',
      'Il sito funziona senza JavaScript, segue il tema del sistema e la riduzione del movimento, e si può ingrandire fino al 400% senza scorrimento orizzontale.',
      email
        ? `Se qualcosa non funziona per te, scrivi a ${email}: rispondo e lo correggo.`
        : 'Se qualcosa non funziona per te, scrivimi: rispondo e lo correggo.',
    ],
  },
  notFound: {
    title: 'Pagina non trovata',
    body: 'Questo indirizzo non esiste (più).',
    home: 'Vai alla pagina principale',
  },
  photoAlt: '',
};

const catalog: Record<string, Labels> = { en, it };

export function labelsFor(locale: string): Labels {
  return catalog[locale] ?? en;
}

/** Native name of a language, e.g. "English", "Italiano". */
export function languageName(locale: string): string {
  const name = new Intl.DisplayNames([locale], { type: 'language' }).of(locale) ?? locale;
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

/** Title of a section: theme override, built-in label, or a readable form of the `x-` key. */
export function sectionTitle(key: string, labels: Labels, overrides: Record<string, string> = {}): string {
  if (overrides[key]) return overrides[key];
  if (key in labels.sections) return labels.sections[key as keyof Labels['sections']];
  const words = key.replace(/^x-/, '').replace(/[-_]+/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
