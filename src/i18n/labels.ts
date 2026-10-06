/**
 * Interface text, one catalog per locale. The configuration refuses a locale without a
 * catalog; section titles can be overridden per resume with `meta.themeOptions.labels`.
 */

/** Date of the last review of the accessibility statement (update it with the statement). */
export const STATEMENT_DATE = '2026-10-05';
/** Date of the last review of the privacy notice (update it with the notice). */
export const PRIVACY_DATE = '2026-10-06';

/** What the privacy notice needs to know about the site. */
export interface PrivacyFacts {
  owner: string;
  email?: string | undefined;
  /** The contact form and who handles it. */
  form?: 'netlify' | undefined;
}

export interface Notice {
  title: string;
  paragraphs: string[];
}

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
    privacy: string;
  };
  /** The Contact box at the end of the page. */
  contact: {
    /** "Add to contacts": downloads the contact card (.vcf). */
    vcard: string;
    form: {
      /** One generic line above the form. */
      intro: string;
      name: string;
      email: string;
      message: string;
      send: string;
      sending: string;
      sent: string;
      failed: (email?: string) => string;
      /** Short notice under the form, with a link to the full notice. */
      notice: string;
      noticeLink: string;
    };
    /** Page shown after sending without JavaScript. */
    sentPage: { slug: string; title: string; body: string };
  };
  privacy: {
    slug: string;
    title: string;
    reviewed: string;
    sections: (facts: PrivacyFacts) => Notice[];
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
    privacy: 'Privacy',
  },
  contact: {
    vcard: 'Add to contacts',
    form: {
      intro: 'Write to me here: your message goes straight to my inbox.',
      name: 'Name',
      email: 'Email',
      message: 'Message',
      send: 'Send',
      sending: 'Sending…',
      sent: 'Message sent. Thank you: I will reply as soon as I can.',
      failed: (email) =>
        email ? `The message could not be sent. Please write to ${email}.` : 'The message could not be sent.',
      notice: 'I use your name, email and message only to reply to you.',
      noticeLink: 'Privacy notice',
    },
    sentPage: { slug: 'message-sent', title: 'Message sent', body: 'Thank you: I will reply as soon as I can.' },
  },
  privacy: {
    slug: 'privacy',
    title: 'Privacy notice',
    reviewed: 'Notice last reviewed on',
    sections: ({ owner, email, form }) => [
      {
        title: 'Who is responsible',
        paragraphs: [
          `${owner} is the controller of the personal data described here${email ? `, and can be reached at ${email}` : ''}.`,
        ],
      },
      {
        title: 'Visiting the site',
        paragraphs: [
          'The site sets no cookies, uses no analytics and loads nothing from other sites: fonts and images are served by the site itself.',
          'Like any web server, the service hosting the site records technical data about each request (IP address, page, time, browser) to deliver the pages and protect them from abuse.',
        ],
      },
      ...(form === 'netlify'
        ? [
            {
              title: 'The contact form',
              paragraphs: [
                'If you write through the form I receive your name, email address and message, and I use them only to read and answer your request. The legal basis is your request (Article 6(1)(b) GDPR) and, for messages unrelated to work, my legitimate interest in replying (Article 6(1)(f)). No consent is needed, the data is not used for anything else and is not shared with anyone.',
                'Messages are received and stored by Netlify, Inc., which hosts the site and acts as processor under its data processing agreement; they are stored in the United States, under the EU-US Data Privacy Framework. Netlify checks messages for spam with the Akismet service and sends me a copy by email.',
                'I keep messages for as long as the conversation needs, and no longer than 12 months after the last exchange; then I delete them from Netlify and from my inbox.',
              ],
            },
          ]
        : []),
      {
        title: 'Your rights',
        paragraphs: [
          `You can ask to access, correct or delete your data, to restrict or object to its use, and to receive it in a portable format (Articles 15-22 GDPR)${email ? ` by writing to ${email}` : ''}. You can also lodge a complaint with your data protection authority.`,
        ],
      },
    ],
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
    privacy: 'Privacy',
  },
  contact: {
    vcard: 'Aggiungi ai contatti',
    form: {
      intro: 'Scrivimi da qui: il messaggio arriva direttamente nella mia casella di posta.',
      name: 'Nome',
      email: 'Email',
      message: 'Messaggio',
      send: 'Invia',
      sending: 'Invio in corso…',
      sent: 'Messaggio inviato. Grazie: ti rispondo appena posso.',
      failed: (email) => (email ? `Invio non riuscito. Scrivimi a ${email}.` : 'Invio non riuscito.'),
      notice: 'Uso nome, email e messaggio solo per risponderti.',
      noticeLink: 'Informativa privacy',
    },
    sentPage: { slug: 'messaggio-inviato', title: 'Messaggio inviato', body: 'Grazie: ti rispondo appena posso.' },
  },
  privacy: {
    slug: 'privacy',
    title: 'Informativa sulla privacy',
    reviewed: 'Informativa aggiornata il',
    sections: ({ owner, email, form }) => [
      {
        title: 'Chi tratta i dati',
        paragraphs: [
          `Il titolare del trattamento dei dati descritti qui è ${owner}${email ? `, che puoi contattare all’indirizzo ${email}` : ''}.`,
        ],
      },
      {
        title: 'La visita del sito',
        paragraphs: [
          'Il sito non usa cookie, non usa strumenti di statistica e non carica nulla da altri siti: caratteri e immagini sono serviti dal sito stesso.',
          'Come ogni server web, il servizio che ospita il sito registra dati tecnici delle richieste (indirizzo IP, pagina, ora, browser) per mostrare le pagine e proteggerle dagli abusi.',
        ],
      },
      ...(form === 'netlify'
        ? [
            {
              title: 'Il modulo di contatto',
              paragraphs: [
                'Se mi scrivi dal modulo ricevo nome, indirizzo email e messaggio, e li uso solo per leggere e rispondere alla tua richiesta. La base giuridica è la tua richiesta (art. 6.1.b del GDPR) e, per i messaggi che non riguardano il lavoro, il mio legittimo interesse a risponderti (art. 6.1.f). Non serve un consenso; i dati non sono usati per altro né comunicati ad altri.',
                'I messaggi sono ricevuti e conservati da Netlify, Inc., che ospita il sito e agisce come responsabile del trattamento secondo il suo accordo sul trattamento dei dati; sono conservati negli Stati Uniti, nel quadro dell’EU-US Data Privacy Framework. Netlify controlla i messaggi contro lo spam con il servizio Akismet e me ne invia una copia per email.',
                'Conservo i messaggi per il tempo che serve alla conversazione e comunque non oltre 12 mesi dall’ultimo scambio; poi li cancello da Netlify e dalla mia casella.',
              ],
            },
          ]
        : []),
      {
        title: 'I tuoi diritti',
        paragraphs: [
          `Puoi chiedere di accedere ai tuoi dati, correggerli o cancellarli, limitarne l’uso o opporti, e riceverli in un formato portabile (artt. 15-22 del GDPR)${email ? ` scrivendo a ${email}` : ''}. Puoi anche presentare reclamo al Garante per la protezione dei dati personali.`,
        ],
      },
    ],
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
