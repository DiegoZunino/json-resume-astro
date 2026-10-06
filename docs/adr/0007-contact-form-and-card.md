# 7. Contatti: scheda vCard, modulo con Netlify Forms, informativa

- Stato: accettata (06/10/2026)

## Contesto

Il riquadro in fondo alla pagina ripeteva i bottoni in alto. Chi legge fino in fondo ha deciso di scrivere: gli servono l'indirizzo per intero, un modo per salvare il contatto e, per chi usa la posta dal browser (dove `mailto:` non fa nulla), un modo per scrivere senza uscire dalla pagina. Il sito è statico e il progetto è generico: niente server proprio, niente dati del proprietario nel codice.

## Decisione

- **Scheda contatto (vCard 3.0)**, generata alla build da `basics` per ogni lingua, in `/vcard/<nome>.vcf`, con il tipo `text/vcard` impostato in `public/_headers`. La 3.0 perché Outlook non legge la 4.0. Mai il telefono né l'indirizzo stradale, qualunque sia la configurazione. Foto in base64 (JPEG 256 px, raddrizzata secondo l'EXIF): un URL spesso viene ignorato all'importazione. La scheda è nel controllo anti-fuga dei dati privati, letta come testo piano.
- **Modulo di contatto facoltativo, solo con Netlify Forms** (`contactForm: 'netlify'` o `CONTACT_FORM`). Il sito si pubblica già su Netlify ([ADR 5](0005-deploy-and-updates.md)): nessun servizio terzo in più, nessuna chiave, nessuno script esterno. Il modulo funziona senza JavaScript (POST e pagina di conferma con `noindex`); con JavaScript invia sul posto e annuncia l'esito. La CSP passa a `form-action 'self'` solo quando il modulo c'è.
- **Spam senza captcha**: il filtro Akismet di Netlify e un campo trappola nascosto. reCAPTCHA porterebbe cookie, un trasferimento a Google ed eccezioni alla CSP.
- **Informativa sempre presente** (`/privacy/`), costruita dai fatti del sito: senza cookie, il tema salvato solo nel browser, l'hosting, e con il modulo i dati raccolti, le basi giuridiche (art. 6.1.b per le richieste di lavoro, 6.1.f per il resto: nessun consenso), Netlify come responsabile con i suoi fornitori, il trasferimento negli Stati Uniti, la conservazione, i diritti e il reclamo. I dati che non si possono ricavare (chi gestisce la casella, i tempi di cancellazione) stanno in `resume.config.ts` (`privacy`). Con il modulo serve `basics.email`, altrimenti la build si ferma.

## Conseguenze

Il modulo lega il sito a Netlify: con un altro hosting si spegne. Netlify non cancella gli invii da sola: la conservazione promessa si rispetta a mano. Il testo dell'informativa è un modello: chi pubblica lo adatta e ne risponde; l'adesione di Netlify al Data Privacy Framework va verificata sul registro ufficiale prima di pubblicare.
