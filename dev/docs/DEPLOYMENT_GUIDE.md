# Cap — installation, publication et restauration

Dernière mise à jour : 10/11/2026.

## Ce que contient ce dépôt

| Emplacement | Contenu |
|---|---|
| racine (`index.html`, `*.js`, `manifest.json`, `icon-*.png`) | L'appli publiée sur GitHub Pages. Source unique de toutes les versions. |
| `brand/` | Logos SVG, sons WAV exportés, licence de la police Archivo (OFL). |
| `dev/scripts/build-claude.sh` | Construit la version « artefact Claude » à partir de la racine. |
| `dev/tests/` | Tests du moteur (Node) et d'interface (Playwright), page de test, photo de repas pour le scan simulé. |
| `dev/brand/` | Scripts d'export du logo, planches de comparaison, police Archivo d'origine (woff2). |
| `dev/docs/` | Règles de calcul, design system, parité Cal AI, architecture des données, rapport de tests, ce guide. |
| `config.js` | Configuration publique de Supabase (vide = mode sans compte). |
| `supabase/` | Schéma SQL avec règles RLS, fonction serveur `cap-ai`, tests du schéma et de la fonction. |
| `vendor/` | Bibliothèque Supabase 2.118.0 (licence MIT), chargée seulement si `config.js` est rempli. |

**Ce que le dépôt ne contient pas : tes données personnelles** (profil, pesées, repas, épargne).
Elles vivent dans la base de l'artefact Claude, dans ton compte Supabase une fois activé, ou dans le stockage du
navigateur de ton téléphone. Une sauvegarde du code ne sauvegarde pas tes données : utilise Réglages → Exporter mes données.

Aucun secret (clé API, mot de passe, jeton) n'est stocké dans le dépôt ni nécessaire pour le faire tourner.

## Prérequis

- Git, Node.js 18 ou plus.
- Pour les tests d'interface : `npm install playwright` puis `npx playwright install chromium`.
- Python 3 (seulement pour le test de persistance, qui sert la page en HTTP).

## Restaurer le projet sur une nouvelle machine

```bash
git clone https://github.com/noctivl9-rgb/cap.git
cd cap
node dev/tests/tests.js            # attendu : « 80 réussis, 0 échoués »
bash dev/tests/build.sh            # construit dev/tests/out/page.html
cd dev/tests && node ui3.js        # attendu : 49 lignes « ok », 0 « FAIL »
```

Test de persistance (mode sans compte, données gardées après fermeture) :

```bash
python3 -m http.server 8765 -d dev/tests/out &
node dev/tests/persist2.js         # attendu : profil gardé = true, mouvement 50 € gardé = true
kill %1
```

Export, import, migration et compte (Supabase simulé) : `cd dev/tests && node donnees.js` (attendu : 27 réussis).
Fusion des données : `node dev/tests/sync-tests.js` (attendu : 29 réussis).
Schéma SQL et RLS : `npm i @electric-sql/pglite@0.2.17 && node supabase/tests/rls-test.mjs` (attendu : 15 réussis).
Fonction IA : `deno run --allow-net --allow-env --allow-read supabase/tests/cap-ai-test.ts` (attendu : 13 réussis).

Autres tests : `node dev/tests/sk.js` (bouton Sparkle), `node dev/tests/dir.js` (accueil, iPhone SE, Reduce Motion),
`node dev/tests/font.js` (police chargée).

## Publier la version GitHub Pages

La racine de la branche `main` est servie telle quelle (réglage Pages : branche `main`, dossier `/root`).

```bash
git add -A && git commit -m "…" && git push
gh api repos/noctivl9-rgb/cap/pages/builds/latest --jq .status   # attendu : built
```

Adresse : https://noctivl9-rgb.github.io/cap/ — sur iPhone : Safari → Partager → Sur l'écran d'accueil.

## Publier la version Claude (scan photo, coach, synchronisation)

```bash
bash dev/scripts/build-claude.sh   # écrit dist-claude/
```

Publier `dist-claude/index.html` avec l'outil Artifact, les 7 fichiers `.js` en fichiers joints, et les capacités
`db`, `sample` (`images: true`), `assets`, `downloads`. Le script reproduit à l'octet près la version actuellement publiée
(vérifié le 10/11/2026 par comparaison fichier par fichier).

