# Cap — moteur de personnalisation (A déterministe, B IA, C validation)

Dernière mise à jour : 10/11/2026 (V5 phase IA réelle).

## Principe

| Moteur | Fichiers | Rôle | État |
|---|---|---|---|
| **A — déterministe** | `engine.js`, `training.js`, `business.js`, `matrice.js` | Tous les chiffres critiques, le programme sportif, le classement des activités, les plans | **Actif, sans IA**, testé |
| **B — IA générative** | `prompts.js`, `ia.js`, `ai.js`, `iaui.js` (+ fonction serveur `cap-ai`) | Programme complet et individualisé, adaptation, activités hors catalogue, questions complémentaires, « Pourquoi ? », scan, coach | **Actif dans la version Claude** (IA du compte Claude) ; version GitHub : actif dès que Supabase et la clé API sont configurés |
| **C — validation** | `engine.js` (`validerScan`), `contrats.js` | Vérifie toute sortie de l’IA avant affichage ; refuse ou corrige | Actif, testé avec des réponses IA simulées |

Règle d’honnêteté : tant que B n’est pas connecté, l’interface affiche « Programme calculé par les règles de Cap » / « Classement calculé par les règles de Cap » et « Génération IA indisponible ». Aucun contenu préenregistré n’est présenté comme généré par une IA (`CapContrats.statutIA`).

## A1 — Énergie (`CapEngine.energie`)

Voir CALCULATION_RULES.md, section « Énergie détaillée ». Sorties : métabolisme, méthode, dépense, plage d’incertitude, hypothèses, facteurs influents.

## A2 — Programme sportif (`CapTraining.generer`)

Entrées : âge, niveau, séances voulues, durée, lieu, matériel, priorité, contraintes, zones douloureuses, temps libre, heures de projet, autre sport, frein principal, objectif.

Étapes (chacune enregistrée dans `decisions[]` avec la raison et les réponses utilisées) :
1. **Budget de temps** = temps libre − heures de projet − autre sport (1,5 h par séance). Si la demande dépasse : durée réduite jusqu’à 40 min, puis moins de séances, puis durée plus courte.
2. **Récupération** : séances + autre sport ≤ 6 ; débutant ≤ 4 séances de musculation (les autres en cardio doux) ; moins de 16 ans ≤ 4.
3. **Frein déclaré** : régularité → 3 séances maximum ; temps → 45 min maximum ; motivation → objectifs courts.
4. **Matériel** : salle = tout ; maison = matériel déclaré, sinon hypothèse prudente « aucun » annoncée.
5. **Douleurs** : exercices sollicitant la zone retirés ; zone inconnue → sauts retirés et zone demandée.
6. **Priorité** : forme, muscle ou force ; force refusée aux mineurs et débutants (remplacée par muscle, expliqué).
7. **Découpage** : 1-3 séances corps complet ; 4 haut/bas ; 5-6 poussée/tirage/jambes.
8. **Choix des exercices** dans une bibliothèque de 62 exercices (mouvement, matériel, niveau, exigence technique, articulations sollicitées, consigne). Débutant : technique la plus simple d’abord ; sinon matériel le plus chargeable. Variété entre séances parmi les 2 meilleurs choix. Repli sur le mouvement le plus proche si aucun exercice ne convient (signalé).
9. **Séries / répétitions / repos** selon la priorité ; mineurs : jamais moins de 8 répétitions ; plafond de séries par séance selon le niveau.
10. **Volume hebdomadaire** par muscle comparé aux repères (débutant 6-10, intermédiaire 10-16, avancé 12-20 séries ; Schoenfeld 2017, ACSM 2009) ; sous le repère : signalé avec la cause.
11. **Progression** : double progression ; semaine allégée toutes les 6 semaines au-delà du niveau débutant.

Sortie : séances, planning, alternatives, consignes, progression, notes de sécurité, `parametres`, `empreinte` (reproductibilité). L’adaptation aux séances réellement faites (`CapEngine.adaptation`) reste active.

Limite : la bibliothèque a été relue à partir des principes généraux ACSM/NSCA ; ce n’est pas une validation médicale individuelle.

## A3 — Entreprise : voir BUSINESS_RECOMMENDATION_ENGINE.md et BUSINESS_PLAN_MODEL.md.

## B — Ce que l’IA recevra (`CapContrats`)

- `demandeProgramme(profil, programme, séances)` : profil réduit, contraintes calculées (séances et minutes maximum, matériel, zones exclues), programme actuel, résultats observés, bibliothèque **filtrée** sur le matériel réel, format de réponse JSON. Consigne : adapter sans tout régénérer.
- `demandeMarche(profil, classement)` : activités du top 3, pays, âge ; chaque fait doit citer titre, URL et date ; aucun revenu prévisionnel.
- `contexteCoach(profil, résultats)` : chiffres des moteurs uniquement, décisions du programme avec raisons et réponses utilisées, classement business expliqué, activités écartées.

