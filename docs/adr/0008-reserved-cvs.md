# 8. CV riservati in un percorso segreto

- Stato: accettata (19/10/2026)

## Contesto

Per candidarsi serve un CV con dati che il sito non pubblica, come il telefono, con e senza foto. Generarlo a mano altrove produce copie disallineate. Il sito è statico e pubblico, il repository è pubblico, e gli artifact di un repository pubblico sono scaricabili da chiunque abbia un account GitHub.

## Decisione

- Un secret facoltativo, `RESUME_PRIVATE`, contiene i campi privati (`fields`, uniti a ogni lingua del CV) e il nome di una cartella (`path`, almeno 16 caratteri casuali). Senza il secret non cambia nulla.
- Un job a parte, `private`, costruisce i PDF riservati con `npm run pdf` (stesso layout del PDF pubblico): con foto e senza foto, per ogni lingua, con gli stessi nomi del PDF pubblico più `-no-photo`. Il job `build` resta senza segreti.
- I PDF passano a `publish` solo cifrati (AES-256 con chiave derivata dal secret): l'artifact di un repository pubblico è pubblico. `publish` li decifra in `dist/<path>/`, aggiunge per quella cartella `X-Robots-Tag: noindex` e `Cache-Control: no-store`, e dopo il deploy controlla che i file rispondano con quell'intestazione.
- Nulla sul sito porta alla cartella: non compare in pagine, sitemap né `robots.txt` (che la renderebbe nota). Nei log il percorso e i valori privati sono mascherati.

## Conseguenze

È riservatezza, non controllo d'accesso: chi conosce l'indirizzo scarica i file. Va bene per un numero di telefono, non per documenti d'identità; per quelli servirebbe un'area protetta (per esempio con password, che su Netlify è a pagamento). Cambiare `path` nel secret sposta i file al deploy successivo e rende inutilizzabili gli indirizzi vecchi.
