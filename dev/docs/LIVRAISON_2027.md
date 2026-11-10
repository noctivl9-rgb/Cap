# Cap 2027 — audit, reconstruction, preuves (10/11/2026)

Branche de travail : `refonte-2027`, fusionnée dans `main` après des tests tous verts.

## 1. Audit (résumé, causes racines)
| Constat | Cause racine | Traitement |
|---|---|---|
| L'IA « ne marche pas » sur la version GitHub | Aucun service IA n'est activé côté serveur : `config.js` est vide, la fonction `cap-ai` n'est pas déployée et aucune clé n'existe. Ce n'est pas un bug : c'est un choix payant en attente de ton accord. | État affiché clairement partout. Les questions rapides du coach sont calculées par Cap, sans IA. |
| IA dans l'appli Claude | Elle fonctionne via la capacité `sample`. Elle doit être confirmée par un appel réel que seul ton navigateur peut faire. | Coach à 12 outils, utilisés seulement si `limits.tools` le permet ; repli sur le coach sans outils sinon. |
| Perte de données nutritionnelles | `normEntree` supprimait les champs facultatifs d'un aliment (sucres, sel, code-barres, « corrigé par toi ») à la sauvegarde suivante du jour. | Corrigé ; test de non-régression dans `nutrition-e2e`. |
| Rendu en double (deux barres) | Une écriture pendant le rendu relançait un rendu complet en plein milieu du premier. | Rendu protégé contre la ré-entrée. |
| Focus perdu pendant la séance | Le bouton qui avait le focus était retiré de la page. | Le focus est gardé dans la séance ; Échap fonctionne partout. |
| Business : un générateur d'idées | Le plan n'avait ni budget réel, ni coûts, ni suivi. | Budget contraignant, tâches chiffrées et détaillées, journal, comparateur, activité existante. |
| Pas de flamme | Elle avait été retirée faute de règles fiables. | Remise avec des règles pures, transparentes et testées. |

**Boutons** : l'audit automatique lit les écouteurs via le protocole Chrome DevTools (`audit-boutons.js`). Résultat : 0 bouton sans action sur 8 écrans, 0 erreur JavaScript.

**Performance (Chromium de test, pas un iPhone)** :
- 0,44 s jusqu'à la barre de navigation ;
- `DOMContentLoaded` en 0,20 s ;
- 10 Mo de mémoire JavaScript ;
- environ 280 Ko compressés au total, dont 91 Ko pour la police.

**Dépendances** : une seule bibliothèque tierce, `supabase-js` 2.118.0 (MIT), fournie avec le site et non chargée depuis un CDN. Aucun `npm` en production.

## 2. Architecture retenue
Vanilla JS sans framework : les modules existants fonctionnent et sont testés, et passer à React n'apporterait rien de mesurable ici. Un retour arrière reste possible via la branche.

| Couche | Modules |
|---|---|
| Calculs déterministes | `engine.js`, `training.js`, `business.js`, `budget.js`, `finances.js`, `flammes.js` |
| IA générative | `ia.js`, `prompts.js`, `ai.js` (sample, outils), `coach.js` |
| Validation | `contrats.js`, `engine.validerScan`, `budget.valider`, `finances.valider`, consentements dans chaque outil du coach |
| Vues | `app.js` (navigation, Programme, Finances, Profil), `accueil.js`, `journal.js`, `photos.js`, `seance.js`, `projet.js`, `projet-budget.js` |

Navigation : Aujourd'hui · Corps (Programme, Journal, Évolution › Mesures/Photos) · ＋ · Avenir (Business, Finances) · Profil. Le coach est accessible depuis l'en-tête de chaque écran.

Nouvelles collections : `depenses`, `fournisseurs`, `decisions`, `operations`, `conversations`. Elles sont ajoutées à la synchronisation, à l'export et à l'effacement. Le schéma SQL est inchangé (collection générique `cap_docs`, nom en `[a-z]` vérifié).

