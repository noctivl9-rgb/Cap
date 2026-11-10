# Cap — système de design (refonte du 10/11/2026)

Remplace les versions précédentes (lentille de verre, piliers de l'accueil, onglets en verre), qui sont abandonnées.

## Fichiers
Ordre de chargement : `css/font.css` (Archivo Cap embarquée, licence OFL), `tokens.css`, `base.css`, `components.css`, `screens.css`, `theme.css`, puis `refonte.css`.
- `refonte.css` porte la nouvelle composition des écrans. Il est chargé en dernier et l'emporte sur les anciennes règles.
- Aucun style n'est défini dans `index.html`.

## Couleurs (rôles, jamais décoratives)
| Jeton | Valeur | Rôle |
|---|---|---|
| `--obsidienne` | #0C0C0D | La pièce forte unique de l'écran : priorité du jour, séance du jour, décision d'argent, prochaine tâche |
| `--graphite` | #2A2A2D | Dégradé de l'obsidienne |
| `--blanc-casse` | #F4F3F0 | Fond de toutes les vues |
| `--argent-min` | #A7ABB1 | Libellés sur obsidienne, repère du module Projet |
| `--corps` / `--corps-texte` | #E8553A / #B23A20 | Corps, énergie et actions physiques (séance, ajouter un repas). La teinte foncée sert au texte (contraste AA). |
| `--argent` / `--argent-texte` | #1F8A5B / #146B45 | Faits financiers positifs et réels uniquement |
| rouge #C4111B | — | Erreurs, déficits réels et suppressions |
| ambre #7A4500 sur fond ambré | — | À vérifier, limites appliquées |

Le sens d'une couleur est toujours aussi porté par un libellé (« Réel », « Projection », « Limites appliquées »…). La couleur seule ne porte jamais l'information.

## Typographie
- **Titres d'écran** : Archivo, élargie (largeur 112 à 118 %), graisse 740 à 780, interlettrage négatif.
- **Chiffres clés** (poids, reste du jour, épargne réelle, séries × répétitions) : 44 à 84 px, chiffres tabulaires.
- **Texte courant** : 15 à 17 px, interligne 1,45, 46 caractères maximum pour les messages.
- **Titres de section** : des libellés humains (« Ta semaine », « Avec quoi tu pars », « Où tu en es »), jamais « Statistiques » ni « Informations ».

## Composition
- Une seule surface surélevée par écran : la pièce d'obsidienne.
- Le reste est posé sur le fond, séparé par des filets de 0,5 px et de l'espace. Plus aucune pile de cartes identiques.
- Détails, historiques et calculs vont dans des `<details>` repliés : Comment est-ce calculé, Historique, Budget mensuel, Chiffres de l'activité, etc.
- **Navigation** : barre posée, sans verre. Cinq destinations au plus, dont l'action centrale ＋ en obsidienne.
- **Sélecteurs** : segmenté plein pour les modules ; soulignement aux couleurs du module pour les sous-vues.

## Étiquettes d'origine (`.tag`)
| Étiquette | Classe | Usage |
|---|---|---|
| Mesuré / Observé / Réel | `mesure` | Valeur saisie par toi |
| Calculé par Cap / Calcul / Projection | `calc` | Valeur produite par les règles déterministes |
| Estimé par l'IA | `estime` | Proposition IA non vérifiée |
| Corrigé par toi | `corrige` | Valeur IA que tu as modifiée |
| Hypothèse | `hypo` | Valeur non acquise, contour seul |
| IA / IA validée par Cap | `ia` | Contenu généré, puis contrôlé par les règles |

## Composants
- **Priorité** : `.td-prio`, `.pg-hero`, `.ag-decision`, `.pj-hero`.
- **Lignes d'action** : `.td-ligne`.
- **Faits** : `.pr-ligne`, `.pr-jalon`, listes `dl`.
- **Jauges** : `.jr-jauge`, `.jr-barre`.
- **Sélecteur accessible** : `segments()`, avec rôles `tablist`/`tab` et flèches du clavier.
- **Feuilles modales** : `sheet()`.
- **Séance plein écran** : `seance.js`, rôle `dialog`, focus gardé, Échap pour quitter.
- **Alertes** : `.ag-alerte`, `.pg-lim`, `issueView`.
- **États vides** : `.vide`, une phrase calme puis une seule action.
- **Consentement** : feuille photos, case du scan, lignes `.pf-cons`.
- **Comparateur de photos** : `.ph-comp` et un curseur `input[type=range]` nommé, utilisable au clavier sans geste complexe.
- **Confirmation destructive** : bloc `.ph-conf` révélé, puis bouton `.btn.danger`.

## Mouvement
- Durées : 120 ms au toucher, 220 ms pour un changement d'état, 320 à 380 ms pour un panneau, 600 ms pour une révélation.
- Seules chorégraphies automatiques : l'intro (au plus une fois toutes les 12 h) et la révélation du programme.
- Rien ne tourne en continu. Le minuteur de repos ne démarre que si l'utilisateur le lance.
- **Coupures** : `prefers-reduced-motion` ou le réglage interne Profil › Préférences › Réduire les animations (classe `html.anim-reduites`) coupent tout.

## Accessibilité (vérifiée par `dev/tests/refonte.js` et `dev/tests/axe.js`)
- Contraste AA. axe-core 4.10 : 0 violation WCAG 2.1 A/AA sur les 8 écrans principaux.
- Zones tactiles d'au moins 44 px. Chaque contrôle a un nom accessible. Un seul `h1` par écran. Navigation au clavier.
- Le focus revient à la page après la séance guidée. Les erreurs ont `role="alert"`. Les graphiques ont un résumé textuel.

## Sécurité de l'affichage
- **`innerHTML`** n'est utilisé que pour du SVG construit par Cap : logo, icônes, courbes à partir de nombres et de dates formatées. Aucune saisie de l'utilisateur n'y passe.
- **CSP de la version GitHub Pages** : `default-src 'self'`, scripts du seul domaine, `connect-src` limité à Supabase, `object-src 'none'`.
- **Version Claude** : la CSP est imposée par Claude.
