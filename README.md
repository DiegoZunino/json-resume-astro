# json-resume-astro

Un frontend generico e accessibile per [JSON Resume](https://jsonresume.org): da un solo file JSON, una pagina web bilingue, il CV in PDF, l'immagine per le anteprime e i dati strutturati. Fatto con [Astro](https://astro.build), statico, senza cookie.

_A generic, accessible front end for JSON Resume built with Astro: web page, PDF CV, social card and structured data from one JSON file. Docs are in Italian; code and comments in English._

[![ci](https://github.com/DiegoZunino/json-resume-astro/actions/workflows/ci.yml/badge.svg)](https://github.com/DiegoZunino/json-resume-astro/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/DiegoZunino/json-resume-astro/badge)](https://securityscorecards.dev/viewer/?uri=github.com/DiegoZunino/json-resume-astro)

## Perché

È un piccolo progetto di ricerca su cosa può fare oggi un generatore di siti statici, con un vincolo pratico: il CV deve restare **un dato standard**, aggiornabile senza toccare il codice, e da quel dato devono uscire, sempre allineati, la pagina, il PDF e ciò che leggono motori di ricerca e assistenti AI.

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

| Opzione                 | Effetto                                                                |
| ----------------------- | ---------------------------------------------------------------------- |
| `tagline: { from, to }` | la frase sotto nome e ruolo, unita dal filo                            |
| `intro: string[]`       | paragrafi di presentazione (altrimenti `basics.summary`)               |
| `description`           | meta description (altrimenti il sommario accorciato)                   |
| `labels`                | titoli delle sezioni, anche delle estensioni (`{ "x-talks": "Talk" }`) |
| `order`, `hide`         | ordine delle sezioni e sezioni da non mostrare                         |
| `printHide`             | sezioni mostrate nella pagina ma non nel PDF (per tenerlo corto)       |
| `expanded`              | quanti ruoli recenti restano aperti (predefinito 2)                    |

Esempio completo: [`fixtures/resume.it.json`](fixtures/resume.it.json).

## Qualità

```sh
npm run verify   # lint, tipi, test unitari, di componente e di contratto, build, HTML, end-to-end
```

- **Tipi**: TypeScript con `astro/tsconfigs/strictest`, `astro check`.
- **Unitari** (Vitest) sul nucleo di funzioni pure: schema, privacy, JSON pubblico, date, timeline, sezioni, voci, testo, JSON-LD, configurazione; copertura minima del nucleo 90% delle righe.
- **Componenti** con la Container API di Astro (sperimentale).
- **Contratto** con lo schema ufficiale (`@jsonresume/schema` + Ajv).
- **End-to-end** (Playwright, desktop e mobile, sui dati di esempio, con la foto servita in locale durante la build): comportamento, funzionamento senza JavaScript, tema, lingue, axe (WCAG 2.2 AA) in chiaro e in scuro, contrasto del focus, dimensione dei target, reflow a 320 px, ARIA snapshot, regressione visiva, file pubblicati.
- **CI**: gli stessi controlli più Lighthouse con soglie (accessibilità e SEO a 100), CodeQL, revisione delle dipendenze, OpenSSF Scorecard; action bloccate a SHA, permessi minimi.

## Architettura

```mermaid
flowchart LR
  subgraph sorgenti[Sorgenti]
    F[file locale]
    G[gist o API]
  end
  F & G --> L[content loader<br/>lettura, campi privati, validazione]
  L --> C[(collection resume<br/>una voce per lingua)]
  C --> P[pagine web<br/>/, /en/, dichiarazione]
  C --> D[/resume.json]
  C --> X[pagine /print/ e /og/]
  X --> I[integrazione<br/>astro:build:done]
  I --> PDF[cv-it.pdf, cv-en.pdf]
  I --> OG[og-it.png, og-en.png]
  I --> K{controllo privacy<br/>su tutto dist/}
```

```
src/
  core/          nucleo puro e testato: schema, privacy, date, timeline, sezioni, testo, JSON-LD
  config/        configurazione validata e lettura delle sorgenti (condivise da loader e integrazione)
  loaders/       content loader di Astro
  integrations/  PDF, immagini di condivisione, controllo privacy; script del tema con hash CSP
  i18n/          testi dell'interfaccia
  components/    Hero, azioni, filo, timeline, sezioni, contatti, barra superiore, piè di pagina
  layouts/       documento (metadati) e pagina web
  pages/         pagine, JSON pubblico, favicon, robots, 404
  site/          contesto di pagina e script lato client
docs/adr/        decisioni di architettura
```

Le scelte sono motivate nelle [ADR](docs/adr/): Astro statico, contratto dei dati, privacy, PDF, pubblicazione, accessibilità.

## Variabili d'ambiente

Si leggono dall'ambiente o da un file `.env` nella radice del progetto (mai versionato).

| Variabile                | Uso                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `SITE_URL`               | indirizzo pubblico del sito (URL canonici, sitemap, anteprime)                          |
| `RESUME_SOURCE_<LINGUA>` | sorgente di una lingua, file o URL (es. `RESUME_SOURCE_EN`); vince sulla configurazione |
| `RESUME_STRICT_PHOTO`    | `1`: una foto che non si scarica ferma la build invece di usare il monogramma           |
| `CONTRACT_FILES`         | file in più da verificare contro lo schema ufficiale nei test di contratto              |

## Pubblicazione

`.github/workflows/deploy.yml` pubblica su Netlify in tre job con privilegi separati: **build** (npm e Chromium, dai dati veri, senza alcun segreto), **publish** (solo `curl` e `jq` con il token, attende che Netlify dichiari il deploy pronto), **verify** (il sito pubblico serve la build appena fatta, descritta in `/build-info.json`). Si costruisce sempre e solo un commit di `main` con i controlli passati. Il sito si ricostruisce dopo ogni push verde, una volta alla settimana e quando il CV cambia: chi aggiorna il gist invia un `repository_dispatch` di tipo `resume-updated` con la revisione, e un controllo orario confronta commit e revisione con quelli pubblicati ([ADR 5](docs/adr/0005-deploy-and-updates.md)). Prima di pubblicare, la build verifica che il repository linkato nel piè di pagina risponda: finché il repository è privato il controllo fallisce e il deploy si ferma. Per pubblicare con il repository privato, togliere `repository` da `resume.config.ts`.

Variabili: `SITE_URL`, `RESUME_GIST` (oppure `RESUME_SOURCE_<LINGUA>`). Segreti: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`.

**Privacy.** Se la sorgente è pubblica (un gist), i campi privati vanno tolti _prima_ di pubblicarla: la configurazione `private` protegge il sito, non la sorgente.

<!-- BOZZA da validare con Diego prima della pubblicazione del repository -->

## Come è stato costruito

Il progetto è anche un esperimento di sviluppo con un assistente AI (Claude) usato come agente. Io ho dato requisiti e vincoli e ho preso le decisioni; l'assistente ha scritto codice, test e documentazione, ed è l'autore dei commit, raccolti in commit tematici.

La qualità non si affida alla fiducia. Ogni modifica passa dai controlli automatici descritti sopra. In più il risultato è stato rivisto a giri da tre revisori separati, anch'essi agenti AI, ciascuno con un mandato diverso e senza aver scritto il codice: un CTO per il codice, un esperto di UI e accessibilità, un recruiter per il contenuto. A ogni giro: rapporto scritto con voto, correzioni, nuovo giro. I voti:

| Giro | Codice | UI e accessibilità | Contenuto |
| ---- | ------ | ------------------ | --------- |
| 1    | 6      | 4                  | 4         |
| 2    | 8      | 7                  | 6,5       |
| 3    | 8,5    | 8                  | 7,5       |
| 4    | 9      | 8,5                | 8         |
| 5    | 9,5    | 8,5 → 9            | 8,5       |

Restano da fare a mano, e non sono ancora fatte: la prova con i lettori di schermo (NVDA, VoiceOver). Le decisioni sui contenuti restano mie. Le scelte di fondo sono nelle [ADR](docs/adr/).

## Prossimi esperimenti

- La stessa pagina da un'API invece che da un file (ASP.NET Core Minimal API, Node.js), con le live collection di Astro.
- Una seconda implementazione in .NET con `HtmlRenderer`, per confrontare i due approcci.

## Licenza

[MIT](LICENSE) per il codice. I dati di esempio sono inventati.
