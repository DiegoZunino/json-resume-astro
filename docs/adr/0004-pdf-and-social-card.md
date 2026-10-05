# 4. PDF e immagine di condivisione stampati da Chromium dopo la build

- Stato: accettata (05/10/2026)

## Contesto

Servono un CV in PDF con lo stesso contenuto e la stessa identità visiva della pagina, e un'immagine 1200×630 per le anteprime (LinkedIn, chat).

## Decisione

Due pagine dedicate per lingua (`/print/`, `/og/`) costruite con gli stessi componenti; un'integrazione Astro (`astro:build:done`) le serve in locale con `sirv`, le stampa con Playwright (PDF A4 taggato, con segnalibri; PNG 1200×630) e poi le rimuove dal sito pubblicato.

Il font è incorporato con istanze statiche (non il font variabile), così Chromium lo scrive nel PDF come TrueType e non come Type 3: testo selezionabile e leggibile dagli ATS.

## Alternative considerate

- **Paged.js / Vivliostyle**: impaginazione da libro (testatine, numeri di pagina); utili oltre le due pagine, non qui.
- **Typst o LaTeX**: un secondo motore di impaginazione da mantenere, con un'identità visiva da duplicare.

## Conseguenze

La build richiede Chromium (in CI: `npx playwright install chromium`). Un solo foglio di stile per web e carta.
