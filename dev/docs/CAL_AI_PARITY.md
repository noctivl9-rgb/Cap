# CAL_AI_PARITY — matrice d'équivalence

État au 09/11/2026. Statuts : absent · partiel · implémenté · testé · bloqué.
« Testé » = vérifié par un test automatisé exécuté (voir TEST_REPORT.md), sur navigateur Chromium à taille iPhone, pas sur un iPhone réel.

## Sources réellement consultées
- Ta capture vidéo de l'onboarding Cal AI (69 s, 36 images extraites et analysées).
- ScreensDesign : pages « onboarding » (8 premiers écrans), « showcase » et liste des parcours (chapitres 1-28).
- Non consultables depuis cette session (refusés par le filtre réseau) : calai.app, App Store, Lazyweb, UILand. Les 45 captures d'onboarding et les centaines d'écrans de ces archives n'ont donc **pas** été étudiés.
- Aucune hypothèse sur les algorithmes internes de Cal AI : nos formules sont documentées dans CALCULATION_RULES.md.

| Fonctionnalité | Comportement observé (référence) | Confiance | Notre état | Différence / choix | Fichiers | Tests | Statut |
|---|---|---|---|---|---|---|---|
| Onboarding question par question | Barre de progression, retour, bouton noir en bas, options en cartes (vidéo) | Haute | Questionnaire adaptatif 3 modules, progression = vraies étapes, reprise (brouillon local) | Pas d'écrans commerciaux (source, avis, parrainage, ATT) | app.js | ui3 | testé |
| Sexe, fréquence sportive, âge | Cartes + roue de date (vidéo) | Haute | Règle à saisie directe pour l'âge (la roue v1 enregistrait une valeur non choisie) | Âge, pas date de naissance | app.js | ui, ui3 | testé |
| Blocage des moins de 18 ans | « You must be at least 18 » (vidéo) | Haute | Accepté dès 13 ans avec règles mineurs | Choix volontaire : plafonds de rythme et de déficit, plancher calorique | engine.js | tests.js | testé |
| Taille / poids, kg ↔ lb | Bascule Imperial/Metric + sélecteurs (ScreensDesign, vidéo) | Haute | Règle avec valeur en direct, inertie, aimantation, +/−, saisie, kg/lb | Taille en cm uniquement | app.js | ui3 | partiel (pas de pieds/pouces) |
| Objectif, poids cible, vitesse | Curseur lent/recommandé/rapide avec délai estimé (vidéo) | Haute | Délai demandé → écran de faisabilité → choix de rythme parmi les rythmes sûrs | Objectifs dangereux bloqués, renvoi médical | app.js, engine.js | tests.js, ui3 | testé |
| Obstacles, motivations | Écrans de quiz (vidéo) | Haute | Obstacle facultatif ; motivations supprimées (sans conséquence) | | app.js | — | implémenté |
| Expérience de suivi | « As-tu essayé d'autres applis ? » (vidéo) | Haute | Reformulé : décide du mode simple de l'accueil | La question a maintenant un effet | app.js | ui3 | testé |
| Préférences alimentaires | Mentionné dans le brief | Moyenne | Régime (halal, végétarien…) filtre la base d'aliments | Halal = sans porc, abattage non vérifiable | foods.js | ui3 | testé |
| Connexion Santé, notifications | Écrans d'autorisation (vidéo) | Haute | Non disponible | Une page web dans Claude n'a accès ni à Apple Santé ni aux notifications | — | — | bloqué |
| Aperçu du plan avant compte | Plan affiché avant inscription (vidéo) | Haute | Plan calculé, modifiable (objectifs perso avec garde-fous) avant enregistrement | Pas d'animation de calcul factice | app.js | ui3 | testé |
| Scan photo IA | Photo → aliments → corrections (ScreensDesign) | Haute | Photo → Claude identifie et estime → moteur recalcule → correction des grammes, cuisson, remplacement, ajout, suppression | Valeurs de la base prioritaires ; incertitude affichée | ai.js, journal.js, engine.js | tests.js, ui3 (IA simulée) | partiel (testé avec IA simulée, pas avec Claude réel) |
| Scan code-barres, étiquette | Modes caméra dédiés (ScreensDesign) | Haute | Absent | Pas de caméra en direct ni d'accès à Open Food Facts depuis la page | — | — | bloqué |
| Saisie vocale | (ScreensDesign) | Haute | Absent | Micro refusé dans la page | — | — | bloqué |
| Recherche d'aliments | Base + « mes aliments » (ScreensDesign) | Haute | 110 aliments de base, recherche sans accents, récents, favoris | Base locale limitée | foods.js, journal.js | ui3 | testé |
| Aliments perso, recettes, favoris | Custom meal, personal list (ScreensDesign) | Haute | Création, modification, suppression | | journal.js | ui3 | testé |
| Journal par repas | — | Moyenne | Petit-déj, midi, collation, soir ; modifier, dupliquer, supprimer | | journal.js | ui3 | testé |
| Historique, calendrier | Bande de dates en haut de l'accueil (ScreensDesign) | Haute | Bande 7 jours + calendrier mensuel, jours vides distingués | | journal.js | ui3 | testé |
| Eau | Suivi de l'eau (ScreensDesign) | Haute | ±250 ml, objectif 30 ml/kg | | journal.js, engine.js | tests.js, ui3 | testé |
| Exercice, calories ajoutées | « Exercise calories can be added to the daily goal » | Haute | Activités par MET ; option : +50 % des activités hors programme | Garde-fou anti double comptage | engine.js, journal.js | tests.js, ui3 | testé |
| Report des calories | (brief) | Moyenne | Option, 200 kcal max, seulement si la veille est notée | | engine.js | tests.js | testé |
| Accueil : calories, macros, anneaux | Calories restantes, cartes macros, anneaux (ScreensDesign) | Haute | Implémenté, synchronisé au journal | Pas de fibres/sodium (base sans ces données) | journal.js | ui3 | testé |
| Score santé, badges | Health score, badges (ScreensDesign) | Haute | Remplacés par série et jalons mesurés | Pas de score inventé | engine.js | tests.js | implémenté |
| Progrès : poids, IMC, photos | Weight logs, progress photos, charts, BMI | Haute | Courbe réel vs projection (1 mois/3 mois/tout), IMC adapté aux mineurs, photos privées | | journal.js | ui3 | testé (photos avec stockage simulé) |
| Bilan hebdo | — | — | Moyenne sur jours notés uniquement | | engine.js | tests.js | testé |
| Coach IA | — | — | Claude, contexte limité aux données partagées, règles anti-chiffres inventés | | ai.js, journal.js | ui3 (IA simulée) | partiel |
| Réglages, profil, objectifs | Edit profile, settings (ScreensDesign) | Haute | Style Réglages iOS, chaque réponse modifiable, recalcul immédiat | | app.js, journal.js | ui, ui3 | testé |
| Mode sombre | Light/dark (ScreensDesign) | Haute | Thème clair uniquement | Ta directive : interface blanche | index.html | — | absent (choix) |
| Widgets, rapport PDF, groupes, parrainage, paywall | (ScreensDesign) | Haute | Absent | Hors périmètre d'une appli privée | — | — | absent (choix) |
| Module finances | Sans équivalent chez Cal AI | — | Capacité, coût réel des projets, 3 niveaux, faisabilité | | engine.js, app.js | tests.js, ui | testé |
