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
  /** Who hosts the site, e.g. "Netlify, Inc. (USA)". */
  host?: string | undefined;
  /** Provider of the owner's mailbox, where form notifications arrive. */
  mailbox?: string | undefined;
  /** Days within which messages are deleted from the form service. */
  formDays: number;
  /** Months after the last exchange within which messages are deleted from the mailbox. */
  mailMonths: number;
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
    /** "Save contact": downloads the contact card (.vcf). */
    vcard: string;
    form: {
      /** One generic line above the form, with the address in full for who prefers to copy it. */
      intro: (email: string) => string;
      name: string;
      email: string;
      message: string;
      send: string;
      sending: string;
      sent: string;
      failed: string;
      /** Shown with the address after a failed send. */
      fallback: string;
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
  /** Link back to the home page from the secondary pages. */
  backTo: (name: string) => string;
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
    vcard: 'Save contact',
    form: {
      intro: (email) => `Write to me here or at ${email}. All fields are required.`,
      name: 'Name',
      email: 'Email',
      message: 'Message',
      send: 'Send',
      sending: 'Sending…',
      sent: 'Message sent. Thank you: I will reply as soon as I can.',
      failed: 'The message could not be sent.',
      fallback: 'Please write to me directly:',
      notice: 'I use your name, email and message only to reply to you. The form is handled by Netlify (USA).',
      noticeLink: 'Privacy notice',
    },
    sentPage: { slug: 'message-sent', title: 'Message sent', body: 'Thank you: I will reply as soon as I can.' },
  },
  privacy: {
    slug: 'privacy',
    title: 'Privacy notice',
    reviewed: 'Notice last reviewed on',
    sections: ({ owner, email, form, host, mailbox, formDays, mailMonths }) => [
      {
        title: 'Who is responsible',
        paragraphs: [
          `${owner} is the controller of the personal data described here.${email ? ` For any question about your data, write to ${email}.` : ''}`,
        ],
      },
      {
        title: 'Visiting the site',
        paragraphs: [
          'The site sets no cookies, uses no analytics and loads nothing from other sites: fonts and images are served by the site itself. If you choose the light or dark theme, the choice is kept only in your browser and is never sent to me.',
          `${host ? `The site is hosted by ${host}, which` : 'The service hosting the site'} processes the technical data of each request on my behalf (such as the IP address and the browser) to deliver the pages and protect them from abuse, and keeps it according to its own policies. Legal basis: my legitimate interest in running the site securely (Article 6(1)(f) GDPR).`,
        ],
      },
      ...(form === 'netlify'
        ? [
            {
              title: 'The contact form',
              paragraphs: [
                'If you write through the form I process your name, email address and message, plus the technical data the service records with each message (IP address, browser, referring page). I use them only to read your request and reply: no newsletters, no advertising. Name, email and message are needed to reply: without them the form is not sent.',
                'Legal basis: if you write about possible work together, the pre-contractual steps you ask for (Article 6(1)(b) GDPR); otherwise my legitimate interest in answering whoever writes to me (Article 6(1)(f)). No consent is needed.',
                `The form is handled by Netlify, Inc. (USA), which hosts the site and acts as processor under its data processing agreement. Netlify relies on other providers, among them Automattic Inc. (the Akismet service) for automatic spam filtering and Twilio SendGrid to send me an email notification. The notification reaches my mailbox${mailbox ? `, provided by ${mailbox}` : ''}. I share the data with no one else.`,
                "Messages are stored in the United States. Netlify states that it takes part in the EU-US Data Privacy Framework (European Commission adequacy decision of 10 July 2023); as a fallback, its agreement includes the Commission's standard contractual clauses.",
                `I delete messages from Netlify within ${formDays} days of arrival; I keep the copy in my mailbox for as long as the conversation needs, and no longer than ${mailMonths} months after the last exchange.`,
                `Spam filtering is automatic: a genuine message may be discarded by mistake and not reach me. In that case, please write to me directly${email ? ` at ${email}` : ''}.`,
              ],
            },
          ]
        : []),
      {
        title: 'Your rights',
        paragraphs: [
          `You can ask to access, correct or delete your data, to restrict its use and to receive it in a portable format (Articles 15-20 GDPR)${email ? ` by writing to ${email}` : ''}.`,
          'You can object at any time to processing based on my legitimate interest (Article 21 GDPR).',
          'You can lodge a complaint with the data protection authority of the EU country where you live or work, or with the Italian Garante per la protezione dei dati personali (garanteprivacy.it).',
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
  backTo: (name) => `Back to ${name}’s page`,
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
    vcard: 'Salva contatto',
    form: {
      intro: (email) => `Scrivimi da qui o all’indirizzo ${email}. Tutti i campi sono obbligatori.`,
      name: 'Nome',
      email: 'Email',
      message: 'Messaggio',
      send: 'Invia',
      sending: 'Invio in corso…',
      sent: 'Messaggio inviato. Grazie: ti rispondo appena posso.',
      failed: 'Invio non riuscito.',
      fallback: 'Scrivimi direttamente:',
      notice: 'Uso nome, email e messaggio solo per risponderti. Il modulo è gestito da Netlify (USA).',
      noticeLink: 'Informativa privacy',
    },
    sentPage: { slug: 'messaggio-inviato', title: 'Messaggio inviato', body: 'Grazie: ti rispondo appena posso.' },
  },
  privacy: {
    slug: 'privacy',
    title: 'Informativa sulla privacy',
    reviewed: 'Informativa aggiornata il',
    sections: ({ owner, email, form, host, mailbox, formDays, mailMonths }) => [
      {
        title: 'Chi tratta i dati',
        paragraphs: [
          `Il titolare del trattamento dei dati descritti qui è ${owner}.${email ? ` Per qualunque domanda sui tuoi dati scrivi a ${email}.` : ''}`,
        ],
      },
      {
        title: 'La visita del sito',
        paragraphs: [
          'Il sito non usa cookie, non usa strumenti di statistica e non carica nulla da altri siti: caratteri e immagini sono serviti dal sito stesso. Se scegli il tema chiaro o scuro, la scelta resta salvata solo nel tuo browser e non mi viene inviata.',
          `${host ? `Il sito è ospitato da ${host}, che` : 'Il servizio che ospita il sito'} tratta per mio conto i dati tecnici di ogni richiesta (come l’indirizzo IP e il browser) per consegnare le pagine e proteggerle dagli abusi, e li conserva secondo le proprie politiche. Base giuridica: il mio legittimo interesse al funzionamento e alla sicurezza del sito (art. 6.1.f del GDPR).`,
        ],
      },
      ...(form === 'netlify'
        ? [
            {
              title: 'Il modulo di contatto',
              paragraphs: [
                'Se mi scrivi dal modulo tratto il tuo nome, il tuo indirizzo email e il messaggio, più i dati tecnici che il servizio registra con l’invio (indirizzo IP, browser, pagina di provenienza). Li uso solo per leggere la tua richiesta e risponderti: niente newsletter né pubblicità. Nome, email e messaggio servono per risponderti: senza, il modulo non si invia.',
                'Base giuridica: se mi scrivi per una possibile collaborazione o un incarico, le misure precontrattuali che chiedi (art. 6.1.b del GDPR); negli altri casi il mio legittimo interesse a rispondere a chi mi scrive (art. 6.1.f). Non serve un consenso.',
                `Il modulo è gestito da Netlify, Inc. (USA), che ospita il sito e agisce come responsabile del trattamento secondo il suo accordo sul trattamento dei dati. Netlify si avvale di altri fornitori, tra cui Automattic Inc. (servizio Akismet) per il filtro antispam automatico e Twilio SendGrid per inviarmi la notifica per email. La notifica arriva nella mia casella di posta${mailbox ? `, gestita da ${mailbox}` : ''}. Non comunico i dati a nessun altro.`,
                'I messaggi sono conservati negli Stati Uniti. Netlify dichiara di aderire all’EU-US Data Privacy Framework (decisione di adeguatezza della Commissione europea del 10 luglio 2023); in subordine, il suo accordo prevede le clausole contrattuali tipo della Commissione.',
                `Cancello i messaggi da Netlify entro ${formDays} giorni dall’arrivo; la copia nella mia casella la tengo per il tempo che serve alla conversazione, e comunque non oltre ${mailMonths} mesi dall’ultimo scambio.`,
                `Il filtro antispam è automatico: se un messaggio vero viene scartato per errore, può non arrivarmi. In quel caso scrivimi direttamente${email ? ` a ${email}` : ''}.`,
              ],
            },
          ]
        : []),
      {
        title: 'I tuoi diritti',
        paragraphs: [
          `Puoi chiedere di accedere ai tuoi dati, correggerli o cancellarli, limitarne l’uso e riceverli in un formato portabile (artt. 15-20 del GDPR)${email ? `, scrivendo a ${email}` : ''}.`,
          'Puoi opporti in qualsiasi momento ai trattamenti basati sul mio legittimo interesse (art. 21 del GDPR).',
          'Puoi presentare reclamo al Garante per la protezione dei dati personali (garanteprivacy.it) o all’autorità del Paese dell’Unione europea in cui vivi o lavori.',
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
  backTo: (name) => `Torna alla pagina di ${name}`,
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
