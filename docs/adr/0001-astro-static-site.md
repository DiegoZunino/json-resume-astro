# 1. Astro, static output

- Stato: accettata (05/10/2026)

## Contesto

Una pagina personale con il CV: contenuto che cambia poche volte al mese, nessuna interazione lato server, priorità a velocità, accessibilità, costo zero di hosting. Il progetto è anche un playground per fare esperienza con un generatore di siti statici moderno.

## Decisione

Astro 7 con `output: 'static'`. Si usano le API del framework invece di soluzioni scritte a mano: content collection con loader, `loadEnv` di Vite per le variabili, routing i18n, Fonts API, `astro:assets`, `security.csp`, `@astrojs/sitemap`, integrazione per i passi dopo la build.

## Alternative considerate

- **Eleventy**: valido, ma in transizione (rinominato Build Awesome nel 2026, v4 in alpha).
- **Next.js con export statico**: più pesante, molte funzioni non disponibili in export.
- **Blazor**: lo static SSR richiede un server ASP.NET Core in esecuzione; non c'è un generatore statico ufficiale (`HtmlRenderer` in un'app console è l'alternativa, candidata a una seconda implementazione per confronto).

## Conseguenze

Zero JavaScript dove non serve (due script piccoli: tema e timeline), HTML completo per motori di ricerca e agenti. La Container API usata nei test dei componenti è sperimentale: può cambiare in una versione minore.