## 3. Fonctionnalités et preuves
| Fonctionnalité | Test | Résultat | Limite |
|---|---|---|---|
| Flamme (actions réelles, repos et reports en pause, 1 oubli par semaine, repas sous le minimum = neutre, surentraînement non compté, record, paliers, calendrier) | `flammes-tests` | 16/16 | Calculée à partir des données, aucun stockage dédié |
| Séance guidée (pause, alternative, gêne avec arrêt et 15/112, retour obligatoire, commentaire, report) | `refonte` | 58/58 | Wake lock non vérifié sur iPhone |
| Budget business (réserve, prévu/payé/récurrent, trésorerie, blocage avec la raison, arrondis) | `budget-tests` | 21/21 | — |
| Parcours business 250 € de bout en bout + activité existante | `business-e2e` | 18/18 | Prix de référence du matériel = hypothèses du catalogue |
| Finances (opérations, modification, recalcul, plus gros poste, alertes) | `finances-tests`, `finances-e2e` | 10/10, 7/7 | Aucune connexion bancaire (volontaire) |
| Coach : 12 outils, refus sans accord, propositions confirmées, questions rapides sans IA | `coach-e2e` | 22/22 | Appel IA réel avec outils non exécuté ici |
| Nutrition : ajout, quantité, correction, code-barres Open Food Facts, fibres/sucres/sel | `nutrition-e2e` | 15/15 | Open Food Facts simulé par interception : le service réel n'est pas joignable depuis cet environnement |
| 8 profils (4 sport, 4 business) | `personas-tests` | 19/19 | Personnalisation par règles ; l'IA se teste sur le banc d'essais |
| Parcours complet, photos, scan, 320 px | `ui3` | 66/66 | — |
| Accessibilité WCAG 2.1 A/AA (axe-core 4.10) | `axe.js` | 0 violation sur 8 écrans | Pas de test VoiceOver réel |
| Serveur IA, RLS Supabase | `cap-ai-test.ts`, `rls-test.mjs` | 19/19, 18/18 | PGlite local, pas un projet Supabase réel |
| Suites historiques | `tests`, `sync`, `matrice`, `personnalisation`, `ia-tests`, `ia-ui`, `projet-ui`, `donnees`, `persist2`, `dir`, `sk`, `font` | toutes réussies | — |

**Reproduire les tests** :
```bash
cd dev/tests && bash build.sh
for t in tests sync-tests matrice-tests personnalisation-tests ia-tests flammes-tests budget-tests finances-tests personas-tests; do node $t.js | tail -1; done
for t in ui3 refonte business-e2e finances-e2e coach-e2e nutrition-e2e ia-ui projet-ui donnees dir sk; do node $t.js | tail -1; done
# persist2 nécessite : (cd out && python3 -m http.server 8765)
# axe : npm install axe-core dans un dossier temporaire, puis AXE=…/axe.min.js node axe.js
```

## 4. Sources externes utilisées
Toutes ont été consultées le 10/11/2026 :
- Service-Public.fr : fiches micro-entrepreneur (N31901), guichet des formalités (R61572), étude de marché (F35958).
- Bpifrance Création : étude de marché, étapes de la création.
- Open Food Facts API v2 (base de données sous licence ODbL, contenus sous DbCL). L'attribution est affichée dans la feuille Code-barres.

## 5. Ce qui reste hors de portée ici
- IA réelle : le banc d'essais doit être lancé depuis ton navigateur. Pour la version GitHub, le service payant attend ton accord.
- Supabase réel : le projet n'a pas été créé. Cela demande tes identifiants et ton accord.
- iPhone réel : safe areas, Dynamic Island, VoiceOver, appareil photo, orientation.
- Code-barres par la caméra : l'API `BarcodeDetector` est absente de Safari iOS. La saisie des chiffres fonctionne.
- Lighthouse : non disponible dans cet environnement.
