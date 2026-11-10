# CALCULATION_RULES

Toutes les règles sont dans `engine.js` ; chaque résultat affiché a un bouton « Comment est-ce calculé ? ».

## Dépense énergétique
- Métabolisme de base : Mifflin-St Jeor (adultes) ; Schofield OMS/FAO 1985 (10-17 ans).
- Activité quotidienne : × 1,35 (assise), × 1,5 (mixte), × 1,65 (physique).
- Sport prévu : MET nets × kg × heures ÷ 7 (musculation 4, autre sport 6, 1 h 30 par séance).
- Précision : ±10 % ; seule la courbe de poids réelle la confirme.

## Rythme et faisabilité
- Perte adulte : recommandé 0,5 % du poids/sem (max 0,75 kg), maximum 1 % (max 1 kg).
- Perte mineur : recommandé 0,25 kg/sem (≤ 0,4 % du poids), maximum 0,4 kg/sem, écart ≤ 450 kcal/j.
- Prise : adulte 0,25 (max 0,35) ; mineur 0,15 (max 0,25) kg/sem.
- 7 700 kcal ≈ 1 kg.
- Statuts : réaliste ≤ recommandé < ambitieux ≤ maximum < trop court.
- Dangereux (aucun plan) : cible < 35 kg, IMC cible < 16, perte ≥ 40 % ou IMC actuel < 18,5. Avis médical (aucun plan) : IMC cible < 18,5.
- Suivi médical conseillé : perte > 25 % (adulte) ou > 10 % (mineur).
- Plancher : max(métabolisme de base ; 2 000 H / 1 700 F mineurs ; 1 500 H / 1 200 F adultes).

## Macros
Protéines 1,8 g/kg (1,6 en maintien), poids de référence à IMC 25 si IMC > 30 ; lipides ≥ max(0,8 g/kg ; 25 % des kcal) ; glucides = reste.

## Journal
- Entrée = valeurs pour 100 g × grammes ÷ 100. Cuisson : +3 g (poêlé) ou +8 g (frit) d'huile pour 100 g (hypothèse).
- Activité : (MET − 1) × kg × heures (Compendium, valeurs moyennes).
- Option activité : +50 % des activités marquées « en plus du programme ».
- Option report : min(200 ; objectif − mangé la veille), seulement si la veille est notée.
- Eau : 30 ml/kg, borné 1 500-3 500 ml.
- Objectifs perso : refusés sous le plancher ; avertissement si les macros s'écartent de plus de 8 % des calories.
- Scan IA : nom reconnu dans la base → valeurs de la base ; sinon valeurs de l'IA, plafonnées (≤ 900 kcal/100 g), marquées « à vérifier » si calories et macros diffèrent de plus de 25 %.

## Suivi
- Tendance : pente sur ~4 semaines, seulement si 2 pesées à ≥ 1 semaine d'écart.
- Bilan 7 jours : moyenne des seuls jours notés ; moins de 4 jours → « peu fiable ».
- Série : jours consécutifs avec au moins un aliment noté.

## Finances
Capacité = revenus − fixes − variables − remboursements. Durée = reste ÷ capacité (aucun rendement, aucune inflation). Capacité ≤ 0 → aucune date. Revenu visé = scénario séparé. Coûts Dubaï datés du 09/11/2026 (sources dans engine.js › REF), 1 € = 4,10 AED.
