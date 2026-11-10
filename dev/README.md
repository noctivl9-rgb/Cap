# Cap — sources de développement

- La racine du dépôt est l'appli publiée sur GitHub Pages. C'est la source unique. Sans `config.js` rempli : données sur l'appareil ; rempli : compte Supabase synchronisé.
- `dev/scripts/build-claude.sh` : construit la version Claude (scan photo, coach, synchronisation) à partir de la racine.
- `dev/tests/tests.js` : 80 tests du moteur de calcul (`node dev/tests/tests.js`).
- `dev/tests/build.sh` puis `ui3.js`, `sk.js`, `dir.js`, `font.js`, `persist2.js` : tests d'interface Playwright (iPhone simulé).
- `dev/tests/sync-tests.js` : 29 tests d'export/import/fusion ; `donnees.js` : 27 tests d'interface (sauvegarde, import, compte, migration, IA serveur simulée).
- `supabase/` : schéma SQL (RLS), fonction serveur `cap-ai`, tests `rls-test.mjs` (Postgres embarqué) et `cap-ai-test.ts` (Deno).
- `dev/tests/id-shots.js` : réexporte les sons en WAV dans `brand/sons/`.
- `dev/brand/` : export du logo (`export.js`), planches (`board.html`, `explore.html`), police Archivo d'origine.
- `dev/docs/` : règles de calcul, design system, parité Cal AI, plan, rapport de tests, guide de déploiement et de restauration.

Installation, tests et restauration : voir `dev/docs/DEPLOYMENT_GUIDE.md`.
