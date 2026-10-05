# 5. Pubblicazione su Netlify e aggiornamento del CV

- Stato: accettata (05/10/2026)

## Contesto

Il CV vive in un gist pubblico e cambia senza toccare il codice. I gist non hanno webhook. Il deploy usa un token di produzione.

## Decisione

- Il deploy dipende dai controlli (`checks.yml`, workflow riutilizzabile): non si pubblica codice che non passa la CI.
- Si pubblica caricando lo zip di `dist/` con l'API di Netlify (`curl`): nessun codice di terze parti esegue con il token.
- Aggiornamento del dato: chi scrive il gist invia un `repository_dispatch` con la revisione; in più, un controllo orario confronta la revisione del gist con quella pubblicata (`/resume-revision.txt`) e ricostruisce solo se è cambiata. L'URL raw è fissato alla revisione per evitare la cache.
- Le action sono bloccate a SHA (aggiornate da Dependabot); permessi minimi per job.

## Conseguenze

GitHub sospende i workflow programmati di un repository pubblico dopo 60 giorni senza attività: il `repository_dispatch` resta la strada principale.
