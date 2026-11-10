/* Cap — registre des questions et de leurs conséquences (source unique de QUESTION_IMPACT_MATRIX.md).
 * Règle : chaque question influence au moins un calcul, une recommandation, une décision, une fonctionnalité
 * ou une règle de sécurité. dev/tests/matrice-tests.js le vérifie en changeant chaque réponse et en comparant les sorties.
 * sonde : deux valeurs de test ; sorties : clés de consequences() qui doivent changer entre les deux. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'), require('./training.js'), require('./business.js'), require('./foods.js'));
  else root.CapMatrice = factory(root.CapEngine, root.CapTraining, root.CapBusiness, root.CapFoods);
})(typeof self !== 'undefined' ? self : this, function (E, T, B, F) {
  'use strict';
  const C = 'domaines contient corps', A_ = 'domaines contient argent', EN = 'domaines contient entreprise', AE = 'argent ou entreprise';
  const Q = (id, texte, type, variable, unite, validation, condition, utilite, calculs, modules, recalcul, manquant, sonde, sorties) => ({ id, texte, type, variable, unite, validation, condition, utilite, calculs, modules, recalcul, manquant, sonde, sorties });
  const REGISTRE = [
    Q('domaines', 'Sur quoi veux-tu avancer ?', 'choix multiple', 'domaines', '—', 'au moins un module', 'toujours', 'Décide quelles questions sont posées et quels onglets existent.', ['tous'], ['questionnaire', 'navigation'], 'Ajout d’un module : ses questions sont demandées ; retrait : ses données sont gardées, non affichées.', 'Bloque la suite : au moins un module requis.', [['corps'], ['corps', 'argent', 'entreprise']], ['finances.capacite', 'business.top']),
    Q('age', 'Quel âge as-tu ?', 'règle', 'age', 'ans', '10 à 100 ; moins de 13 bloqué', 'toujours', 'Choix de la formule (Schofield avant 18 ans), plafonds de rythme, minimum de calories, statuts juridiques possibles.', ['metabolisme', 'rythme max', 'plancher kcal', 'séries/répétitions', 'activités légales'], ['énergie', 'objectif poids', 'programme', 'entreprise', 'sécurité mineurs'], 'Recalcule énergie, plan de poids, programme et classement business.', 'Aucun calcul physiologique ni business : Cap demande l’âge.', [25, 16], ['energie.bmr', 'physique.kcal', 'business.top']),
    Q('tempsLibre', 'Combien d’heures libres as-tu par semaine ?', 'règle', 'tempsLibre', 'h/semaine', '0 à 100', 'toujours', 'Budget de temps : le programme sportif et le projet doivent y tenir.', ['budget temps du programme', 'alerte de cohérence'], ['programme', 'cohérence'], 'Réorganise le programme (durée puis nombre de séances).', 'Programme non vérifié contre la semaine, signalé dans les décisions.', [20, 4], ['programme.empreinte', 'coherence.ids']),
    Q('sexe', 'Quelle formule de métabolisme utiliser ?', 'choix', 'sexe', '—', 'H, F ou nr', C, 'Paramètre physiologique de l’équation. Jamais déduit de l’identité de genre. « nr » : moyenne des deux formules et marge élargie.', ['metabolisme', 'plancher kcal'], ['énergie', 'objectif poids'], 'Recalcule métabolisme, dépense, plage d’incertitude et calories.', 'Requis pour le calcul ; l’option « ne pas répondre » existe.', ['H', 'nr'], ['energie.bmr', 'energie.plage']),
    Q('taille', 'Quelle est ta taille ?', 'règle', 'taille', 'cm', '120 à 230', C, 'Mifflin-St Jeor, IMC, rapport tour de taille / taille.', ['metabolisme', 'IMC', 'rapport tour/taille'], ['énergie', 'objectif poids'], 'Recalcule énergie, IMC et limites de cible.', 'Repli Schofield (poids seul) pour l’énergie ; IMC non calculé.', [178, 165], ['energie.bmr', 'physique.imc']),
    Q('poids', 'Quel est ton poids ?', 'règle', 'poids', 'kg', '30 à 300', C, 'Métabolisme, dépense du sport, protéines, eau, point de départ du suivi.', ['metabolisme', 'dépense sport', 'macros', 'eau', 'rythme'], ['énergie', 'objectif poids', 'nutrition', 'suivi'], 'Recalcule toutes les estimations physiques concernées.', 'Aucun calcul : Cap demande le poids.', [80, 92], ['energie.tdee', 'physique.kcal', 'physique.macros']),
    Q('tour', 'Ton tour de taille ?', 'règle (facultative)', 'tour', 'cm', '40 à 200', C, 'Rapport tour de taille / taille (repère NICE) et suivi de la perte de gras.', ['rapport tour/taille'], ['objectif poids', 'progrès'], 'Recalcule l’indicateur.', 'Indicateur non calculé, dit explicitement.', [85, 100], ['physique.rtt']),
    Q('objectif', 'Quel est ton objectif ?', 'choix', 'objectif', '—', 'perdre, maintenir, prendre', C, 'Sens de l’écart calorique, protéines, priorité sportive par défaut.', ['écart kcal', 'protéines', 'priorité'], ['objectif poids', 'nutrition', 'programme'], 'Recalcule calories, macros et programme.', 'Requis.', ['perdre', 'maintenir'], ['physique.kcal', 'programme.empreinte']),
    Q('cible', 'Quel poids vises-tu ?', 'règle', 'cible', 'kg', '30 à 300 ; contrôle IMC cible', C + ' et objectif ≠ maintenir', 'Écart à couvrir, faisabilité, détection d’objectif dangereux.', ['écart', 'statut', 'semaines'], ['objectif poids', 'sécurité'], 'Recalcule statut et calendrier.', 'Plan de poids non calculé.', [74, 60], ['physique.statut', 'physique.semaines']),
    Q('delai', 'En combien de temps ?', 'choix', 'delaiSem', 'semaines', 'liste', C + ' et objectif ≠ maintenir', 'Compare le rythme requis au maximum prudent.', ['rythme requis', 'statut'], ['objectif poids'], 'Recalcule le statut (réaliste, ambitieux, trop court).', 'Statut « libre » : rythme recommandé.', [26, 4], ['physique.statut']),
    Q('faisabilite', 'Ton rythme', 'choix', 'rythme', 'kg/semaine', 'plafonné au maximum prudent', C + ' et objectif ≠ maintenir', 'Écart calorique quotidien.', ['écart kcal', 'semaines'], ['objectif poids'], 'Recalcule calories et durée.', 'Rythme recommandé appliqué et affiché.', [0.3, 0.6], ['physique.kcal', 'physique.semaines']),
    Q('activite', 'En dehors du sport, ta journée est plutôt…', 'choix', 'activite', 'coefficient', 'assis, mixte, physique', C, 'Coefficient d’activité hors sport (le sport est compté à part pour ne pas le compter deux fois).', ['PAL', 'dépense'], ['énergie'], 'Recalcule la dépense.', 'Aucun calcul de dépense.', ['assis', 'physique'], ['energie.tdee']),
    Q('autreSport', 'Pratiques-tu un autre sport ?', 'choix', 'autreSport', 'séances/semaine', '0 à 5+', C, 'Dépense du sport, budget de temps, jours de repos.', ['dépense sport', 'budget temps', 'récupération'], ['énergie', 'programme'], 'Recalcule dépense et programme.', '0 supposé seulement si choisi.', [0, 4], ['energie.tdee', 'programme.empreinte']),
    Q('niveau', 'Ton niveau en musculation ?', 'choix', 'niveau', '—', '3 niveaux', C, 'Séances maximum, exercices autorisés, volume, progression.', ['séances max', 'volume', 'exercices'], ['programme'], 'Régénère le programme.', 'Programme non construit.', ['debutant', 'avance'], ['programme.empreinte']),
    Q('jours', 'Combien de séances de musculation par semaine ?', 'choix', 'jours', 'séances', '0 à 6', C, 'Nombre de séances et découpage (corps complet, haut/bas, poussée/tirage).', ['découpage', 'dépense sport'], ['programme', 'énergie'], 'Régénère le programme.', 'Programme non construit.', [2, 4], ['programme.seances', 'energie.tdee']),
    Q('minutes', 'Combien de temps par séance ?', 'choix', 'minutes', 'min', '20 à 90', C + ' et jours > 0', 'Nombre d’exercices par séance, dépense du sport.', ['durée', 'volume'], ['programme', 'énergie'], 'Régénère le programme.', 'Programme non construit.', [30, 75], ['programme.empreinte', 'energie.tdee']),
    Q('lieu', 'Où t’entraînes-tu ?', 'choix', 'lieu', '—', 'salle, maison', C + ' et jours > 0', 'Matériel disponible.', ['exercices possibles'], ['programme'], 'Régénère le programme.', 'Programme non construit.', ['maison', 'salle'], ['programme.empreinte']),
    Q('materielSport', 'Quel matériel as-tu chez toi ?', 'choix multiple', 'materielSport', '—', 'liste', C + ', jours > 0, maison', 'Exercices possibles et alternatives.', ['sélection d’exercices'], ['programme'], 'Régénère le programme.', 'Hypothèse prudente « aucun matériel », signalée.', [['aucun'], ['halteres', 'banc']], ['programme.empreinte']),
    Q('prioriteSport', 'Ta priorité à l’entraînement ?', 'choix', 'prioriteSport', '—', 'forme, muscle, force, auto', C + ' et jours > 0', 'Séries, répétitions, repos. Force refusée aux mineurs et débutants.', ['séries', 'répétitions', 'repos'], ['programme'], 'Régénère le programme.', 'Déduite de l’objectif, signalé.', ['forme', 'muscle'], ['programme.empreinte']),
    Q('contraintes', 'Quelque chose à prendre en compte ?', 'choix multiple', 'contraintes', '—', 'liste', C, 'Règles de sécurité : exclusion d’exercices, avis médical.', ['exclusions', 'notes de sécurité'], ['programme', 'sécurité'], 'Régénère le programme.', 'Requis.', [['aucune'], ['douleur']], ['programme.empreinte']),
    Q('zonesDouleur', 'Où as-tu mal ?', 'choix multiple', 'zonesDouleur', '—', 'liste', C + ' et douleur déclarée', 'Retire les exercices qui sollicitent la zone.', ['exclusions'], ['programme', 'sécurité'], 'Régénère le programme.', 'Sauts retirés par prudence, zone demandée.', [['autre'], ['genou']], ['programme.empreinte']),
    Q('regime', 'Ton alimentation', 'choix', 'regime', '—', 'liste', C, 'Filtre la base d’aliments et les suggestions.', ['aliments compatibles'], ['nutrition'], 'Filtre immédiatement le journal et la recherche.', 'Omnivore par défaut, modifiable.', ['omnivore', 'vegetalien'], ['nutrition.aliments']),
    Q('suivi', 'As-tu déjà compté tes calories ?', 'choix', 'modeSimple', '—', 'oui/non', C, 'Ce que l’accueil affiche (calories et protéines seulement, ou toutes les macros).', ['—'], ['interface accueil'], 'Accueil réaffiché.', 'Toutes les macros affichées.', null, null),
    Q('obstacle', 'Qu’est-ce qui t’a le plus freiné ?', 'choix (facultatif)', 'obstacle', '—', 'liste', C, 'Ajuste le programme (régularité : 3 séances max ; temps : 45 min max ; motivation : objectifs courts) et le conseil nutrition.', ['séances', 'durée', 'conseil'], ['programme', 'nutrition'], 'Régénère le programme et le conseil.', 'Aucun ajustement.', ['motivation', 'temps'], ['programme.empreinte', 'physique.conseil']),
    Q('revenus', 'Combien reçois-tu par mois ?', 'montant', 'revenus', '€/mois', '≥ 0', A_, 'Capacité d’épargne, soutenabilité du projet.', ['capacité', 'délai', 'soutenabilité voiture'], ['argent'], 'Recalcule capacité et calendrier.', 'Aucun calcul financier.', [1800, 1200], ['finances.capacite']),
    Q('fixes', 'Tes dépenses fixes par mois ?', 'montant', 'fixes', '€/mois', '≥ 0', A_, 'Capacité d’épargne, réserve de sécurité.', ['capacité', 'réserve'], ['argent'], 'Recalcule.', 'Aucun calcul financier.', [700, 900], ['finances.capacite']),
    Q('variables', 'Tes dépenses variables par mois ?', 'montant', 'variables', '€/mois', '≥ 0', A_, 'Capacité d’épargne, réserve.', ['capacité', 'réserve'], ['argent'], 'Recalcule.', 'Aucun calcul financier.', [400, 600], ['finances.capacite']),
    Q('remboursements', 'Rembourses-tu un crédit ?', 'montant', 'remboursements', '€/mois', '≥ 0', A_, 'Capacité, alerte surendettement.', ['capacité', 'alerte'], ['argent', 'sécurité'], 'Recalcule.', 'Requis (0 si aucun).', [0, 200], ['finances.capacite']),
    Q('epargne', 'Combien as-tu de côté aujourd’hui ?', 'montant', 'epargne', '€', 'nombre', A_, 'Point de départ, reste à réunir, étape en cours.', ['reste', 'délai'], ['argent'], 'Recalcule.', 'Aucun calcul financier.', [2000, 10000], ['finances.mois']),
    Q('reve', 'Quel est ton grand projet ?', 'choix + montant', 'reve', '€', 'liste ou montant > 0', A_, 'Coût du projet de vie (sources datées).', ['coût', 'reste', 'revenu nécessaire'], ['argent'], 'Recalcule.', 'Aucun calcul financier.', ['vivre', 'appart'], ['finances.mois']),
    Q('reveAnnee', 'Pour quand ?', 'choix', 'reveAnnee', 'année', '2026 à 2080', A_, 'Épargne mensuelle requise, faisabilité.', ['requis mensuel', 'faisabilité'], ['argent'], 'Recalcule.', 'Aucun calcul de délai.', [2031, 2045], ['finances.requis']),
    Q('competences', 'Qu’est-ce que tu sais déjà faire ?', 'choix multiple', 'competences', '—', 'liste', AE, 'Activités livrables tout de suite ou à apprendre.', ['score compétences', 'ordre du classement'], ['entreprise'], 'Recalcule le classement.', 'Aucune recommandation : question posée d’abord.', [['code', 'design'], ['video', 'photo']], ['business.top']),
    Q('heuresProjet', 'Combien d’heures par semaine pour ton projet ?', 'règle', 'heuresProjet', 'h/semaine', '0 à 100', AE, 'Activités possibles, revenu calculé, calendrier 30/60/90, budget de temps du sport.', ['score temps', 'projection', 'plan d’action'], ['entreprise', 'programme', 'cohérence'], 'Recalcule classement, scénarios et plan d’action.', 'Aucun plan d’action.', [8, 3], ['business.top', 'business.plan', 'business.action']),
    Q('revenuVise', 'Un revenu mensuel que tu vises ?', 'montant (facultatif)', 'revenuVise', '€/mois', '≥ 0', AE, 'Scénario d’hypothèse séparé ; repère du potentiel des activités.', ['scénario hypothèse', 'score potentiel'], ['argent', 'entreprise'], 'Recalcule.', 'Repère de 400 €/mois pour le score potentiel.', [3000, 300], ['finances.hypothese', 'business.scores']),
    Q('pays', 'Dans quel pays veux-tu lancer ton activité ?', 'choix', 'pays', '—', 'liste', EN, 'Règles juridiques et fiscales applicables (France couverte).', ['statuts', 'cotisations'], ['entreprise'], 'Recalcule ou suspend le classement.', 'France supposée seulement si choisie.', ['france', 'emirats'], ['business.top']),
    Q('capital', 'Combien peux-tu investir pour démarrer ?', 'montant', 'capital', '€', '≥ 0', EN, 'Activités finançables ou non, score budget.', ['filtre budget', 'score budget'], ['entreprise'], 'Recalcule le classement.', 'Aucune recommandation.', [0, 600], ['business.top', 'business.statuts']),
    Q('materielPro', 'Quel matériel as-tu déjà ?', 'choix multiple', 'materielPro', '—', 'liste', EN, 'Matériel à acheter ajouté au budget de départ.', ['budget de départ'], ['entreprise'], 'Recalcule budgets et classement.', 'Aucune recommandation.', [['ordinateur'], ['aucun']], ['business.statuts']),
    Q('experience', 'As-tu déjà travaillé pour quelqu’un ?', 'choix', 'experience', '—', 'liste', EN, 'Pénalise les activités difficiles pour un débutant.', ['score difficulté'], ['entreprise'], 'Recalcule le classement.', 'Considéré comme « aucune » (prudent), signalé.', ['aucune', 'clients'], ['business.scores']),
    Q('aisanceVente', 'Contacter des inconnus pour proposer ton offre ?', 'choix', 'aisanceVente', '1 à 3', '1, 2, 3', EN, 'Pénalise les activités à fort démarchage.', ['score vente'], ['entreprise'], 'Recalcule le classement.', 'Valeur moyenne (2).', [1, 3], ['business.scores']),
    Q('risque', 'Quel risque acceptes-tu ?', 'choix', 'risque', '—', 'faible, moyen, élevé', EN, 'Adéquation risque de l’activité / tolérance.', ['score risque'], ['entreprise'], 'Recalcule le classement.', 'Moyen.', ['faible', 'eleve'], ['business.scores']),
    Q('formatPref', 'Plutôt en ligne ou près de chez toi ?', 'choix', 'formatPref', '—', 'liste', EN, 'Adéquation format.', ['score format'], ['entreprise'], 'Recalcule le classement.', 'Indifférent.', ['en_ligne', 'local'], ['business.scores'])
  ];
  const PAR_VARIABLE = {}; REGISTRE.forEach(q => { PAR_VARIABLE[q.variable] = q; });

  // Sorties comparables de tous les moteurs pour un profil donné
  function consequences(p, ventes, faites) {
    const o = {};
    const doms = p.domaines || [];
    const en = doms.indexOf('corps') >= 0 ? E.energie(p) : null;
    o['energie.bmr'] = en && en.ok ? en.bmr : null; o['energie.tdee'] = en && en.ok ? en.tdee : null; o['energie.plage'] = en && en.ok ? en.plage.join('-') : null;
    const ph = doms.indexOf('corps') >= 0 ? E.physique(p) : null;
    o['physique.kcal'] = ph && ph.ok ? ph.kcal : null; o['physique.statut'] = ph && ph.ok ? ph.statut : null; o['physique.semaines'] = ph && ph.ok ? ph.semaines : null;
    o['physique.imc'] = ph && ph.ok ? ph.imc : null; o['physique.rtt'] = ph && ph.ok ? ph.rtt : null; o['physique.macros'] = ph && ph.ok ? JSON.stringify(ph.macros) : null; o['physique.conseil'] = ph && ph.ok ? ph.conseil : null;
    const pr = doms.indexOf('corps') >= 0 ? T.generer(p) : null;
    o['programme.empreinte'] = pr && pr.ok ? (pr.empreinte || 'vide') : null; o['programme.seances'] = pr && pr.ok ? pr.seances.length : null;
    const fi = doms.indexOf('argent') >= 0 ? E.finances(p, [], '2026-11-10') : null;
    o['finances.capacite'] = fi && fi.ok ? fi.capacite : null; o['finances.mois'] = fi && fi.ok ? Math.round(fi.moisAuRythme || 0) : null; o['finances.requis'] = fi && fi.ok ? Math.round(fi.requisMensuel) : null;
    o['finances.hypothese'] = fi && fi.ok && fi.hypothese ? fi.hypothese.revenu : null;
    o['nutrition.aliments'] = F.BASE.filter(a => F.compatible(a, p.regime || 'omnivore')).length;
    const co = E.coherence(p, ph, pr, fi); o['coherence.ids'] = co.map(i => i.id).sort().join(',');
    const bz = doms.indexOf('entreprise') >= 0 ? B.recommander(p) : null;
    o['business.top'] = bz && bz.ok ? bz.top.map(x => x.id).join(',') : (bz ? 'manque:' + (bz.manquants || []).map(x => x.champ).join(',') + (bz.pays || '') : null);
    o['business.statuts'] = bz && bz.ok ? bz.ecartes.map(x => x.id + ':' + x.statut).sort().join(',') : null;
    o['business.scores'] = bz && bz.ok ? B.CATALOGUE.map(m => B.evaluer(m, p).score).join(',') : null;
    const id = p.businessChoisi;
    o['business.plan'] = id && doms.indexOf('entreprise') >= 0 ? B.plan(id, p, ventes || []).scenarios.median.total12 : null;
    const pa = id && doms.indexOf('entreprise') >= 0 ? B.planAction(id, p, faites || {}) : null;
    o['business.action'] = pa && pa.ok ? pa.taches.map(t => t.jourFin).join(',') : null;
    return o;
  }
  // Questions utiles manquantes, pour les modules choisis (pas de valeur inventée)
  function questionsManquantes(p) {
    const doms = p.domaines || [], out = [];
    const besoin = { corps: ['age', 'sexe', 'taille', 'poids', 'objectif', 'activite', 'niveau', 'jours'], argent: ['revenus', 'fixes', 'variables', 'epargne', 'reve', 'reveAnnee'], entreprise: ['age', 'competences', 'capital', 'heuresProjet', 'materielPro', 'pays'] };
    const vu = {};
    doms.forEach(d => (besoin[d] || []).forEach(v => {
      const val = p[v];
      const vide = val === undefined || val === null || val === '' || (Array.isArray(val) && !val.length);
      if (vide && !vu[v]) { vu[v] = 1; const q = PAR_VARIABLE[v]; out.push({ champ: v, texte: q ? q.texte : v, raison: q ? q.utilite : '', siAbsent: q ? q.manquant : '' }); }
    }));
    if (doms.indexOf('corps') >= 0 && (p.jours || 0) > 0 && p.lieu === 'maison' && !Array.isArray(p.materielSport)) out.push({ champ: 'materielSport', texte: PAR_VARIABLE.materielSport.texte, raison: PAR_VARIABLE.materielSport.utilite, siAbsent: PAR_VARIABLE.materielSport.manquant });
    return out;
  }
  return { REGISTRE, PAR_VARIABLE, consequences, questionsManquantes };
});
