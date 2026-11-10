# Cap — sources de développement

- La racine du dépôt est l'appli publiée sur GitHub Pages (version autonome, données sur l'appareil). C'est la source unique.
- `dev/scripts/build-claude.sh` : construit la version Claude (scan photo, coach, synchronisation) à partir de la racine.
- `dev/tests/tests.js` : 80 tests du moteur de calcul (`node dev/tests/tests.js`).
- `dev/tests/build.sh` puis `ui3.js`, `sk.js`, `dir.js`, `font.js`, `persist2.js` : tests d'interface Playwright (iPhone simulé).
- `dev/tests/id-shots.js` : réexporte les sons en WAV dans `brand/sons/`.
- `dev/brand/` : export du logo (`export.js`), planches (`board.html`, `explore.html`), police Archivo d'origine.
- `dev/docs/` : règles de calcul, design system, parité Cal AI, plan, rapport de tests, guide de déploiement et de restauration.

Installation, tests et restauration : voir `dev/docs/DEPLOYMENT_GUIDE.md`.