## Activer le compte et la synchronisation (Supabase) — à faire par un parent

Supabase et l'API Claude demandent un titulaire majeur. Rien de payant n'est nécessaire pour la synchronisation ;
seule l'IA (scan photo, coach) est payante, à l'usage. Ne colle jamais une clé secrète dans une conversation, Claude compris.

1. Créer un compte sur supabase.com, puis **New project** : nom `cap`, région Europe (Paris ou Francfort),
   mot de passe de base de données long, gardé dans un gestionnaire de mots de passe. Offre **Free**.
2. **SQL Editor** → coller le contenu de `supabase/migrations/20261110000000_cap_init.sql` → **Run**. Résultat attendu : « Success ».
3. **Authentication → Sign In / Providers → Email** : activé. Désactiver **Allow new users to sign up**.
4. **Authentication → Users → Add user** : l'adresse e-mail d'Elias (cocher la confirmation automatique).
5. **Authentication → Emails → Magic Link** : le modèle doit contenir `{{ .Token }}` pour que l'e-mail affiche le code
   à 6 chiffres. Exemple : `Ton code Cap : {{ .Token }}`.
6. **Authentication → URL Configuration** : Site URL `https://noctivl9-rgb.github.io/cap/`.
7. **Project Settings → API Keys** : copier l'adresse du projet et la clé **publishable** (ou `anon`).
   Ces deux valeurs sont publiques : les écrire dans `config.js` (`supabaseUrl`, `supabaseAnonKey`), committer, pousser.
   Ne pas copier la clé `secret` / `service_role`.
8. Sur l'iPhone : Réglages de Cap → Compte Cap → e-mail → code → Envoyer les données.

Vérification : Supabase → Table Editor → `cap_docs` affiche les lignes envoyées ; un deuxième appareil connecté
au même compte retrouve le profil.

### IA côté serveur (facultatif, payant à l'usage)

1. Le parent crée un compte sur platform.claude.com, ajoute un moyen de paiement, fixe une **limite de dépense mensuelle**
   (par exemple 5 $), crée une clé API.
2. Installer la CLI Supabase, puis :
   ```bash
   supabase login
   supabase link --project-ref <identifiant du projet>
   supabase secrets set ANTHROPIC_API_KEY=<clé>          # tapée dans le terminal, jamais dans un fichier du dépôt
   supabase secrets set CAP_ORIGINE=https://noctivl9-rgb.github.io
   supabase functions deploy cap-ai
   ```
   Réglages facultatifs : `CAP_SCANS_JOUR` (20 par défaut), `CAP_MESSAGES_JOUR` (40), `CAP_GENERATIONS_JOUR` (10), `CAP_MODELE` (`claude-haiku-5-5`), `CAP_MODELE_BUSINESS` (`claude-sonnet-5-5`), `CAP_WEB=1` (recherche web réelle pour les activités, 10 $ / 1 000 recherches), `CAP_WEB_MAX` (5).
   Exécuter aussi `supabase/migrations/20261110120000_cap_generations.sql`, puis `bash dev/scripts/sync-shared.sh` avant `supabase functions deploy cap-ai`.
3. Dans `config.js`, passer `ia: true`, committer, pousser.

Vérification : scanner un repas depuis la version GitHub connectée ; Supabase → Table Editor → `cap_ai_usage`
montre le compteur du jour.

## Revenir à une version précédente

```bash
git log --oneline                  # repérer le commit voulu
git revert <commit>                # annule un commit sans réécrire l'historique (recommandé)
git push
```

Ne pas utiliser `git push --force` sur `main` : cela efface l'historique distant.

## Vérifier qu'aucun secret ne sera publié

```bash
git grep -nIiE "(api[_-]?key|secret|password|bearer|sk-[a-z0-9]{10}|AIza[0-9A-Za-z_-]{20})" -- . ':!dev/docs'
```

Résultat attendu : rien (les tests utilisent des clés factices nommées comme telles). Toute future clé (IA, Supabase « service role ») doit rester côté serveur,
jamais dans un fichier de ce dépôt public.
