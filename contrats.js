/* Cap — contrats entre l'application et l'IA générative (moteur B), et validation (moteur C).
 * L'IA reçoit des données structurées produites par les moteurs déterministes ; elle peut proposer une adaptation
 * de programme, une recherche de marché sourcée, des questions complémentaires. Tout ce qu'elle renvoie passe par
 * un validateur : ce qui n'est pas conforme est corrigé ou refusé, jamais affiché comme fiable.
 * Tant qu'aucun modèle n'est connecté, statutIA() le dit et l'interface n'affiche aucune « génération IA ». */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./training.js'), require('./business.js'));
  else root.CapContrats = factory(root.CapTraining, root.CapBusiness);
})(typeof self !== 'undefined' ? self : this, function (T, B) {
  'use strict';
  const has = v => v !== undefined && v !== null && v !== '' && !(typeof v === 'number' && !isFinite(v));
  const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;

  // ---------------------------------------------------------------- État du service IA
  // dispo : fonction qui dit si un transport réel existe (capacité Claude ou fonction serveur connectée)
  function statutIA(dispo) {
    const ok = !!(dispo && dispo());
    return ok ? { actif: true, texte: 'IA connectée : les propositions générées sont vérifiées avant affichage.' }
      : { actif: false, texte: 'Génération IA indisponible : le service n’est pas encore activé. Ce que tu vois est calculé par les règles de Cap, pas généré par une IA.' };
  }

  // ---------------------------------------------------------------- Demandes structurées (ce que l'IA reçoit)
  function demandeProgramme(profil, prog, journalSeances) {
    return {
      tache: 'adapter_programme',
      consignes: [
        'Adapte le programme existant sans le régénérer entièrement.',
        'Utilise uniquement des exercices dont l’identifiant figure dans « bibliotheque ».',
        'Respecte matériel, niveau, zones douloureuses, nombre de séances et durée maximale.',
        'Explique chaque changement en une phrase (champ « raison »).'
      ],
      profil: { age: profil.age, niveau: profil.niveau, objectif: profil.objectif, priorite: prog && prog.parametres ? prog.parametres.priorite : null },
      contraintes: prog && prog.parametres ? { seancesMax: prog.parametres.joursRetenus, minutesMax: prog.parametres.minutesRetenues, materiel: prog.parametres.materiel, zonesExclues: prog.parametres.zones } : null,
      programmeActuel: prog && prog.ok ? prog.seances.map(s => ({ cle: s.cle, exercices: s.exercices.map(e => ({ id: e.id, series: e.series, reps: e.reps, repos: e.repos })) })) : [],
      resultatsObserves: (journalSeances || []).slice(-12).map(l => ({ date: l.date, ressenti: l.ressenti || null })),
      bibliotheque: T.LIB.filter(e => prog && prog.parametres && prog.parametres.materiel.indexOf(e.mat) >= 0).map(e => ({ id: e.id, nom: e.nom, pattern: e.pattern, niv: e.niv, zones: e.zones })),
      formatReponse: { seances: [{ cle: 'string', exercices: [{ id: 'string', series: 'number', reps: 'string', repos: 'number' }] }], changements: [{ raison: 'string' }] }
    };
  }
  function demandeMarche(profil, reco) {
    return {
      tache: 'recherche_marche',
      consignes: [
        'Pour chaque activité, vérifie demande, concurrence, prix pratiqués, clients, coûts, réglementation et tendances dans la zone de l’utilisateur.',
        'Chaque fait doit citer une source (titre, URL, date). Sans source, classe l’information en « hypothese ».',
        'Ne donne aucun revenu prévisionnel : les chiffres financiers sont calculés par Cap.'
      ],
      pays: profil.pays || 'france', age: profil.age,
      activites: reco && reco.ok ? reco.top.map(x => ({ id: x.id, nom: x.nom })) : [],
      formatReponse: { activites: [{ id: 'string', faits: [{ theme: 'demande|concurrence|prix|clients|couts|reglementation|tendance', texte: 'string', source: { titre: 'string', url: 'string', date: 'AAAA-MM-JJ' } }], hypotheses: ['string'], prixObserves: { bas: 'number', haut: 'number', source: 'url' } }] }
    };
  }

  // ---------------------------------------------------------------- Validation des réponses de l'IA
  const REPS_OK = /^(\d{1,2})(-(\d{1,2}))?$|^\d{2,3}(-\d{2,3})? s$|^\d{1,2} min$/;
  function validerProgrammeIA(rep, profil, prog) {
    const erreurs = [], corrections = [];
    if (!rep || !Array.isArray(rep.seances)) return { ok: false, erreurs: ['Réponse sans liste de séances.'], programme: null };
    const par = prog && prog.parametres ? prog.parametres : null;
    if (!par) return { ok: false, erreurs: ['Pas de programme calculé de référence : impossible de vérifier.'], programme: null };
    const mineur = (num(profil.age) || 30) < 18, niv = T.NIV[profil.niveau] || 1;
    if (rep.seances.length > par.joursRetenus) erreurs.push('Trop de séances : ' + rep.seances.length + ' pour ' + par.joursRetenus + ' possibles.');
    const seances = rep.seances.map(s => {
      let duree = 6 * 60;
      const ex = (s.exercices || []).filter(e => {
        const ref = T.PAR_ID[e.id];
        if (!ref) { erreurs.push('Exercice inconnu de la bibliothèque : « ' + e.id + ' ».'); return false; }
        if (par.materiel.indexOf(ref.mat) < 0 || (ref.requiert || []).some(r => par.materiel.indexOf(r) < 0)) { erreurs.push(ref.nom + ' : matériel non disponible.'); return false; }
        if (par.zones && ref.zones.some(z => par.zones.indexOf(z) >= 0)) { erreurs.push(ref.nom + ' : sollicite une zone douloureuse.'); return false; }
        if (ref.niv > niv) { erreurs.push(ref.nom + ' : niveau trop élevé.'); return false; }
        return true;
      }).map(e => {
        const o = { id: e.id, nom: T.PAR_ID[e.id].nom, series: num(e.series), reps: String(e.reps || ''), repos: num(e.repos) };
        if (!o.series || o.series < 1 || o.series > 6) { corrections.push(o.nom + ' : séries ramenées dans 1-6.'); o.series = Math.min(6, Math.max(1, o.series || 3)); }
        if (!REPS_OK.test(o.reps)) { erreurs.push(o.nom + ' : répétitions illisibles « ' + o.reps + ' ».'); o.reps = '8-12'; }
        const bas = parseInt(o.reps, 10);
        if (mineur && /^\d/.test(o.reps) && !/ s$| min$/.test(o.reps) && bas < 8) { corrections.push(o.nom + ' : moins de 18 ans, minimum 8 répétitions.'); o.reps = '8-12'; }
        if (o.repos === null || o.repos < 20 || o.repos > 300) { corrections.push(o.nom + ' : repos ramené dans 20-300 s.'); o.repos = 90; }
        duree += o.series * (40 + o.repos) + 60;
        return o;
      });
      if (duree > par.minutesRetenues * 60 * 1.1) erreurs.push('Séance ' + s.cle + ' : ' + Math.round(duree / 60) + ' min pour ' + par.minutesRetenues + ' disponibles.');
      return { cle: s.cle, exercices: ex, duree: Math.round(duree / 60) };
    });
    return { ok: erreurs.length === 0, erreurs, corrections, programme: erreurs.length ? null : { origine: 'ia_validee', seances } };
  }
  const URL_OK = /^https?:\/\/[^\s]+\.[^\s]+/;
  function validerMarcheIA(rep) {
    const erreurs = [], retenus = [];
    if (!rep || !Array.isArray(rep.activites)) return { ok: false, erreurs: ['Réponse sans liste d’activités.'], activites: [] };
    rep.activites.forEach(a => {
      if (!B.PAR_ID[a.id]) { erreurs.push('Activité inconnue : ' + a.id); return; }
      const faits = [], hyp = (a.hypotheses || []).filter(x => typeof x === 'string').slice(0, 10);
      (a.faits || []).forEach(f => {
        const src = f && f.source;
        if (src && URL_OK.test(src.url || '') && /^\d{4}-\d{2}(-\d{2})?$/.test(src.date || '')) faits.push({ theme: f.theme, texte: String(f.texte).slice(0, 400), source: { titre: String(src.titre || '').slice(0, 120), url: src.url, date: src.date } });
        else hyp.push(String((f && f.texte) || '').slice(0, 300) + ' (non sourcé)');
      });
      // Aucun revenu prévisionnel accepté de l'IA : les montants viennent du moteur
      if (/€\s*(par|\/)\s*mois|revenu (de|prévu|garanti)/i.test(JSON.stringify(a.hypotheses || []))) erreurs.push(a.id + ' : revenu prévisionnel fourni par l’IA, ignoré.');
      retenus.push({ id: a.id, faits, hypotheses: hyp });
    });
    return { ok: !erreurs.length || retenus.length > 0, erreurs, activites: retenus };
  }
  // Questions complémentaires : 3 au maximum, chacune liée à un champ connu de la matrice et justifiée
  function validerQuestionsIA(liste, matrice) {
    const champs = {}; (matrice || []).forEach(q => { champs[q.variable] = q; });
    const ok = [], refus = [];
    (Array.isArray(liste) ? liste : []).forEach(q => {
      if (ok.length >= 3) { refus.push({ q, raison: 'Plus de 3 questions.' }); return; }
      if (!q || !champs[q.champ]) { refus.push({ q, raison: 'Champ inconnu : la question n’aurait aucune conséquence.' }); return; }
      if (!q.raison || String(q.raison).length < 10) { refus.push({ q, raison: 'Question non justifiée.' }); return; }
      ok.push({ champ: q.champ, texte: champs[q.champ].texte, raison: String(q.raison).slice(0, 200) });
    });
    return { questions: ok, refus };
  }

  // ---------------------------------------------------------------- Contexte du coach (chiffres des moteurs uniquement)
  function contexteCoach(profil, d) {
    const c = { regle: 'Tous les chiffres ci-dessous viennent des moteurs de calcul de Cap. N’en invente aucun.' };
    if (d.energie && d.energie.ok) c.energie = { metabolisme_base: d.energie.bmr, methode: d.energie.bmrMethode, depense: d.energie.tdee, plage: d.energie.plage, hypotheses: d.energie.hypotheses };
    if (d.prog && d.prog.ok) c.programme = { origine: d.prog.origine, seances: d.prog.seances.map(s => s.nom + ' (' + s.duree + ' min)'), decisions: (d.prog.decisions || []).map(x => ({ sujet: x.sujet, decision: x.valeur, raison: x.raison, reponses_utilisees: x.champs })) };
    if (d.business && d.business.ok) c.business = { top: d.business.top.map(x => ({ nom: x.nom, score: x.score, explication: x.explication })), ecartes: d.business.ecartes.slice(0, 6).map(x => ({ nom: x.nom, statut: x.statut, raisons: x.raisons })), hypotheses: d.business.hypotheses };
    return c;
  }
  // Explication sans IA des décisions principales (toujours disponible)
  function expliquerSansIA(d) {
    const l = [];
    if (d.energie && d.energie.ok) l.push('Dépense estimée ' + d.energie.tdee + ' kcal/j (plage ' + d.energie.plage[0] + '-' + d.energie.plage[1] + ') : ' + d.energie.bmrMethode + ', × ' + String(d.energie.pal).replace('.', ',') + ' pour l’activité, + ' + d.energie.sportKcal + ' kcal de sport.');
    if (d.prog && d.prog.ok) (d.prog.decisions || []).forEach(x => l.push(x.raison));
    if (d.business && d.business.ok) d.business.top.forEach(x => l.push(x.nom + ' : ' + x.explication));
    return l;
  }
  return { statutIA, demandeProgramme, demandeMarche, validerProgrammeIA, validerMarcheIA, validerQuestionsIA, contexteCoach, expliquerSansIA };
});
