# 5. Pubblicazione su Netlify e aggiornamento del CV

- Stato: accettata (05/10/2026), rivista lo stesso giorno dopo la revisione del codice

## Contesto

Il CV vive in un gist pubblico e cambia senza toccare il codice. I gist non hanno webhook. Il deploy usa un token di produzione.

## Decisione

- Si costruisce solo un commit di `main` con `ci` passato, qualunque sia l'avvio: dopo `ci` (`workflow_run`) il suo `head_sha`; per il dato che cambia, il controllo orario o l'avvio a mano (solo da `main`), l'ultimo commit verde di `main`, con un avviso se la HEAD non lo è ancora.
- Tre job con privilegi separati: `build` esegue npm e Chromium senza segreti e consegna `dist/` come artifact; `publish` ha il token ed esegue solo `curl` e `jq` (zip caricato con l'API di Netlify, poi attesa dello stato `ready`); `verify` controlla che il sito pubblico serva la build appena fatta (`/build-info.json`: commit, revisione del CV, run), la foto se c'è e i PDF.
- La build di produzione è severa: schema, campi privati e foto (`RESUME_STRICT_PHOTO`) fermano la pubblicazione invece di ripiegare in silenzio.
- Aggiornamento del dato: chi scrive il gist invia un `repository_dispatch` con la revisione; in più, un controllo orario confronta commit verde e revisione del gist con quelli pubblicati (`/build-info.json`) e ricostruisce se uno dei due è cambiato: così anche un deploy di codice rimasto in coda non si perde. L'URL raw è fissato alla revisione per evitare la cache.
- Le action sono bloccate a SHA (aggiornate da Dependabot); permessi minimi per job.

- Una riesecuzione di un vecchio run di `ci` non pubblica: dopo `ci` si costruisce solo se il commit è ancora la HEAD di `main`.
- Una volta alla settimana si ricostruisce comunque: le date calcolate alla build ("in programma") restano vere.
- Prima di pubblicare, la build controlla che il repository linkato nel footer risponda: se è privato o il nome è sbagliato, la pubblicazione si ferma invece di mettere online un 404.

## Conseguenze

Il token di Netlify è personale e vale per tutto l'account: conviene un team Netlify dedicato al sito, e l'environment `production` di GitHub limitato al branch `main`.

GitHub sospende i workflow programmati di un repository pubblico dopo 60 giorni senza attività: il `repository_dispatch` resta la strada principale.
