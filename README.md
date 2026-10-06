# json-resume-astro

Un frontend generico e accessibile per [JSON Resume](https://jsonresume.org): da un solo file JSON, una pagina web bilingue, il CV in PDF, l'immagine per le anteprime e i dati strutturati. Fatto con [Astro](https://astro.build), statico, senza cookie.

_A generic, accessible front end for JSON Resume built with Astro: web page, PDF CV, social card and structured data from one JSON file. Docs are in Italian; code and comments in English._

[![ci](https://github.com/DiegoZunino/json-resume-astro/actions/workflows/ci.yml/badge.svg)](https://github.com/DiegoZunino/json-resume-astro/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/DiegoZunino/json-resume-astro/badge)](https://securityscorecards.dev/viewer/?uri=github.com/DiegoZunino/json-resume-astro)

## Perché

È un playground per fare esperienza con Astro e con ciò che sa fare oggi un generatore di siti statici, con un vincolo pratico: il CV deve restare **un dato standard**, aggiornabile senza toccare il codice, e da quel dato devono uscire, sempre allineati, la pagina, il PDF e ciò che leggono motori di ricerca e assistenti AI.

## Cosa fa

- **Qualunque JSON Resume v1.0.0**: tutte le sezioni dello schema, più le estensioni `x-` (elenchi di testi o di oggetti con `title`, `url`, `event`, `date`, `summary` e `language`, il codice della lingua della voce, ad esempio `it`: la pagina lo dichiara con `lang` e lo segnala a chi legge).
- **Una lingua per file**, con routing i18n di Astro: la lingua predefinita alla radice, le altre in `/<lingua>/`. I testi dell'interfaccia esistono in italiano e inglese; per un'altra lingua si aggiunge il suo catalogo in [`src/i18n/labels.ts`](src/i18n/labels.ts) (senza, la configurazione si ferma).
- **Prima schermata** con nome, ruolo, una frase e le azioni (CV, email, profili); **percorso** come accordion accessibile con le barre nel tempo; tema chiaro, scuro o automatico.
- **CV in PDF** (A4, testo selezionabile, font incorporati) e **immagine di condivisione** 1200×630 per lingua, generati dagli stessi componenti.
- **Per motori e agenti**: JSON-LD `ProfilePage`, Open Graph, `hreflang`, sitemap, robots, e il JSON Resume pubblico (`/resume.json`, proiettato sullo schema: solo campi dichiarati e sezioni visibili) dichiarato con `<link rel="alternate">`.
- **Campi privati** tolti prima di tutto, con controllo sul risultato della build ([ADR 3](docs/adr/0003-privacy-fail-closed.md)).
- **Content Security Policy** con hash, nessun cookie, nessun tracciamento.

## Uso

Requisiti: Node 22.12 o successivo.

```sh
npm ci
npx playwright install chromium   # serve alla build per PDF e immagini
npm run dev                       # http://localhost:4321, con i dati di esempio
npm run build:fixtures && npm run preview   # build dei dati di esempio, con la loro foto
```

Le sorgenti si configurano in `resume.config.ts`, una per lingua (file o URL), e si possono cambiare senza toccare il codice:

```sh
RESUME_SOURCE_IT=https://gist.githubusercontent.com/<utente>/<id>/raw/resume.json \
RESUME_SOURCE_EN=../cv/resume.en.json \
SITE_URL=https://example.org npm run build
```

Opzioni del tema, tutte facoltative, in `meta.themeOptions` del JSON Resume:

| Opzione                 | Effetto                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tagline: { from, to }` | la frase sotto nome e ruolo, unita dal filo                                                                                                       |
| `intro: string[]`       | paragrafi di presentazione (altrimenti `basics.summary`)                                                                                          |
| `description`           | meta description (altrimenti il sommario accorciato)                                                                                              |
| `labels`                | titoli delle sezioni, anche delle estensioni (`{ "x-talks": "Talk" }`)                                                                            |
| `order`, `hide`         | ordine delle sezioni e sezioni da non mostrare                                                                                                    |
| `printHide`             | sezioni mostrate nella pagina ma non nel PDF (per tenerlo corto)                                                                                  |
| `expanded`              | quanti ruoli recenti restano aperti (predefinito 2)                                                                                               |
| `cover`                 | immagine di testata, `{ "light": URL, "dark": URL }` (dark facoltativa): la propria, ospitata dove si vuole, come la foto; senza, nessuna testata |

Esempio completo: [`fixtures/resume.it.json`](fixtures/resume.it.json).

### Contatti

Il riquadro in fondo alla pagina mostra l'indirizzo email per intero, i profili, il CV e **"Aggiungi ai contatti"**: una scheda contatto (vCard 3.0, `/vcard/<nome>.vcf`) generata dal JSON Resume con nome, ruolo, email, sito, città, profili e foto. Il telefono non c'è mai.

**Modulo di contatto (facoltativo, solo su Netlify).** Con `contactForm: 'netlify'` in `resume.config.ts` (o `CONTACT_FORM=netlify`) il riquadro ha anche un modulo (nome, email, messaggio) gestito da [Netlify Forms](https://docs.netlify.com/manage/forms/setup/). Serve `basics.email`: senza, la build si ferma, perché l'informativa deve dire come contattare il titolare. Funziona solo se il sito è pubblicato su Netlify:

1. nelle impostazioni del sito, **Forms → Enable form detection** (spenta di default), poi un nuovo deploy; il modulo deve comparire tra gli _Active forms_;
2. le notifiche per email si attivano in **Forms → Form notifications → Submission notifications**; partono solo per gli invii verificati, quindi ogni tanto conviene guardare anche _Spam submissions_;
3. lo spam si ferma senza captcha né cookie: il filtro Akismet che Netlify applica a ogni invio e un campo trappola nascosto (`netlify-honeypot`) che i bot riempiono;
4. Netlify non cancella mai gli invii da sola: la cancellazione promessa nell'informativa (`privacy.formDays`) si fa a mano, da **Forms**; gli invii sono conservati negli Stati Uniti;
5. sui piani a crediti i moduli sono compresi senza limite; sui piani _legacy_ il livello gratuito ha circa 100 invii al mese;
6. senza JavaScript il modulo invia normalmente e Netlify mostra la pagina di conferma (`/messaggio-inviato/`); con JavaScript invia sul posto e annuncia l'esito.

Al primo deploy conviene controllare che il modulo sia tra gli _Active forms_, che un invio di prova arrivi (e quali dati registra Netlify nel CSV) e che la scheda contatto sia servita come `text/vcard` (regola in `public/_headers`).

Con il modulo attivo la Content Security Policy passa da `form-action 'none'` a `form-action 'self'`. La pagina `/privacy/` c'è sempre e si adatta a ciò che il sito fa; i dati che non si possono ricavare vanno in `resume.config.ts`:

| Opzione `privacy` | Effetto                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `host`            | chi ospita il sito, per esempio `"Netlify, Inc. (USA)"` (con il modulo Netlify è già Netlify) |
| `mailbox`         | chi gestisce la casella dove arrivano le notifiche, per esempio `"Microsoft (Outlook.com)"`   |
| `formDays`        | entro quanti giorni si cancellano i messaggi dal servizio del modulo (predefinito 30)         |
| `mailMonths`      | entro quanti mesi dall'ultimo scambio si cancellano dalla casella (predefinito 12)            |

L'informativa è un modello in `src/i18n/labels.ts`, scritto in prima persona: chi pubblica il sito la legge, la adatta e ne è responsabile. Prima di pubblicarla va verificata a mano l'adesione di Netlify all'EU-US Data Privacy Framework sul [registro ufficiale](https://www.dataprivacyframework.gov/list). Le scelte sono motivate nell'[ADR 7](docs/adr/0007-contact-form-and-card.md).

## Variabili d'ambiente

Si leggono dall'ambiente o da un file `.env` nella radice del progetto (mai versionato).

| Variabile                | Uso                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `SITE_URL`               | indirizzo pubblico del sito (URL canonici, sitemap, anteprime)                           |
| `RESUME_SOURCE_<LINGUA>` | sorgente di una lingua, file o URL (es. `RESUME_SOURCE_EN`); vince sulla configurazione  |
| `RESUME_STRICT_PHOTO`    | `1`: una foto (o una testata) che non si scarica ferma la build                          |
| `CONTACT_FORM`           | `netlify` accende il modulo di contatto, `off` lo spegne; vuota lascia la configurazione |
| `CONTRACT_FILES`         | file in più da verificare contro lo schema ufficiale nei test di contratto               |

## Pubblicazione

`.github/workflows/deploy.yml` pubblica su Netlify in tre job con privilegi separati: **build** (npm e Chromium, dai dati veri, senza alcun segreto), **publish** (solo `curl` e `jq` con il token, attende che Netlify dichiari il deploy pronto), **verify** (il sito pubblico serve la build appena fatta, descritta in `/build-info.json`). Si costruisce sempre e solo un commit di `main` con i controlli passati. Il sito si ricostruisce dopo ogni push verde, una volta alla settimana e quando il CV cambia: chi aggiorna il gist invia un `repository_dispatch` di tipo `resume-updated` con la revisione, e un controllo orario confronta commit e revisione con quelli pubblicati ([ADR 5](docs/adr/0005-deploy-and-updates.md)). Prima di pubblicare, la build verifica che il repository linkato nel piè di pagina risponda: finché il repository è privato il controllo fallisce e il deploy si ferma. Per pubblicare con il repository privato, togliere `repository` da `resume.config.ts`.

Variabili: `SITE_URL`, `RESUME_GIST` (oppure `RESUME_SOURCE_<LINGUA>`). Segreti: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`.

**Privacy.** Se la sorgente è pubblica (un gist), i campi privati vanno tolti _prima_ di pubblicarla: la configurazione `private` protegge il sito, non la sorgente.

## Licenza

[MIT](LICENSE) per il codice. I dati di esempio sono inventati.
