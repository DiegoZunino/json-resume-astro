# 2. Il dato è un JSON Resume, validato due volte

- Stato: accettata (05/10/2026)

## Contesto

Il sito deve funzionare con qualunque JSON Resume e restare compatibile con gli altri strumenti dell'ecosistema (temi, registry, convertitori).

## Decisione

- Lo schema JSON Resume (dal 19/10/2026 la versione 1.3.1 del pacchetto `@jsonresume/schema`, l'ultima pubblicata) è riscritto in Zod (`src/core/schema.ts`), con oggetti aperti come nello schema ufficiale (`z.looseObject`) e due restrizioni in più: URL solo `http(s)` ed email valide, perché finiscono in attributi `href`.
- Un test di contratto (`tests/contract/`) valida i dati di esempio anche con lo schema ufficiale (`@jsonresume/schema`, Ajv): se lo schema Zod diverge, la CI se ne accorge.
- Le personalizzazioni del tema stanno in `meta.themeOptions`, lo spazio che lo schema lascia agli strumenti; le sezioni aggiuntive sono chiavi `x-` di primo livello (elenchi di testi o di oggetti con `title`/`name`). Le chiavi aggiuntive al primo livello sono ammesse dalla v1.1.0 dello schema: la v1.0.0 le rifiuta (`additionalProperties: false`), quindi un file con estensioni deve dichiarare in `$schema` una versione recente; il test di contratto controlla che i dati di esempio dichiarino la stessa versione usata per validarli.

## Conseguenze

Un JSON Resume qualsiasi funziona senza modifiche; le estensioni non rompono gli altri strumenti, che le ignorano.
