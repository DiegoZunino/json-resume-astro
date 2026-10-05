# 6. Accessibilità: WCAG 2.2 AA verificato in CI, dichiarato in una pagina

- Stato: accettata (05/10/2026)

## Contesto

Non c'è obbligo di legge per un sito personale, ma è una prova di mestiere. Nessun badge o certificazione ha valore per un sito privato; gli strumenti automatici trovano una parte dei problemi.

## Decisione

- Obiettivo WCAG 2.2 livello AA.
- In CI: axe (tag WCAG 2.0-2.2 A/AA e best practice) in tema chiaro e scuro con tutti i ruoli aperti, in ogni lingua; ARIA snapshot della struttura; contrasto dell'indicatore di focus; dimensione dei target; reflow a 320 px; Lighthouse con accessibilità a 100.
- Timeline con il pattern accordion dell'APG (titolo > bottone con `aria-expanded`), resa aperta dal server: funziona senza JavaScript e in stampa.
- Una dichiarazione di accessibilità in ogni lingua, con un contatto; nessun overlay, nessun logo di conformità.

## Conseguenze

Le prove manuali con screen reader restano da fare a ogni cambiamento importante; la dichiarazione non afferma più di quanto è verificato.
