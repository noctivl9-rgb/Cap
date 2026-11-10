# Cap — moteur de recommandation d’activités

Dernière mise à jour : 10/11/2026. Code : `business.js` (`recommander`, `evaluer`). Aucune IA.

## Profil entrepreneurial (questions)

Pays, âge, capital de départ, compétences, matériel déjà possédé, heures par semaine, expérience, aisance à démarcher, tolérance au risque, format préféré, revenu visé (facultatif). Sans compétences, capital, heures, matériel ou âge : **aucune recommandation**, Cap pose la question (`manquants`).

## Catalogue (15 modèles)

Sites vitrines, maintenance web, automatisations, mini-SaaS, montage vidéo, design, réseaux sociaux de commerces, cours particuliers, aide informatique à domicile, lavage auto sans eau, photographe, rédaction/traduction, achat-revente, coaching sportif, petits travaux.

Chaque modèle : client, problème, offre, compétences (pondérées) et compétence clé, matériel requis, coût de démarrage, charges mensuelles, prix bas/médian/haut, heures de production par unité, heures de prospection par client, récurrence, demande supposée (1-3), risque, difficulté, intensité commerciale, heures minimales, âge minimal, régime fiscal, réglementation, test de validation de la demande.

**Ces paramètres sont des hypothèses de départ** (marqués comme tels dans l’interface), pas une étude de marché. La recherche sourcée est prévue pour l’IA (`demandeMarche`).

## Filtres (statut)

| Statut | Condition |
|---|---|
| Écartée | âge inférieur au minimum légal (achat-revente : 18 ans ou émancipation ; coaching rémunéré : carte professionnelle, Code du sport L212-1), heures < minimum |
| Non finançable | budget de départ (démarrage + matériel manquant + 2 mois de charges) > capital ; le montant manquant est affiché |
| Préparation | moins de 16 ans : activité à préparer, aucune vente comptée |

## Score sur 100

| Critère | Poids | Calcul |
|---|---|---|
| Compétences | 22 % | 0,4 + 0,6 × part des compétences pondérées possédées ; 0,1 si la compétence clé manque |
| Potentiel | 15 % | net médian au 6e mois ÷ revenu visé (400 € si non renseigné) |
| Temps | 12 % | heures ÷ (2 × heures minimales) |
| Budget | 12 % | 0,5 + (capital − budget) ÷ (2 × max(budget, 100)) ; 1 si budget nul |
| Demande | 10 % | demande supposée ÷ 3 (hypothèse) |
| Risque | 8 % | 1 − écart entre risque du modèle et tolérance ÷ 2 |
| Difficulté | 8 % | pénalité si difficulté > expérience |
| Démarchage | 6 % | pénalité si intensité commerciale > aisance |
| Charges | 4 % | 1 − charges mensuelles ÷ 100 |
| Format | 3 % | 1 si compatible, 0,4 sinon |

Ordre : d’abord les activités dont tu possèdes la compétence clé, puis le score ; une seule activité par catégorie dans le top 3 si possible (diversité). Chaque rang est expliqué (points forts ≥ 0,6, points faibles, compétence à apprendre, matériel à acheter).

## Sensibilité vérifiée (tests D, E et matrice)

Capital, compétences, heures, matériel, âge, pays, risque, format et revenu visé modifient le classement ou les scores (voir QUESTION_IMPACT_MATRIX.md). Exemple Elias, 16 ans, code, 7 h/semaine : à 0 € les activités web sont non finançables (il manque 30 à 60 €) ; à 500 € elles entrent dans le top 3.

## Règles juridiques (France, confiance moyenne sur les mineurs)

- Création d’entreprise : 16 ans révolus minimum (Bpifrance Création).
- Mineur non émancipé : pas de statut de commerçant (pas d’achat-revente).
- Micro-entreprise de prestations entre 16 et 18 ans avec autorisation écrite des parents : indiquée par plusieurs guides (Indy, LegalPlace) ; Bpifrance mentionne des conditions plus strictes. **À confirmer auprès du guichet unique INPI** ; Cap l’affiche ainsi.
- Pays autre que la France : pas de recommandation, Cap le dit.
