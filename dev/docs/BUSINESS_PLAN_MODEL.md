# Cap — modèle de plan d’affaires et plan d’action

Dernière mise à jour : 10/11/2026. Code : `business.js` (`plan`, `projection`, `planAction`).

## Contenu du plan (pour l’activité choisie)

Concept (client, problème, offre, unité vendue), prix bas/médian/haut (**hypothèse**), budget initial (**calcul** : démarrage + matériel manquant + 2 mois de charges), charges mensuelles et variables, régime et taux de cotisations, marge par unité, seuil de rentabilité, scénarios sur 12 mois, mois de récupération du budget, test de validation de la demande, formalités, risques, hypothèses listées. Avertissement : scénarios calculés, pas revenus promis.

## Formules

- Heures du mois H = heures/semaine × 4,33. Part de prospection : 70 % (mois 1), 60, 50, 45, 40, 35 %, puis 30 %.
- Nouveaux clients = heures de prospection ÷ heures par client (×1,6 en prudent, ×0,7 en favorable). Aucun client avant le mois de la première vente du plan d’action (cohérence entre les deux plans) ; aucun avant 16 ans.
- Clients récurrents : actifs = actifs × 0,9 + nouveaux (10 % d’attrition, hypothèse) ; unités = actifs × récurrence.
- Unités vendues = min(demande, capacité de production = heures de production ÷ heures par unité).
- Chiffre d’affaires = unités × prix du scénario ; **si des ventes réelles existent pour ce mois, elles remplacent la prévision** (marquées « Observé »).
- Cotisations = CA × (taux + CFP). Taux 2026 : vente 12,3 %, services BIC 21,2 %, BNC 25,6 % ; CFP 0,1 à 0,3 % (Weblex, décret 2025-943, consulté le 10/11/2026). Impôt sur le revenu non compté.
- Net = CA − cotisations − charges variables − charges fixes. Seuil = charges fixes ÷ (prix médian × (1 − taux) − coût variable).

## Plan d’action 30/60/90 jours

12 tâches avec durée (heures), priorité, dépendances et critère de réussite : offre et prix, démarches (accord parental si mineur), portfolio, liste de 30 prospects, validation de la demande, immatriculation, première vente, avis client, nouvelle prospection, mesure des chiffres réels, ajustement, seuil de rentabilité.

Ordonnancement : tri par dépendances, tâches enchaînées au rythme de (heures/semaine ÷ 7) par jour ; phase = jour de fin ≤ 30, ≤ 60, ≤ 90, après. Alerte si la première vente tombe après 90 jours.

Tâches faites : enregistrées dans `taches` avec date et historique des changements ; elles restent « Terminé » quand le plan est recalculé (heures modifiées, autre activité), seules les tâches restantes sont replanifiées. Changer d’activité ne supprime ni tâches ni ventes.

## Adaptation aux résultats réels

Première vente saisie → mois concerné en « Observé » dans les trois scénarios, total et retour sur budget recalculés. Capital ou heures modifiés → classement, budget, scénarios et calendrier recalculés ; l’ancien profil part dans `historique`.
