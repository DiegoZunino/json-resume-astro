# 2. Il dato è un JSON Resume, validato due volte

- Stato: accettata (05/10/2026)

## Contesto

Il sito deve funzionare con qualunque JSON Resume e restare compatibile con gli altri strumenti dell'ecosistema (temi, registry, convertitori).

## Decisione

- Lo schema JSON Resume v1.0.0 è riscritto in Zod (`src/core/schema.ts`), con oggetti aperti come nello schema ufficiale (`z.looseObject`) e due restrizioni in più: URL solo `http(s)` ed email valide, perché finiscono in attributi `href`.
- Un test di contratto (`tests/contract/`) valida i dati di esempio anche con lo schema ufficiale (`@jsonresume/schema`, Ajv): se lo schema Zod diverge, la CI se ne accorge.
- Le personalizzazioni del tema stanno in `meta.themeOptions`, lo spazio che lo schema lascia agli strumenti; le sezioni aggiuntive sono chiavi `x-` di primo livello (elenchi di testi o di oggetti con `title`/`name`).

## Conseguenze

Un JSON Resume qualsiasi funziona senza modifiche; le estensioni non rompono gli altri strumenti, che le ignorano.
