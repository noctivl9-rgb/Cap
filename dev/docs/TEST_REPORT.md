# TEST_REPORT

Exécutés le 09/11/2026 dans un Chromium sans écran (Playwright), à 390 × 844 et 320 × 640 px. Les tests n'ont **pas** tourné sur un iPhone réel.

## Résumé
| Suite | Commande | Résultat |
|---|---|---|
| Moteur de calcul | `node tests.js` | 80 réussis, 0 échoué |
| Interface v3 (IA et stockage photo simulés) | `node test/ui3.js` | 46 réussis, 0 échoué, 0 erreur console |
| Interface v2 (questionnaire, règle, bilan) | `node test/ui.js` | 33/33 lors de la v2 ; parcours modifié depuis, remplacé par ui3 |

## Ce que couvrent les tests
- Cas de faisabilité : 160 → 30 kg en 2 mois (bloqué, renvoi médical), 110 → 80 kg en 2 mois (trop court, plan progressif), mineur, données manquantes, valeurs aberrantes, débutant 2 × 30 min, 0 séance.
- Finances : capacité positive, nulle, négative, objectif ambitieux, voiture non soutenable, revenu hypothétique, modification des dépenses.
- Journal : ajout, cuisson, modification, duplication, suppression avec recalcul, eau, activité avec et sans option, report, objectifs perso refusés sous le plancher, recettes, favoris, aliments perso, régime halal, navigation vers hier, calendrier.
- Scan : base prioritaire, valeurs de l'IA signalées, total recalculé par le moteur, correction des grammes, suppression, enregistrement.
- Suivi : pas de tendance avec 1 pesée, bilan sur les seuls jours notés, série, jalons mesurés, photo de progression.
- Interface : conversion kg ↔ lb (156,5 lb = 71,0 kg), aperçu du plan sans animation factice, « Réduire les animations », absence de débordement à 320 px sur les 5 onglets.

## Non testé (limites réelles)
- Analyse photo et coach avec Claude réel : testés avec une réponse simulée. La qualité de reconnaissance dépend du modèle.
- Envoi réel des photos de progression (stockage simulé).
- Sauvegarde dans la vraie base, fermeture puis réouverture, connexion coupée : à vérifier sur ton iPhone après publication.
- Fluidité à 60 i/s sur iPhone : non mesurée.
- Lecteur d'écran VoiceOver : rôles et libellés présents, pas testés avec VoiceOver.
- Permissions refusées : les messages existent, le refus réel n'a pas été simulé.

## Mise à jour du 10/11/2026 — sauvegarde, données, compte, IA serveur

Exécutés dans le conteneur de développement (Node 22, Chromium Playwright, Deno 2.9.6, PGlite 0.2.17).
Tous ces tests ont été exécutés ; « simulé » indique un service externe imité, pas un vrai service.

| Suite | Résultat | Ce qui est vérifié |
|---|---|---|
| `dev/tests/tests.js` | 80 / 80 | moteur de calcul (inchangé) |
| `dev/tests/sync-tests.js` | 29 / 29 | export, empreinte, fichiers tronqués ou modifiés refusés, doublons, conflits, modes « garder » et « remplacer », aucune suppression, historique du profil |
| `dev/tests/ui3.js` | 49 / 49 | parcours complet de l'appli (aucune régression) |
| `dev/tests/donnees.js` | 27 / 27 | export/import dans l'interface, confirmation avant remplacement, copie de secours, connexion par code, inscriptions fermées, migration appareil → compte, deuxième appareil, synchro, IA par le serveur — **Supabase simulé dans le navigateur** |
| `dev/tests/persist2.js`, `sk.js`, `dir.js`, `font.js` | réussis | persistance hors compte, Sparkle, accueil, police |
| `supabase/tests/rls-test.mjs` | 15 / 15 | migration SQL exécutée dans un vrai Postgres (embarqué), isolement entre utilisateurs, quotas IA — **auth Supabase imitée** |
| `supabase/tests/cap-ai-test.ts` | 13 / 13 | fonction serveur : jeton exigé, CORS, validation avant dépense, consignes côté serveur, quotas, clé absente — **API Claude et Supabase simulées** |
| Restauration depuis GitHub | réussie | clone neuf → tests moteur et interface réussis, version Claude reconstruite à l'octet près |

Non testé (impossible sans les comptes) : un vrai projet Supabase (e-mail de code, temps réel réel), un vrai appel à l'API Claude
depuis la fonction, l'enregistrement de fichier sur un vrai iPhone (feuille de partage iOS).

