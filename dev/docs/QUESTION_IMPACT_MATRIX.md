# QUESTION_IMPACT_MATRIX — Cap

Généré le 2026-11-10 par `node dev/scripts/matrice-doc.js` depuis `matrice.js`. Ne pas modifier à la main.

Règle : chaque question influence au moins un calcul, une recommandation, une décision, une fonctionnalité ou une règle de sécurité. `dev/tests/matrice-tests.js` le vérifie pour chaque question en changeant la réponse et en comparant les sorties des moteurs.

## Résultats de l’audit (10/11/2026)

- Avant la V5, deux questions n’avaient **aucune conséquence** dans le code : « compétences » (enregistrée, jamais lue) et « frein principal » (enregistrée, jamais lue). Corrigé : les compétences pilotent le classement business ; le frein ajuste le programme et le conseil nutrition.
- « Tour de taille » ne servait qu’au suivi : il calcule désormais le rapport tour de taille / taille (repère NICE).
- « Sexe » est devenu « formule de métabolisme » avec l’option « ne pas répondre » (moyenne des deux formules, marge élargie). Il n’est jamais déduit de l’identité de genre.
- Le temps de projet n’était déduit du temps libre que pour le module Argent ; il l’est aussi pour Entreprise.

## Registre

| Question | Variable (unité) | Condition d’affichage | Validation | Utilité | Calculs | Modules | Recalcul | Si absente |
|---|---|---|---|---|---|---|---|---|
| Sur quoi veux-tu avancer ? <br>`domaines` · choix multiple | `domaines` (—) | toujours | au moins un module | Décide quelles questions sont posées et quels onglets existent. | tous | questionnaire, navigation | Ajout d’un module : ses questions sont demandées ; retrait : ses données sont gardées, non affichées. | Bloque la suite : au moins un module requis. |
| Quel âge as-tu ? <br>`age` · règle | `age` (ans) | toujours | 10 à 100 ; moins de 13 bloqué | Choix de la formule (Schofield avant 18 ans), plafonds de rythme, minimum de calories, statuts juridiques possibles. | metabolisme, rythme max, plancher kcal, séries/répétitions, activités légales | énergie, objectif poids, programme, entreprise, sécurité mineurs | Recalcule énergie, plan de poids, programme et classement business. | Aucun calcul physiologique ni business : Cap demande l’âge. |
| Combien d’heures libres as-tu par semaine ? <br>`tempsLibre` · règle | `tempsLibre` (h/semaine) | toujours | 0 à 100 | Budget de temps : le programme sportif et le projet doivent y tenir. | budget temps du programme, alerte de cohérence | programme, cohérence | Réorganise le programme (durée puis nombre de séances). | Programme non vérifié contre la semaine, signalé dans les décisions. |
| Quelle formule de métabolisme utiliser ? <br>`sexe` · choix | `sexe` (—) | domaines contient corps | H, F ou nr | Paramètre physiologique de l’équation. Jamais déduit de l’identité de genre. « nr » : moyenne des deux formules et marge élargie. | metabolisme, plancher kcal | énergie, objectif poids | Recalcule métabolisme, dépense, plage d’incertitude et calories. | Requis pour le calcul ; l’option « ne pas répondre » existe. |
| Quelle est ta taille ? <br>`taille` · règle | `taille` (cm) | domaines contient corps | 120 à 230 | Mifflin-St Jeor, IMC, rapport tour de taille / taille. | metabolisme, IMC, rapport tour/taille | énergie, objectif poids | Recalcule énergie, IMC et limites de cible. | Repli Schofield (poids seul) pour l’énergie ; IMC non calculé. |
| Quel est ton poids ? <br>`poids` · règle | `poids` (kg) | domaines contient corps | 30 à 300 | Métabolisme, dépense du sport, protéines, eau, point de départ du suivi. | metabolisme, dépense sport, macros, eau, rythme | énergie, objectif poids, nutrition, suivi | Recalcule toutes les estimations physiques concernées. | Aucun calcul : Cap demande le poids. |
| Ton tour de taille ? <br>`tour` · règle (facultative) | `tour` (cm) | domaines contient corps | 40 à 200 | Rapport tour de taille / taille (repère NICE) et suivi de la perte de gras. | rapport tour/taille | objectif poids, progrès | Recalcule l’indicateur. | Indicateur non calculé, dit explicitement. |
| Quel est ton objectif ? <br>`objectif` · choix | `objectif` (—) | domaines contient corps | perdre, maintenir, prendre | Sens de l’écart calorique, protéines, priorité sportive par défaut. | écart kcal, protéines, priorité | objectif poids, nutrition, programme | Recalcule calories, macros et programme. | Requis. |
| Quel poids vises-tu ? <br>`cible` · règle | `cible` (kg) | domaines contient corps et objectif ≠ maintenir | 30 à 300 ; contrôle IMC cible | Écart à couvrir, faisabilité, détection d’objectif dangereux. | écart, statut, semaines | objectif poids, sécurité | Recalcule statut et calendrier. | Plan de poids non calculé. |
| En combien de temps ? <br>`delai` · choix | `delaiSem` (semaines) | domaines contient corps et objectif ≠ maintenir | liste | Compare le rythme requis au maximum prudent. | rythme requis, statut | objectif poids | Recalcule le statut (réaliste, ambitieux, trop court). | Statut « libre » : rythme recommandé. |
| Ton rythme <br>`faisabilite` · choix | `rythme` (kg/semaine) | domaines contient corps et objectif ≠ maintenir | plafonné au maximum prudent | Écart calorique quotidien. | écart kcal, semaines | objectif poids | Recalcule calories et durée. | Rythme recommandé appliqué et affiché. |
| En dehors du sport, ta journée est plutôt… <br>`activite` · choix | `activite` (coefficient) | domaines contient corps | assis, mixte, physique | Coefficient d’activité hors sport (le sport est compté à part pour ne pas le compter deux fois). | PAL, dépense | énergie | Recalcule la dépense. | Aucun calcul de dépense. |
| Pratiques-tu un autre sport ? <br>`autreSport` · choix | `autreSport` (séances/semaine) | domaines contient corps | 0 à 5+ | Dépense du sport, budget de temps, jours de repos. | dépense sport, budget temps, récupération | énergie, programme | Recalcule dépense et programme. | 0 supposé seulement si choisi. |
| Ton niveau en musculation ? <br>`niveau` · choix | `niveau` (—) | domaines contient corps | 3 niveaux | Séances maximum, exercices autorisés, volume, progression. | séances max, volume, exercices | programme | Régénère le programme. | Programme non construit. |
| Combien de séances de musculation par semaine ? <br>`jours` · choix | `jours` (séances) | domaines contient corps | 0 à 6 | Nombre de séances et découpage (corps complet, haut/bas, poussée/tirage). | découpage, dépense sport | programme, énergie | Régénère le programme. | Programme non construit. |
| Combien de temps par séance ? <br>`minutes` · choix | `minutes` (min) | domaines contient corps et jours > 0 | 20 à 90 | Nombre d’exercices par séance, dépense du sport. | durée, volume | programme, énergie | Régénère le programme. | Programme non construit. |
| Où t’entraînes-tu ? <br>`lieu` · choix | `lieu` (—) | domaines contient corps et jours > 0 | salle, maison | Matériel disponible. | exercices possibles | programme | Régénère le programme. | Programme non construit. |
| Quel matériel as-tu chez toi ? <br>`materielSport` · choix multiple | `materielSport` (—) | domaines contient corps, jours > 0, maison | liste | Exercices possibles et alternatives. | sélection d’exercices | programme | Régénère le programme. | Hypothèse prudente « aucun matériel », signalée. |
| Ta priorité à l’entraînement ? <br>`prioriteSport` · choix | `prioriteSport` (—) | domaines contient corps et jours > 0 | forme, muscle, force, auto | Séries, répétitions, repos. Force refusée aux mineurs et débutants. | séries, répétitions, repos | programme | Régénère le programme. | Déduite de l’objectif, signalé. |
| Quelque chose à prendre en compte ? <br>`contraintes` · choix multiple | `contraintes` (—) | domaines contient corps | liste | Règles de sécurité : exclusion d’exercices, avis médical. | exclusions, notes de sécurité | programme, sécurité | Régénère le programme. | Requis. |
| Où as-tu mal ? <br>`zonesDouleur` · choix multiple | `zonesDouleur` (—) | domaines contient corps et douleur déclarée | liste | Retire les exercices qui sollicitent la zone. | exclusions | programme, sécurité | Régénère le programme. | Sauts retirés par prudence, zone demandée. |
| Ton alimentation <br>`regime` · choix | `regime` (—) | domaines contient corps | liste | Filtre la base d’aliments et les suggestions. | aliments compatibles | nutrition | Filtre immédiatement le journal et la recherche. | Omnivore par défaut, modifiable. |
| As-tu déjà compté tes calories ? <br>`suivi` · choix | `modeSimple` (—) | domaines contient corps | oui/non | Ce que l’accueil affiche (calories et protéines seulement, ou toutes les macros). | — | interface accueil | Accueil réaffiché. | Toutes les macros affichées. |
| Qu’est-ce qui t’a le plus freiné ? <br>`obstacle` · choix (facultatif) | `obstacle` (—) | domaines contient corps | liste | Ajuste le programme (régularité : 3 séances max ; temps : 45 min max ; motivation : objectifs courts) et le conseil nutrition. | séances, durée, conseil | programme, nutrition | Régénère le programme et le conseil. | Aucun ajustement. |
| Combien reçois-tu par mois ? <br>`revenus` · montant | `revenus` (€/mois) | domaines contient argent | ≥ 0 | Capacité d’épargne, soutenabilité du projet. | capacité, délai, soutenabilité voiture | argent | Recalcule capacité et calendrier. | Aucun calcul financier. |
| Tes dépenses fixes par mois ? <br>`fixes` · montant | `fixes` (€/mois) | domaines contient argent | ≥ 0 | Capacité d’épargne, réserve de sécurité. | capacité, réserve | argent | Recalcule. | Aucun calcul financier. |
| Tes dépenses variables par mois ? <br>`variables` · montant | `variables` (€/mois) | domaines contient argent | ≥ 0 | Capacité d’épargne, réserve. | capacité, réserve | argent | Recalcule. | Aucun calcul financier. |
| Rembourses-tu un crédit ? <br>`remboursements` · montant | `remboursements` (€/mois) | domaines contient argent | ≥ 0 | Capacité, alerte surendettement. | capacité, alerte | argent, sécurité | Recalcule. | Requis (0 si aucun). |
| Combien as-tu de côté aujourd’hui ? <br>`epargne` · montant | `epargne` (€) | domaines contient argent | nombre | Point de départ, reste à réunir, étape en cours. | reste, délai | argent | Recalcule. | Aucun calcul financier. |
| Quel est ton grand projet ? <br>`reve` · choix + montant | `reve` (€) | domaines contient argent | liste ou montant > 0 | Coût du projet de vie (sources datées). | coût, reste, revenu nécessaire | argent | Recalcule. | Aucun calcul financier. |
| Pour quand ? <br>`reveAnnee` · choix | `reveAnnee` (année) | domaines contient argent | 2026 à 2080 | Épargne mensuelle requise, faisabilité. | requis mensuel, faisabilité | argent | Recalcule. | Aucun calcul de délai. |
| Qu’est-ce que tu sais déjà faire ? <br>`competences` · choix multiple | `competences` (—) | argent ou entreprise | liste | Activités livrables tout de suite ou à apprendre. | score compétences, ordre du classement | entreprise | Recalcule le classement. | Aucune recommandation : question posée d’abord. |
| Combien d’heures par semaine pour ton projet ? <br>`heuresProjet` · règle | `heuresProjet` (h/semaine) | argent ou entreprise | 0 à 100 | Activités possibles, revenu calculé, calendrier 30/60/90, budget de temps du sport. | score temps, projection, plan d’action | entreprise, programme, cohérence | Recalcule classement, scénarios et plan d’action. | Aucun plan d’action. |
| Un revenu mensuel que tu vises ? <br>`revenuVise` · montant (facultatif) | `revenuVise` (€/mois) | argent ou entreprise | ≥ 0 | Scénario d’hypothèse séparé ; repère du potentiel des activités. | scénario hypothèse, score potentiel | argent, entreprise | Recalcule. | Repère de 400 €/mois pour le score potentiel. |
| Dans quel pays veux-tu lancer ton activité ? <br>`pays` · choix | `pays` (—) | domaines contient entreprise | liste | Règles juridiques et fiscales applicables (France couverte). | statuts, cotisations | entreprise | Recalcule ou suspend le classement. | France supposée seulement si choisie. |
| Combien peux-tu investir pour démarrer ? <br>`capital` · montant | `capital` (€) | domaines contient entreprise | ≥ 0 | Activités finançables ou non, score budget. | filtre budget, score budget | entreprise | Recalcule le classement. | Aucune recommandation. |
| Quel matériel as-tu déjà ? <br>`materielPro` · choix multiple | `materielPro` (—) | domaines contient entreprise | liste | Matériel à acheter ajouté au budget de départ. | budget de départ | entreprise | Recalcule budgets et classement. | Aucune recommandation. |
| As-tu déjà travaillé pour quelqu’un ? <br>`experience` · choix | `experience` (—) | domaines contient entreprise | liste | Pénalise les activités difficiles pour un débutant. | score difficulté | entreprise | Recalcule le classement. | Considéré comme « aucune » (prudent), signalé. |
| Contacter des inconnus pour proposer ton offre ? <br>`aisanceVente` · choix | `aisanceVente` (1 à 3) | domaines contient entreprise | 1, 2, 3 | Pénalise les activités à fort démarchage. | score vente | entreprise | Recalcule le classement. | Valeur moyenne (2). |
| Quel risque acceptes-tu ? <br>`risque` · choix | `risque` (—) | domaines contient entreprise | faible, moyen, élevé | Adéquation risque de l’activité / tolérance. | score risque | entreprise | Recalcule le classement. | Moyen. |
| Plutôt en ligne ou près de chez toi ? <br>`formatPref` · choix | `formatPref` (—) | domaines contient entreprise | liste | Adéquation format. | score format | entreprise | Recalcule le classement. | Indifférent. |

