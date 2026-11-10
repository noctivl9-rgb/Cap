# Refonte UX/UI — moins de lecture, plus de visuels utiles

Branche `ux-2027`. Mesure : `node dev/tests/densite.js` (mots visibles par écran, hors `<details>` fermés et hors texte réservé aux lecteurs d'écran ; profil complet Corps + Argent + Projet, iPhone 14).

| Écran | Mots avant | Mots après | Hauteur (écrans) avant → après |
|---|---|---|---|
| Aujourd'hui | 94 | 62 | 1,6 → 1,6 |
| Programme | 264 | 100 | 3,1 → 2,0 |
| Journal | 107 | 95 | 2,0 → 2,0 |
| Évolution | 125 | 81 | 2,2 → 2,1 |
| Photos | 65 | 44 | 1,0 → 1,0 |
| Finances | 276 | 139 | 4,1 → 3,0 |
| Business | 294 | 129 | 3,6 → 2,6 |
| Profil | 393 | 164 | 4,7 → 3,2 |
| **Total** | **1 618** | **814** | |

Limite de la mesure : la mesure « avant » ne retirait pas le texte masqué pour les lecteurs d'écran (il y en avait très peu). L'écart réel est donc légèrement inférieur à 50 %.

## Kit visuel (`kit.js`, `css/kit.css`)
Anneau de progression, tuile cliquable, courbe miniature, donut, barres, bouton ⓘ (détail dans une feuille). Chaque composant reçoit des valeurs réelles ; sans donnée, il affiche « – » ou un état vide, jamais un chiffre inventé. Le SVG est construit à partir de nombres uniquement.

## Par écran
- **Aujourd'hui** : 4 anneaux du jour (calories restantes, protéines, eau, séance), une priorité et une seule action principale, première phrase visible et explication complète derrière ⓘ, tuiles Poids (courbe), Épargne (jauge), Business.
- **Programme** : puces durée/exercices/objectif, bande des 7 jours cliquable, tuiles Régularité et Origine, fiches repliées.
- **Journal** : anneau des calories et barres de macros.
- **Évolution** : tuiles Tendance et Objectif (progression réelle depuis la première pesée), lecture de Cap en pastille, courbe avec légende et ⓘ.
- **Photos** : état vide en 3 puces.
- **Finances** : anneau d'épargne vers l'étape en cours, tuiles Capacité (détail du budget au toucher) et Projet, donut des dépenses du mois sur les opérations saisies, légende de projection, hypothèse sur une ligne.
- **Business** : contraintes en puces modifiables d'un toucher, options avec anneau de score et deux chiffres (départ, 6e mois), détails repliés.
- **Profil** : état en 4 tuiles (détail au toucher), consentements en une ligne chacun, explications longues derrière ⓘ, Nutrition repliée comme les autres groupes.
- **Coach** : réponse en 2-3 phrases puis 1 à 3 actions en liste ; bouton « Approfondir » pour la version détaillée. Le texte reste inséré par `textContent`.

## Comportements ajoutés
- Les sections ouvertes restent ouvertes quand l'écran se redessine (par exemple après un interrupteur).
- Zones tactiles ≥ 44 px, contrastes AA (axe : 0 violation sur 8 écrans).

## Ce qui n'a pas changé
Calculs, données, consentements, sécurité, textes d'honnêteté (« Ce n'est pas une promesse », origine des chiffres) : conservés, visibles ou dans les fiches.

## Passe « moins d'IA, plus simple » (10 novembre, soir)
Choix d'Elias : garder toutes les fonctions, retirer les mentions IA répétées ; moins d'étiquettes, de sections et de réglages.
- Quand l'IA n'est pas disponible : aucun bandeau IA, aucun bouton IA, aucune ligne de consentement IA ni tuile IA dans Profil. Les accords du coach restent réglables dans le coach. Quand l'IA est disponible (appli Claude), tout réapparaît.
- Étiquettes Réel / Mesuré / Calcul / Prévision / Projection / Hypothèse / Lecture de Cap retirées des écrans principaux : la formulation porte l'information (« Pesée du… », « Prévu au 6e mois », « Si tu gagnais… », « Projection sur 24 mois »). Elles restent dans les fiches de détail.
- « Comment est-ce calculé ? » devient un bouton ⓘ.
- Sections secondaires regroupées sous une seule ligne « Plus de détails » (Programme, Évolution, Finances, Business) ; « À vérifier » reste visible. Profil : préférences, sources, refaire/effacer sous « Plus de réglages » ; la sauvegarde reste visible.
- Mots visibles : 814 → 621 (départ : 1 618). La mesure ignore désormais aussi le contenu des sections repliées imbriquées.
