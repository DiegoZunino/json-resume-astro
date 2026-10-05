# 3. Campi privati: chiusura in caso di errore

- Stato: accettata (05/10/2026)

## Contesto

La stessa sorgente può contenere dati che non vanno pubblicati (telefono, obiettivo, note interne). Un errore di battitura nella configurazione non deve pubblicarli.

## Decisione

1. I percorsi privati (`basics.phone`, `work.*.x-internal`) sono validati all'avvio contro lo schema: un percorso che non esiste ferma la build.
2. I valori tolti vengono ricordati e, dopo la build, cercati in ogni file pubblicato (HTML, JSON, XML, testo, comprese le pagine da cui si stampano i PDF): se ne compare uno, la build fallisce.
3. Il confine resta dichiarato nel README: se la sorgente è pubblica (un gist), la protezione vale per il sito, non per la sorgente, che deve essere già pulita.

## Conseguenze

Un errore di configurazione si vede in CI, non online. Il controllo è per valore: tiene anche se un componente nuovo stampasse per sbaglio un campo privato.
