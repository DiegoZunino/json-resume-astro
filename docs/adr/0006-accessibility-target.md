# 6. Accessibilità: WCAG 2.2 AA verificato in CI, dichiarato in una pagina

- Stato: accettata (05/10/2026), aggiornata con la grafica "Liguria"

## Contesto

Non c'è obbligo di legge per un sito personale, ma è una prova di mestiere. Nessun badge o certificazione ha valore per un sito privato; gli strumenti automatici trovano una parte dei problemi.

## Decisione

- Obiettivo WCAG 2.2 livello AA.
- In CI: axe (tag WCAG 2.0-2.2 A/AA e best practice) in tema chiaro e scuro con tutti i ruoli aperti, in ogni lingua; ARIA snapshot della struttura; contrasto dell'indicatore di focus; dimensione dei target; reflow a 320 px; Lighthouse con accessibilità a 100.
- Timeline con il pattern accordion dell'APG (titolo > bottone con `aria-expanded`), resa aperta dal server: funziona senza JavaScript e in stampa. Ogni ruolo con del testo si apre e si chiude; all'avvio restano aperti i più recenti (`themeOptions.expanded`). Questo rovescia la regola precedente ("nascondere venti parole dietro un clic costa più di quanto risparmia"): con sette o più ruoli la pagina chiusa si legge come un indice, e "Apri tutti i ruoli" sta sulla riga del titolo, che va a capo con il testo ingrandito.
- Asse degli anni e barre sono solo visivi (`aria-hidden`): l'informazione è già nel nome accessibile di ogni ruolo. L'evidenziazione dell'asse risponde al puntatore e al focus da tastiera allo stesso modo.
- Animazioni: solo CSS, nessuna informazione affidata al movimento; tutte spente con `prefers-reduced-motion`; ognuna finisce entro 5 secondi dal momento in cui è visibile (WCAG 2.2.2); le barre e il punto del ruolo attuale partono quando la timeline entra nello schermo. In stampa i pannelli escono interi, senza animazione.
- Una dichiarazione di accessibilità in ogni lingua, con un contatto; nessun overlay, nessun logo di conformità.

## Conseguenze

Le prove manuali con screen reader restano da fare a ogni cambiamento importante; la dichiarazione non afferma più di quanto è verificato.
