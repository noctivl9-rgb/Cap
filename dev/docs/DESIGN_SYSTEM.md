# DESIGN_SYSTEM

Source : `index.html` (tokens CSS). Thème clair uniquement, à ta demande.

- **Couleurs** : fond #F5F5F7, surfaces #FFFFFF, texte #1D1D1F / #424245 / #6E6E73. Accent interactif #0066CC. Corps #E8553A, argent #1F8A5B, alertes orange/rouge. Contrastes ≥ 4,5:1 pour le texte.
- **Typographie** : police système (SF Pro sur iPhone). Échelle 34 / 28 / 22 / 20 / 17 / 16 / 15 / 13 / 12 px, chiffres tabulaires.
- **Espacements** : 4, 8, 12, 16, 20, 24, 32 px ; gouttière latérale ≥ 16 px et zones de sécurité iOS.
- **Rayons** : 10 / 14 / 20 / 28 px, 999 pour les capsules.
- **Ombres** : 0 1px 2px + 0 6px 20px, opacité 4 %.
- **Verre** (barre d'onglets, bouton +, panneaux, sélecteurs, boutons ronds) : blanc 58 %, flou 22 px, saturation 185 %, liseré 0,5 px, reflet intérieur. Version opaque si le navigateur ne gère pas le flou. Les contenus restent sur surfaces pleines.
- **Composants** : cartes de choix avec coche animée, règle horizontale, saisie monétaire, cellules type Réglages, interrupteurs iOS, segmentés, anneaux, puces de statut, alertes à liseré, panneaux.
- **Mouvement** : 160 et 240 ms, courbe (0,2 ; 0,8 ; 0,2 ; 1) ; ressort (0,34 ; 1,4 ; 0,64 ; 1) pour la pastille d'onglet et les interrupteurs. Transitions directionnelles du questionnaire. Règle à inertie avec aimantation. Tout est coupé si « Réduire les animations » est activé.
- **Interdits** : dégradés violets, néons, emojis décoratifs, verre sur les contenus.

## Direction artistique (v4, 10/11/2026)
- **Signature** : le « C » est le cadre, le point corail est ton cap. Sur l'accueil, le point orbite le long de l'arc, rejoint le centre et s'y stabilise par oscillations amorties. C'est la seule chorégraphie automatique de l'appli.
- **Accueil** : mise en page alignée à gauche (marque, lentille de verre, titre « Garde le cap. », trois piliers sans cartes, bouton Sparkle). Une seule pièce forte : la lentille.
- **Matière de la lentille** (principes repris de ReactDrops, pas leur code) : reflet spéculaire, paroi intérieure, face arrière ombrée, léger frange chromatique rouge/bleu au bord, caustique corail projetée dessous, goutte qui ondule puis s'amortit au toucher.

## Langage de mouvement
| Jeton | Valeur | Usage |
|---|---|---|
| --m-tap | 120 ms | pression d'un bouton |
| --m-state | 220 ms | changement d'état (sélection, interrupteur) |
| --m-panel | 380 ms | panneaux (entrée douce, sortie 220 ms) |
| --m-reveal | 600 ms | apparition d'un élément important |
| --m-spring | (0,34 ; 1,4 ; 0,64 ; 1) | contrôles : interrupteurs, pastille d'onglet, boutons ronds |
| Chiffres | 480 ms, sortie cubique | depuis la dernière valeur réelle |
Aucune animation permanente hors bouton Sparkle actif. Tout est coupé avec « Réduire les animations ».

## Sons (sound.js)
Synthétisés en direct (Web Audio), aucun fichier tiers. Gamme de mi majeur, sinus doux, crête ≤ 0,05.
| Son | Moment | Durée |
|---|---|---|
| étape | changement de partie du questionnaire, toucher du logo | 0,07 s |
| valider | plan enregistré, pesée, repas scanné | 0,22 s |
| objectif | jalon de poids atteint, objectif d'eau atteint | 0,40 s |
| ouverture | « Commencer mon parcours », « Découvrir mon analyse » | 0,31 s |
Désactivés par défaut (Réglages › Préférences). Jamais au lancement. Sur iPhone, `audioSession.type = 'ambient'` respecte le mode silencieux (Safari 16.4+). Vibrations seulement là où le navigateur les permet (pas sur iPhone).

## Outils évalués
- Motion, GSAP, React Spring, Rive, Lottie : non installés. Cap n'utilise pas React, et l'API Web Animations native couvre les besoins sans dépendance.
- ReactDrops : étudié (licence « ReactDrops Component 1.0 », usage permis dans une appli). Non intégré : composants React + WebGL de plusieurs milliers de lignes, trop lourds pour l'iPhone ici.
- Tone.js, Freesound, BBC : non utilisés, les sons sont synthétisés.
