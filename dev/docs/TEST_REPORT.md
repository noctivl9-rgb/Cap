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
