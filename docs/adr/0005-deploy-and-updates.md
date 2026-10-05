# 5. Pubblicazione su Netlify e aggiornamento del CV

- Stato: accettata (05/10/2026), rivista lo stesso giorno dopo la revisione del codice

## Contesto

Il CV vive in un gist pubblico e cambia senza toccare il codice. I gist non hanno webhook. Il deploy usa un token di produzione.

## Decisione

- Il deploy parte da `workflow_run` dopo che `ci` è passato su `main` (i controlli girano una volta sola per push) e costruisce esattamente quel commit: non si pubblica codice che non passa la CI.
- Tre job con privilegi separati: `build` esegue npm e Chromium senza segreti e consegna `dist/` come artifact; `publish` ha il token ed esegue solo `curl` e `jq` (zip caricato con l'API di Netlify, poi attesa dello stato `ready`); `verify` controlla che il sito pubblico serva la revisione appena costruita, la foto e il PDF.
- La build di produzione è severa: schema, campi privati e foto (`RESUME_STRICT_PHOTO`) fermano la pubblicazione invece di ripiegare in silenzio.
- Aggiornamento del dato: chi scrive il gist invia un `repository_dispatch` con la revisione; in più, un controllo orario confronta la revisione del gist con quella pubblicata (`/resume-revision.txt`) e ricostruisce solo se è cambiata. L'URL raw è fissato alla revisione per evitare la cache.
- Le action sono bloccate a SHA (aggiornate da Dependabot); permessi minimi per job.

## Conseguenze

GitHub sospende i workflow programmati di un repository pubblico dopo 60 giorni senza attività: il `repository_dispatch` resta la strada principale.
