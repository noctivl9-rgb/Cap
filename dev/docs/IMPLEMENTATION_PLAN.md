# IMPLEMENTATION_PLAN

## Plateforme
Application web à page unique publiée dans Claude (artifact privé). Pas de projet iOS natif : les API SwiftUI (Liquid Glass natif, HealthKit, notifications, caméra en direct) ne sont pas accessibles. Données stockées dans la base privée de l'artifact (`db`), photos dans son stockage (`assets`), IA via Claude sur ton compte (`sample`, images autorisées).

## Modules (fichier → rôle)
| Module demandé | Fichier / section |
|---|---|
| UI Design System, Motion System | index.html (tokens CSS, matériau verre, courbes et durées d'animation) |
| Navigation | app.js › renderMain (barre d'onglets flottante), sheet() |
| Onboarding Engine | app.js › STEPS, startOnboarding, renderStep, bilan, planApercu |
| Profile Store, Persistence Layer | app.js › put/remove/saveProfil/savePrefs, abonnements onSnapshot |
| Nutrition Calculation Engine | engine.js › physique, cibleJour, budgetJour, objectifEau, kcalActivite |
| Goal Feasibility Engine | engine.js › physique (statuts), coherence |
| Food Recognition Service | ai.js › preparer, analyserRepas ; engine.js › validerScan |
| Nutrition Database | foods.js |
| Food Diary | journal.js › journal, saveJournal, recherche, détail, recettes |
| Health Tracking | journal.js › viewProgres ; engine.js › tendance, serie, jalons, bilanSemaine |
| Financial Engine | engine.js › finances, coutReve |
| Personal Plan Engine | engine.js › programme, adaptation, niveaux de finances ; journal.js › niveaux corps |
| AI Assistant | ai.js › coach ; journal.js › J.coach, contexteCoach |

## Migration des données
- Profil v1 (sans `v`) : réponses pré-remplies, questionnaire relancé, âge redemandé.
- Journal v2 (`g` = glucides, `l` = lipides) : relu par `normEntree`, réécrit au format v3 à la première modification du jour.

## Phases réalisées
1. Recherche (sources limitées, voir CAL_AI_PARITY.md). 2. Moteur nutrition + tests. 3. Base d'aliments, service IA. 4. Onboarding : unités, régime, mode simple, aperçu du plan. 5. Accueil, journal, scan, eau, activités, calendrier. 6. Progrès, photos, bilans. 7. Réglages nutrition, coach. 8. Tests UI, corrections (débordement 320 px, anneau vide).

## Reste à faire (par priorité)
1. Tester le scan et le coach avec Claude réel sur ton iPhone.
2. Taille en pieds/pouces.
3. Fibres, sucres, sel dans la base.
4. Base d'aliments plus large (import Ciqual).
5. Export de tes données.
