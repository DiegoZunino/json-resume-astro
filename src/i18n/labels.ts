/**
 * Interface text, one catalog per locale. The configuration refuses a locale without a
 * catalog; section titles can be overridden per resume with `meta.themeOptions.labels`.
 */

/** Date of the last review of the accessibility statement (update it with the statement). */
export const STATEMENT_DATE = '2026-10-05';

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
  /** Locale used to format dates, e.g. "en-GB" for day-month order. */
  intl: string;
  /** Appended to a dated entry that is still to come (a talk already scheduled). */
  upcoming: string;
  /** Marks an entry in another language: "in Italian". */
  inLanguage: (name: string) => string;
  /** Titles used only in the PDF, where the page has a different job. */
  print: { profile: string; work: string };
  ongoing: string;
  validUntil: string;
  skipToContent: string;
  languageNav: string;
  /** Accessible name of the action buttons under the hero. */
  actions: string;
  downloadCv: string;
  downloadCvDetail: string;
  email: string;
  copy: string;
  copied: string;
  copyFailed: string;
  expandAll: string;
  collapseAll: string;
  theme: { legend: string; system: string; light: string; dark: string };
  footer: {
    updated: string;
    /** Shown when the configuration names a public repository. */
    project: string;
    source: (host: string) => string;
    /** Shown otherwise. */
    builtWith: string;
    data: string;
    accessibility: string;
  };
  accessibility: {
    slug: string;
    title: string;
    reviewed: string;
    paragraphs: (contactEmail?: string) => string[];
  };
  notFound: { title: string; body: string; home: string };
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
  intl: 'en-GB',
  upcoming: 'upcoming',
  inLanguage: (name) => `in ${name}`,
  print: { profile: 'Profile', work: 'Experience' },
  ongoing: 'present',
  validUntil: 'valid until',
  skipToContent: 'Skip to content',
  languageNav: 'Language',
  actions: 'CV and contacts',
  downloadCv: 'Download the CV',
  downloadCvDetail: 'PDF, English',
  email: 'Email',
  copy: 'Copy the address',
  copied: 'Address copied',
  copyFailed: 'Could not copy: select the address instead',
  expandAll: 'Expand all roles',
  collapseAll: 'Collapse all roles',
  theme: { legend: 'Theme', system: 'Auto', light: 'Light', dark: 'Dark' },
  footer: {
    updated: 'Updated',
    project:
      'This site is an open-source project: Astro generates it from a JSON Resume, with automated tests, accessibility checks and continuous integration.',
    source: (host) => `The code is on ${host}`,
    builtWith: 'Built with Astro from a',
    data: 'The data: resume.json',
    accessibility: 'Accessibility',
  },
  accessibility: {
    slug: 'accessibility',
    title: 'Accessibility statement',
    reviewed: 'Statement last reviewed on',
    paragraphs: (email) => [
      'This site aims to conform to the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA.',
      'Every change is checked automatically: axe rules for WCAG 2.2 AA in light and dark theme, the accessible structure of the page, keyboard navigation and the contrast of the focus indicator.',
      'The site works without JavaScript, follows the system theme and reduced-motion settings, supports high-contrast modes and can be zoomed to 400% without horizontal scrolling.',
      'Known limits: automated tests do not find every problem, and tests with screen readers (NVDA, VoiceOver) are not documented yet.',
      email
        ? `If something does not work for you, please write to ${email}: I will reply and fix it.`
        : 'If something does not work for you, please get in touch: I will reply and fix it.',
    ],
  },
  notFound: { title: 'Page not found', body: 'This address does not exist (any more).', home: 'Go to the home page' },
};

const it: Labels = {
  sections: {
    work: 'Esperienza',
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
  intl: 'it-IT',
  upcoming: 'in programma',
  inLanguage: (name) => `in ${name}`,
  print: { profile: 'Profilo', work: 'Esperienza' },
  ongoing: 'oggi',
  validUntil: 'valida fino a',
  skipToContent: 'Vai al contenuto',
  languageNav: 'Lingua',
  actions: 'CV e contatti',
  downloadCv: 'Scarica il CV',
  downloadCvDetail: 'PDF, italiano',
  email: 'Email',
  copy: 'Copia l’indirizzo',
  copied: 'Indirizzo copiato',
  copyFailed: 'Copia non riuscita: seleziona l’indirizzo',
  expandAll: 'Apri tutti i ruoli',
  collapseAll: 'Chiudi tutti i ruoli',
  theme: { legend: 'Tema', system: 'Auto', light: 'Chiaro', dark: 'Scuro' },
  footer: {
    updated: 'Aggiornato il',
    project:
      'Questo sito è un progetto open source: Astro lo genera da un JSON Resume, con test automatici, controlli di accessibilità e integrazione continua.',
    source: (host) => `Il codice è su ${host}`,
    builtWith: 'Realizzato con Astro da un',
    data: 'I dati: resume.json',
    accessibility: 'Accessibilità',
  },
  accessibility: {
    slug: 'accessibilita',
    title: 'Dichiarazione di accessibilità',
    reviewed: 'Dichiarazione aggiornata il',
    paragraphs: (email) => [
      'Questo sito punta alla conformità alle linee guida WCAG 2.2 (Web Content Accessibility Guidelines) di livello AA.',
      'Ogni modifica è verificata in automatico: regole axe per WCAG 2.2 AA in tema chiaro e scuro, struttura accessibile della pagina, navigazione da tastiera e contrasto dell’indicatore di focus.',
      'Il sito funziona senza JavaScript, segue il tema del sistema e la riduzione del movimento, rispetta le modalità ad alto contrasto e si può ingrandire fino al 400% senza scorrimento orizzontale.',
      'Limiti noti: i test automatici non trovano tutti i problemi, e le prove con i lettori di schermo (NVDA, VoiceOver) non sono ancora documentate.',
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
};

const catalog: Record<string, Labels> = { en, it };

export const hasLabels = (locale: string): boolean => locale in catalog;

export function labelsFor(locale: string): Labels {
  const labels = catalog[locale];
  if (!labels) throw new Error(`No interface text for locale "${locale}" in src/i18n/labels.ts.`);
  return labels;
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

const HOSTS: Record<string, string> = { 'github.com': 'GitHub', 'gitlab.com': 'GitLab', 'codeberg.org': 'Codeberg' };

/** Readable name of the host of a repository URL: "GitHub", or the host name. */
export function hostName(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, '');
  return HOSTS[host] ?? host;
}