## C — Validation des réponses de l’IA

| Validateur | Refuse | Corrige |
|---|---|---|
| `validerProgrammeIA` | exercice absent de la bibliothèque, matériel indisponible, zone douloureuse, niveau trop élevé, trop de séances, séance plus longue que le temps disponible (+10 %) | séries hors 1-6, repos hors 20-300 s, moins de 8 répétitions pour un mineur, répétitions illisibles |
| `validerMarcheIA` | activité inconnue, revenu prévisionnel fourni par l’IA | fait sans source datée → reclassé « hypothèse (non sourcé) » |
| `validerQuestionsIA` | plus de 3 questions, champ absent du registre, question non justifiée | — |
| `CapEngine.validerScan` (existant) | aliment illisible, quantité absurde | totaux recalculés par Cap |

Un programme refusé n’est jamais affiché ; Cap garde le programme calculé.

## Sans IA, toujours disponible

`CapContrats.expliquerSansIA` : explication des décisions (énergie, programme, classement) à partir des moteurs. L’écran Programme affiche « Pourquoi ce programme » ; l’onglet Projet affiche l’explication de chaque rang.

## Activation de l’IA (à faire)

1. Activer Supabase et la fonction `cap-ai` (DEPLOYMENT_GUIDE.md).
2. Ajouter dans `cap-ai` les types `programme` et `marche` qui reçoivent `demandeProgramme` / `demandeMarche` (consignes côté serveur).
3. Brancher les validateurs `contrats.js` sur les réponses, puis afficher « proposition IA vérifiée » à côté du programme calculé, avec acceptation explicite.


## Phase IA réelle (10/11/2026)

### Cycle de génération (`ia.js`)
1. Cap construit une demande structurée (`contrats.js`) : réponses, métabolisme et dépense, objectif calorique, tendance de poids, temps réellement disponible, matériel, zones douloureuses, autre sport, historique et ressentis, réponses complémentaires, programme précédent et changements depuis.
2. Les consignes (`prompts.js`, identiques navigateur et serveur) fixent les limites de sécurité et le format JSON.
3. La réponse est validée. Si elle est refusée, l’IA reçoit la liste exacte des erreurs et a droit à **une** correction. Deux refus : rien n’est remplacé, les raisons sont affichées.
4. Les durées sont recalculées par Cap (pas celles annoncées par l’IA).

### Programme
- La bibliothèque (62 exercices) sert de référence ; l’IA peut proposer d’autres exercices s’ils sont plus adaptés, à condition de déclarer mouvement, matériel et articulations sollicitées. Ils sont contrôlés sur le matériel et les douleurs, et affichés « hors bibliothèque, non vérifié par Cap ».
- Chaque séance porte une justification qui cite les réponses ; chaque exercice une raison.
- Chaque version est enregistrée (`programmes`), jamais écrasée. À chaque ouverture, le programme IA actif est **revérifié contre les contraintes actuelles** : s’il ne les respecte plus (temps réduit, nouvelle douleur), il est suspendu et le programme calculé s’affiche, avec la raison.
- Les changements de réponses depuis la génération sont listés champ par champ ; « Adapter avec l’IA » envoie le programme précédent et ces changements, avec consigne de garder ce qui fonctionne.

### Activités
- L’IA propose 3 activités, catalogue ou non. Elle fournit des paramètres (prix bas/médian/haut, heures par unité, heures de prospection, coûts, matériel, régime, âge minimum, réglementation), **jamais de revenu** : budget, statut (compatible / non finançable / écartée), scénarios, seuil et plan 30/60/90 jours sont calculés par Cap et recalculés quand capital, heures ou compétences changent.
- Avec recherche web (serveur), un fait n’est gardé comme « sourcé » que si son URL figure parmi les résultats réellement renvoyés par l’outil de recherche. Sans web (version Claude), tous les faits sont affichés comme hypothèses.

### Questions et « Pourquoi ? »
- Au plus 3 questions, justifiées, liées à une variable du registre ou nouvelles (enregistrées dans `profil.complements`, renvoyées à chaque génération, donc avec une conséquence).
- « Pourquoi ce programme ? » : l’IA répond à partir des réponses, des décisions de sécurité de Cap et des justifications ; sans IA, l’explication calculée s’affiche.

### Tests
- `dev/tests/ia-tests.js` (25) : mécanique avec un transport scripté.
- `dev/essais-ia/` + `dev/tests/reel-verif.js` : **vrais appels au modèle** sur profils fictifs, résultats bruts revalidés hors navigateur.
