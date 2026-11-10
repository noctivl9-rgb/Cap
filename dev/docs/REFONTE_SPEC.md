# Cap — Refonte totale : cartographie et spécification (10/11/2026)

## 1. Cartographie de l'existant (avant refonte)

### Écrans
| Écran (onglet) | Fichier | Contenu | Problème principal |
|---|---|---|---|
| Accueil (`today`) | journal.js `viewAccueil` | Boussole, bande 7 jours, calories, 3 macros, eau + activité, repas, actions, « À vérifier » | Mélange tableau de bord et journal ; 8 blocs empilés |
| Progrès (`corps`) | journal.js `viewProgres` | 3 niveaux, 3 stats, courbe, barres 7 j, jalons, tour de taille, plan, étapes, photos, pesées | 11 sections ; photos noyées ; analyse et saisie mêlées |
| Programme (`prog`) | app.js `viewProg` | 3 stats, note d'origine, panneau IA, « pourquoi », semaine en accordéons, progression, historique | La séance du jour n'est pas la priorité ; pas de mode « pendant l'effort » |
| Argent (`argent`) | app.js `viewArgent` | 3 niveaux, 3 stats, puce, graphique, budget, coût du rêve, âge, à vérifier, mouvements | Réel / projection / hypothèse mélangés dans la même pile |
| Projet (`projet`) | projet.js `view` | Note, panneau IA, top 3 en cartes, méthode, écartées, plan, tâches, ventes | Cartes identiques ; l'activité active et la prochaine tâche ne ressortent pas |
| Réglages (`reglages`) | app.js `viewReglages` | Listes de réponses par module, nutrition, coach, sons, sources, compléments IA, données | Pas de centre de confiance : consentements, photos, synchro dispersés |
| Questionnaire | app.js `STEPS`, `renderStep` | 41+ étapes, bilan, révélation, plan | Correct ; à regrouper visuellement par décision (lot ultérieur) |
| Feuilles | app.js `sheet` | Pesée, séance, mouvement, aliments, scan, activité, calendrier, coach, objectifs | Scan sans consentement explicite ; estimé et confirmé peu distingués |

La barre basse peut afficher jusqu'à 6 onglets (classe `dense`, texte compressé à 70 %).

### Données (collections, inchangées sauf `photos`)
profil, pesees, repas (journaux), epargne, seances, actions, prefs, aliments, recettes, photos, historique, taches, ventes, programmes, opportunites.
`photos` : `{ date, assetId, url }` (stockage assets Claude seulement ; indisponible en mode sans compte).

### Fonctions à préserver (liste de contrôle)
Moteurs (engine, training, business, matrice), validations (contrats, validerPlanIndividuel), âge/douleur/matériel/temps/récupération, historique de profil, import/export/sauvegarde auto/restauration (donnees.js), mode local, synchro Supabase + RLS (cloud.js, sync.js, supabase/), quotas et consentements IA (coachCorps, coachArgent), programmes IA versionnés (accepter/refuser), scan repas, photos, sons désactivés par défaut, Réduire les animations.

## 2. Nouvelle architecture d'information

Cinq destinations au maximum dans la barre basse :

| # | Destination | Rôle | Visible si |
|---|---|---|---|
| 1 | **Aujourd'hui** | Ce qui compte maintenant : une priorité, une action, l'état mesuré de chaque module | toujours |
| 2 | **Parcours** | Corps · Argent · Projet en sélecteur ; chaque module a ses sous-vues | ≥ 1 module |
| 3 | **＋ (action centrale)** | Feuille contextuelle : repas, scan, eau, activité, pesée, photo, mouvement, vente | toujours |
| 4 | **Journal** | Le jour : repas, eau, activité ; navigation dans les jours | module Corps |
| 5 | **Profil** | Réponses, préférences, IA et consentements, photos et stockage, données, compte | toujours |

