# Contribuire

Grazie! Il progetto è piccolo: issue e pull request brevi sono le benvenute.

1. `npm ci` e `npx playwright install chromium`.
2. Modifica, poi `npm run verify` (lint, tipi, test, build, end-to-end).
3. Se cambi l'aspetto: `npx playwright test --update-snapshots` e controlla le immagini nella PR.
4. Commit nel formato [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`…): versioni e CHANGELOG si generano da lì.
5. Se cambi una decisione di architettura, aggiorna o aggiungi un'ADR in `docs/adr/`.

Niente dati personali veri nei test: usa `fixtures/`.