## Effet mesuré de chaque réponse

Profil de test complet (3 modules). On change une seule réponse et on liste les sorties qui changent.

| Variable | Changement testé | Sorties modifiées |
|---|---|---|
| `domaines` | corps → corps + argent + entreprise | finances.capacite, finances.mois, finances.requis, finances.hypothese, coherence.ids, business.top, business.statuts, business.scores, business.plan, business.action |
| `age` | 25 → 16 | energie.bmr, energie.tdee, energie.plage, physique.kcal, physique.macros, programme.empreinte, coherence.ids, business.statuts |
| `tempsLibre` | 20 → 4 | programme.empreinte, programme.seances, coherence.ids |
| `sexe` | H → nr | energie.bmr, energie.tdee, energie.plage, physique.kcal, physique.macros |
| `taille` | 178 → 165 | energie.bmr, energie.tdee, energie.plage, physique.kcal, physique.semaines, physique.imc, physique.rtt, physique.macros |
| `poids` | 80 → 92 | energie.bmr, energie.tdee, energie.plage, physique.kcal, physique.statut, physique.semaines, physique.imc, physique.macros |
| `tour` | 85 → 100 | physique.rtt |
| `objectif` | perdre → maintenir | physique.kcal, physique.statut, physique.semaines, physique.macros, programme.empreinte, coherence.ids |
| `cible` | 74 → 60 | physique.statut, physique.semaines |
| `delaiSem` | 26 → 4 | physique.statut, coherence.ids |
| `rythme` | 0.3 → 0.6 | physique.kcal, physique.semaines, physique.macros |
| `activite` | assis → physique | energie.tdee, energie.plage, physique.kcal, physique.macros |
| `autreSport` | 0 → 4 | energie.tdee, energie.plage, physique.kcal, physique.macros, programme.empreinte, programme.seances, coherence.ids |
| `niveau` | debutant → avance | programme.empreinte |
| `jours` | 2 → 4 | energie.tdee, energie.plage, physique.kcal, physique.semaines, physique.macros, programme.empreinte, programme.seances |
| `minutes` | 30 → 75 | energie.tdee, energie.plage, physique.kcal, physique.macros, programme.empreinte |
| `lieu` | maison → salle | programme.empreinte |
| `materielSport` | aucun → halteres + banc | programme.empreinte |
| `prioriteSport` | forme → muscle | programme.empreinte |
| `contraintes` | aucune → douleur | programme.empreinte, coherence.ids |
| `zonesDouleur` | autre → genou | programme.empreinte |
| `regime` | omnivore → vegetalien | nutrition.aliments |
| `modeSimple` | — | Interface uniquement (vérifié dans le code) |
| `obstacle` | motivation → temps | physique.conseil, programme.empreinte, coherence.ids |
| `revenus` | 1800 → 1200 | finances.capacite, finances.mois, coherence.ids |
| `fixes` | 700 → 900 | finances.capacite, finances.mois |
| `variables` | 400 → 600 | finances.capacite, finances.mois |
| `remboursements` | 0 → 200 | finances.capacite, finances.mois |
| `epargne` | 2000 → 10000 | finances.mois, finances.requis |
| `reve` | vivre → appart | finances.mois, finances.requis, coherence.ids |
| `reveAnnee` | 2031 → 2045 | finances.requis |
| `competences` | code + design → video + photo | business.top, business.scores |
| `heuresProjet` | 8 → 3 | business.top, business.statuts, business.scores, business.plan, business.action |
| `revenuVise` | 3000 → 300 | finances.hypothese, coherence.ids, business.top, business.scores |
| `pays` | france → emirats | business.top, business.statuts, business.scores |
| `capital` | 0 → 600 | business.top, business.statuts, business.scores |
| `materielPro` | ordinateur → aucun | business.top, business.statuts, business.scores |
| `experience` | aucune → clients | business.scores |
| `aisanceVente` | 1 → 3 | business.scores |
| `risque` | faible → eleve | business.top, business.scores |
| `formatPref` | en_ligne → local | business.top, business.scores |

## Recalcul ciblé et historique

- Les résultats sont des fonctions pures des réponses : changer une réponse ne recalcule en pratique que les sorties qui en dépendent (tableau ci-dessus) ; les autres restent identiques (test B).
- Chaque modification du profil archive la version précédente dans la collection `historique` (raison : modification, questionnaire, import). Rien n’est effacé.
- Les tâches du plan d’action gardent leur historique (`taches.historique`) ; les ventes réelles restent enregistrées et remplacent les prévisions des mois concernés.

## Questions complémentaires

`CapMatrice.questionsManquantes(profil)` liste, pour les modules choisis, les réponses indispensables absentes avec leur justification. Une IA pourra en proposer d’autres : `CapContrats.validerQuestionsIA` n’accepte que 3 questions au plus, liées à une variable du registre et justifiées.