### Carte de navigation détaillée
| Destination | Objectif utilisateur | Contenu principal | Action principale | Contenus secondaires | Accès aux détails | Module désactivé |
|---|---|---|---|---|---|---|
| Aujourd'hui | Savoir quoi faire maintenant | Une priorité (règles fixes) | Le bouton de la priorité | « Ensuite » (3 max), état mesuré par module | Points à vérifier repliés | La ligne du module disparaît ; ses priorités ne sont jamais proposées |
| Parcours › Corps › Séance | Faire la séance du jour | Séance du jour ou prochaine | Commencer la séance (mode guidé) | Semaine, régularité mesurée, limites appliquées, origine | Pourquoi, progression prévue, historique repliés | Onglet Corps absent du sélecteur |
| Parcours › Corps › Progression | Comprendre l'évolution | Dernière mesure + nombre de mesures + depuis quand | Nouvelle pesée | Tendance mesurée, lecture de Cap, objectif, courbe | Calories 7 j, jalons, tour de taille, plan, pesées | — |
| Parcours › Corps › Photos | Voir l'évolution visuelle | Chronologie par mois | Ajouter une photo | Filtre d'angle, comparer deux dates | Détail : télécharger, supprimer | — |
| Parcours › Argent | Prendre la bonne décision | Décision de la semaine | C'est fait | Réel, Projection, Hypothèse | Budget, coût du projet, âge, à vérifier, historique | Onglet Argent absent ; ＋ ne propose plus « Épargne » |
| Parcours › Projet | Avancer vers une première vente | Sans choix : les 3 options. Avec choix : prochaine tâche | Choisir / Marquer comme faite | Contraintes, première vente, plan 30/60/90 | Chiffres (avec statut), ventes, légalité, risques, classement, écartées | Onglet Projet absent ; ＋ ne propose plus « Vente » |
| ＋ | Ajouter vite | Tuiles des ajouts possibles | La tuile choisie | — | — | Seules les tuiles des modules actifs |
| Journal | Noter et relire la journée | Reste du jour + protéines | Ajouter un repas | Repas par créneau, eau, activité, jours | Comment est-ce calculé, calendrier | Absent sans module Corps (4 destinations) |
| Profil | Contrôler ses données et sa vie privée | État + consentements | Dépend de la ligne | Réponses par module, nutrition, préférences, données | Sources et limites repliées | Les groupes du module disparaissent |

États transverses :
- **Chargement** : texte explicite avec le temps écoulé réel, jamais de spinner infini.
- **Erreur** : message précis et solution (réessayer, saisir à la main).
- **Hors ligne** : tout fonctionne sauf l'IA ; c'est indiqué dans Profil › État et dans le scan.
- **IA indisponible** : une ligne étiquetée « IA », sans boutons désactivés.

Sous-vues de Parcours :
- Corps : **Séance** (programme, séance du jour en premier) · **Progression** (mesures) · **Photos** (progression visuelle).
- Argent : une seule vue en trois couches Réel / Projection / Hypothèse ; budget et coût en détail repliable.
- Projet : activité active → prochaine tâche → première vente → plan ; le classement et les écartées en second niveau.

Le module actif de Parcours et sa sous-vue sont mémorisés (préférence locale). L'onglet `projet` / `prog` / `corps` / `argent` des anciennes versions est redirigé vers Parcours.

## 3. Spécification par écran

### Aujourd'hui
- Objectif : répondre « qu'est-ce qui compte aujourd'hui ? »
- Priorité (une seule, choisie par règles dans cet ordre) : alerte bloquante (réponse à revoir, déficit budgétaire) → séance prévue non faite → pesée de la semaine manquante → action argent de la semaine → prochaine tâche projet → noter un repas.
- Action primaire : le bouton de cette priorité.
- Secondaire : une ligne par module avec un fait mesuré (dernier poids et sa date, épargne réelle cumulée, ventes réelles), jamais de score global. Sans mesure : « Pas encore mesuré » + comment commencer.
- Erreurs : « À vérifier » en bas, repliable.
- Vide : premier jour → « Ton premier pas » avec l'action la plus simple.
- A11y : priorité en `h2`, actions en vrais boutons, ordre de lecture = ordre visuel.

### Journal
- Objectif : noter et relire une journée en un regard.
- Priorité : le reste de calories et l'équilibre du jour (protéines d'abord).
- Action primaire : « Ajouter un repas » ; secondaires : eau (+250 ml), activité, mesure.
- Secondaire : repas par créneau, macros détaillées, calendrier, report et bonus expliqués dans « Comment est-ce calculé ? ».
- Vide : « Rien de noté. Cap n'estime rien à ta place. »

### Corps › Séance
- Priorité : la séance du jour ou la prochaine, avec bouton « Commencer la séance ».
- Mode séance (plein écran) : un exercice à la fois, séries × répétitions, repos (minuteur à lancer soi-même), alternative, raison ; « Exercice suivant » ; fin → ressenti → enregistrement.
- Secondaire : semaine, origine du programme (règles ou IA validée, avec informations utilisées et accord), progression, historique.
- Douleurs et contraintes de santé : bloc « Limites appliquées » distinct des conseils.