## Mise à jour du 10/11/2026 (après-midi) — moteur de personnalisation V5

Tous exécutés dans le conteneur (Node 22, Chromium Playwright, iPhone 14 simulé). Aucun test sur un iPhone réel. Aucune IA réelle appelée.

| Suite | Résultat | Ce qui est vérifié |
|---|---|---|
| `tests.js` | 80 / 80 | moteur historique inchangé (aucune régression après l’ajout de `energie`) |
| `matrice-tests.js` | 89 / 89 | chaque variable du questionnaire est au registre ; changer chaque réponse modifie au moins une sortie déclarée ; questions manquantes justifiées |
| `personnalisation-tests.js` | 47 / 47 | **tests A à J** du cahier V5 (profils fictifs Léa, Karim, Elias) |
| `projet-ui.js` | 21 / 21 | parcours Entreprise seul, onglet Projet, choix d’activité, tâche cochée, vente réelle, réouverture (F), capital modifié dans l’interface (D), historique, programme expliqué |
| `ui3.js` | 49 / 49 | parcours complet existant, adapté au nouveau questionnaire (modules multiples, formule de métabolisme, priorité) |
| `donnees.js`, `sync-tests.js`, `persist2.js`, `sk.js`, `dir.js`, `font.js` | réussis | aucune régression |
| `cap-ai-test.ts`, `rls-test.mjs` | 13 / 13, 15 / 15 | aucune régression côté serveur |
| 320 px, 6 onglets | 0 débordement, 0 libellé tronqué | barre condensée (axe de largeur d’Archivo) |

Défauts trouvés et corrigés par ces tests : « compétences » et « frein » sans effet ; douleur sans zone sans effet visible sur l’empreinte du programme ; projection business comptant un revenu dès le mois 1 alors que le plan d’action place la première vente au mois 2 ; activité à apprendre classée devant une activité maîtrisée ; vérification du temps non expliquée quand le programme tient ; libellés tronqués avec 6 onglets.

Non testé : génération réelle par IA (programme, marché, questions) — non connectée ; prix et demande du catalogue business sur un marché réel ; affichage sur iPhone réel.

## Mise à jour du 10/11/2026 (10 h 30) — IA réelle

- **Appels réels au modèle** (banc « Cap essais IA », compte Claude de l’utilisateur, profils fictifs) : 1 sur 7 exécuté. A1 (programme Karim, genou douloureux) : réponse 1 refusée par Cap (1 erreur), réponse 2 validée ; revalidée indépendamment par `reel-verif.js` (7 / 7). Les 6 autres ont été bloqués par la limite d’usage (« sampling too often ») et ne comptent ni comme réussis ni comme échoués. Le banc lance désormais un essai à la fois.
- `ia-ui.js` (11 / 11, stable sur 5 passages) : parcours IA dans l’interface en rejouant la vraie réponse A1 ; persistance, « Pourquoi ? », changement de temps libre détecté, panne annoncée, historique conservé.
- Faux positif corrigé : une perte de programme intermittente venait du script de test (réinitialisation du profil à chaque rechargement), pas de l’appli.
- Défaut corrigé : boutons IA écrasés sur iPhone → grille de 2 colonnes.

## Mise à jour du 10/11/2026 (fin de matinée) — personnalisation au cas par cas

| Suite | Résultat | Remarque |
|---|---|---|
| `ia-tests.js` | 41 / 41 | + 16 tests : plus de programme modèle envoyé, contenu individuel obligatoire, objectif de poids trop rapide refusé, questions bloquantes, réponse complémentaire ignorée refusée, adaptation sans ajustement refusée, tâches business (boucles, première vente, démarches ajoutées) |
| `ia-ui.js` | 17 / 17 | questions → réponse → programme qui l’utilise → réouverture → « Pourquoi ? » → ajustements proposés → appliqués → panne. Réponses du modèle **scriptées** pour l’interface |
| `cap-ai-test.ts` | 19 / 19 | consignes v2 construites côté serveur |
| autres suites | inchangées, réussies | tests A à J compris |
| **Vrais appels (banc v2)** | **0 exécuté** | 8 profils, 10 essais prêts ; nécessitent un clic sur « Tout lancer » dans l’artefact (compte Claude de l’utilisateur). Les résultats v1 sont classés « anciennes consignes, à relancer ». |
