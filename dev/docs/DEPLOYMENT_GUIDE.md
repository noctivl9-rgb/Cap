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
| `dev/docs/` | Règles de calcul, design system, parité Cal AI, rapport de tests, ce guide. |

**Ce que le dépôt ne contient pas : tes données personnelles** (profil, pesées, repas, épargne).
Elles vivent soit dans la base de l'artefact Claude, soit dans le stockage du navigateur de ton téléphone
(version GitHub). Une sauvegarde du code ne sauvegarde pas tes données. L'export/import JSON est la prochaine étape prévue.

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
`db`, `sample` (`images: true`), `assets`. Le script reproduit à l'octet près la version actuellement publiée
(vérifié le 10/11/2026 par comparaison fichier par fichier).

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

Résultat attendu : rien. Toute future clé (IA, Supabase « service role ») doit rester côté serveur,
jamais dans un fichier de ce dépôt public.
