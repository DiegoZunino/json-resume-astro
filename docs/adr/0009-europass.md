# 9. Europass XML: porting del convertitore originale, uscita identica

- Stato: accettata (19/10/2026)

## Contesto

Per caricare il CV nel profilo Europass senza ricopiarlo a mano serve un file Europass XML. Il convertitore esisteva già, in Python (solo libreria standard), ed era stato provato con l'importer: le regole che contano non stanno nella documentazione ma in quelle prove. Lo schema XSD («Europass2 CV XML» v3.0.0) non è scaricabile, quindi la struttura si ricava da tre fonti:

- la [documentazione dello schema v3.0.0](https://europass.europa.eu/system/files/2020-08/ECV_Schema_Documentation_v3.0.0_20200602.pdf): elementi e cardinalità, senza esempi né prefissi di namespace;
- un export reale dell'editor (l'XML incorporato in un PDF Europass del 2025, `src/libs/cv/cv.xml` di [benfante-site](https://github.com/benfante/benfante-site)): nomi, prefissi, ordine degli elementi, formato della foto;
- [php-europass](https://github.com/diogogithub/php-europass), un generatore il cui output l'editor ha importato: `hr:ProfileName`, `hr:ExecutiveSummary`, le sezioni libere `Others`, il limite di 99 caratteri.

Ciò che nessun export né php-europass attesta non viene scritto, o solo su richiesta (il telefono).

## Decisione

- Il convertitore è portato in TypeScript come funzione pura, `toEuropass(resume, options)` in `src/core/europass.ts`, con un serializzatore XML minimo in `src/core/xml.ts`: nessuna dipendenza nuova. Identificativi e data della dichiarazione finale si possono passare, così i test sono stabili.
- **L'uscita resta identica, byte per byte, a quella dello script Python** (stessa indentazione, stesso escape, stessi namespace dichiarati): le prove con l'importer valgono anche per il port. Due file di riferimento generati dallo script originale sui dati di esempio (`tests/unit/__snapshots__/europass.*.xml`) lo verificano in ogni esecuzione dei test.
- Un solo scostamento voluto: `x-code` di una lingua accetta anche un codice ISO 639-2/B (`"eng"`), come l'avviso dello script chiedeva ma la ricerca non faceva. Senza `x-code` di tre lettere l'uscita non cambia.
- Lo script `npm run europass` legge la sorgente come il sito (`readRaw`), toglie i campi privati di `resume.config.ts` salvo `--keep` (come `npm run pdf`) e valida con lo schema. Carica i moduli TypeScript con `runnerImport` di Vite, già presente per la build: niente `tsx` né flag sperimentali di Node.

## Conseguenze

Il file XML esce dallo stesso dato del sito, con le stesse regole di privacy. Una correzione futura al formato si fa qui e cambia i file di riferimento: è il segnale che serve una nuova prova di importazione. Lo script Python resta il riferimento storico, non una dipendenza.