### Corps › Progression
- Priorité : poids mesuré + tendance mesurée + position par rapport au plan.
- Action : « Nouvelle pesée » (feuille calme : une valeur, conseil d'heure, pas de commentaire sur le chiffre).
- Secondaire : courbe (mesuré / projection), calories 7 jours, jalons, tour de taille, détail du plan, liste des pesées.

### Corps › Photos (Progression visuelle) — nouveau
- Privé, facultatif, complément des mesures. Aucune analyse automatique, aucune retouche.
- Consentement à la première utilisation : où la photo est stockée, qui la voit (toi seul), rien n'est envoyé à une IA, suppression définitive possible.
- Ajout : appareil photo ou galerie → catégorie (Face, Profil, Dos, Libre) → date → note facultative → mesure facultative (poids réel du jour proposé s'il existe).
- Chronologie par mois ; filtre par catégorie ; comparaison de deux dates (sélection puis glissière avant/après).
- Export : chaque photo téléchargeable ; suppression définitive (fichier + métadonnées).
- Stockage : assets Claude dans l'appli Claude ; IndexedDB de l'appareil en mode sans compte (jamais synchronisé, dit clairement).
- Vide : « Observer une évolution prend des semaines. Une photo par mois suffit. »
- Migration : anciennes photos `{date, assetId, url}` → `categorie: 'libre'`, `v: 2`, sans perte.

### Scan de plats
1. Explication avant envoi : ce qui est analysé (aliments visibles, quantités estimées), ce qui ne l'est pas (huile, sauces cachées, poids exact), où va la photo.
2. Consentement explicite mémorisé (`prefs.consentScan`), révocable dans Profil ; refus → recherche manuelle.
3. Aperçu → analyse (temps écoulé réel, bouton Arrêter) → révision : chaque aliment marqué **Estimé** ou **Corrigé par toi** ; totaux recalculés par le moteur Cap à chaque modification ; rien n'est enregistré sans « Enregistrer le repas ».
4. Cas : photo illisible, aucun aliment, IA indisponible, hors connexion, refus → message précis + saisie manuelle.

### Argent
- Priorité : la prochaine décision réaliste (action de la semaine).
- Trois couches nommées : **Réel** (épargne mesurée, mouvements), **Projection** (au rythme de la capacité actuelle, sans rendement), **Hypothèse** (revenu visé, facultatif).
- Alertes déficit / dette / objectif non soutenable en tête, factuelles.
- Détail (budget, coût du projet ligne à ligne, âge) en second niveau.

### Projet
- Priorité : activité choisie → prochaine tâche à impact (dépendances satisfaites) → première vente réelle.
- Sans activité choisie : les trois options, une décision : « Choisir ».
- Étiquettes systématiques : Observé, Hypothèse, Prévision, Calcul, IA.
- Contraintes (temps, compétences, capital, âge, légalité) visibles dans un bloc dédié.

### Profil
Groupes : Mes réponses (par module) · Nutrition · IA et consentements (corps, argent, projet, scan photo) · Photos et stockage · Préférences (unités, sons, animations) · Données (export, import, sauvegardes, restauration, questionnaire, effacement) · État (stockage, IA, synchronisation) · Sources et méthode.

## 4. Design system
- Fichiers : `css/tokens.css`, `css/base.css`, `css/components.css`, `css/screens.css`, `css/font.css` (police embarquée).
- Couleurs : obsidienne `#0C0C0D`, graphite `#2A2A2D`, blanc cassé `#F4F3F0`, argent minéral `#A7ABB1` ; corail `#E8553A` = corps / énergie / action ; vert `#1F8A5B` = faits financiers positifs réels ; ambre = à vérifier ; rouge = erreur.
- Surfaces : fond blanc cassé, contenu posé sans panneau quand c'est possible ; une seule pièce d'obsidienne par écran (la priorité).
- Composants : titre d'écran, en-tête de section, ligne de donnée, priorité, action primaire / secondaire / texte, sélecteur segmenté, feuille, alerte (info, à vérifier, bloquant), état vide, chargement, étiquette d'origine (Mesuré, Calculé, Estimé, Hypothèse, IA).
- Sécurité : CSP dans la version GitHub ; aucune donnée utilisateur dans `innerHTML` (contrôle automatique dans les tests).
