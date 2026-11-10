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
  const CHAMPS_PROGRAMME = ['age', 'sexe', 'taille', 'poids', 'objectif', 'cible', 'niveau', 'jours', 'minutes', 'lieu', 'materielSport', 'prioriteSport', 'contraintes', 'zonesDouleur', 'tempsLibre', 'heuresProjet', 'autreSport', 'obstacle', 'activite'];
  function entrees(p, champs) { const o = {}; champs.forEach(k => { if (p[k] !== undefined) o[k] = p[k]; }); return o; }
  function changements(avant, apres) {
    if (!avant) return [];
    return Object.keys(Object.assign({}, avant, apres)).filter(k => JSON.stringify(avant[k]) !== JSON.stringify(apres[k])).map(k => ({ champ: k, avant: avant[k] === undefined ? null : avant[k], apres: apres[k] === undefined ? null : apres[k] }));
  }
  function demandeProgramme(profil, prog, journalSeances, extra) {
    extra = extra || {};
    const par = prog && prog.parametres ? prog.parametres : null;
    const ref = prog && prog.ok ? prog.seances.map(s => ({ cle: s.cle, nom: s.nom, exercices: s.exercices.map(e => ({ id: e.id, series: e.series, reps: e.reps, repos: e.repos })) })) : [];
    return {
      tache: 'programme',
      profil: { age: profil.age, sexeFormule: profil.sexe || null, taille: profil.taille, poids: profil.poids, objectif: profil.objectif, cible: profil.cible || null, niveau: profil.niveau, priorite: par ? par.priorite : profil.prioriteSport, frein: profil.obstacle || null, autreSportSeances: profil.autreSport || 0, activiteQuotidienne: profil.activite },
      donnees: {
        energie: extra.energie && extra.energie.ok ? { metabolismeBase: extra.energie.bmr, depense: extra.energie.tdee, plage: extra.energie.plage, methode: extra.energie.bmrMethode } : null,
        objectifCalorique: extra.physique && extra.physique.ok ? { kcal: extra.physique.kcal, rythmeKgSemaine: extra.physique.rythme, statut: extra.physique.statut } : null,
        tendancePoids: extra.tendance || null,
        decisionsDeSecuriteCap: prog && prog.decisions ? prog.decisions.map(d => d.raison) : []
      },
      contraintes: par ? { seancesMax: par.joursRetenus, minutesMax: par.minutesRetenues, materiel: par.materiel, zonesExclues: par.zones, tempsDisponibleH: par.tempsLibre === undefined || par.tempsLibre === null ? null : Math.max(0, par.tempsLibre - par.heuresProjet - (par.autreSport || 0) * 1.5) } : null,
      historique: (journalSeances || []).slice(-12).map(l => ({ date: l.date, seance: l.nom || l.cle, ressenti: l.ressenti || null })),
      complements: profil.complements || {},
      programmeReferenceCap: ref,
      programmePrecedent: extra.precedent ? extra.precedent.seances.map(s => ({ cle: s.cle, nom: s.nom, jour: s.jour, exercices: s.exercices.map(e => e.nom + ' ' + e.series + '×' + e.reps) })) : null,
      changements: extra.changements || [],
      bibliotheque: T.LIB.filter(e => par && par.materiel.indexOf(e.mat) >= 0 && (e.requiert || []).every(r => par.materiel.indexOf(r) >= 0)).map(e => ({ id: e.id, nom: e.nom, pattern: e.pattern, niveauMin: e.niv, zones: e.zones }))
    };
  }
  function demandeMarche(profil, reco) {
    return {
      tache: 'business',
      profil: entrees(profil, ['age', 'pays', 'ville', 'capital', 'competences', 'materielPro', 'heuresProjet', 'experience', 'aisanceVente', 'risque', 'formatPref', 'revenuVise']),
      complements: profil.complements || {},
      referenceCap: reco && reco.ok ? { top: reco.top.map(x => ({ nom: x.nom, score: x.score, explication: x.explication })), ecartes: reco.ecartes.map(x => ({ nom: x.nom, statut: x.statut, raisons: x.raisons })), notesLegales: reco.notes } : null,
      fiscalite: Object.keys(B.REGIMES).map(k => ({ regime: k, nom: B.REGIMES[k].nom, cotisations: B.REGIMES[k].taux })),
      budgetDeDepartMax: profil.capital
    };
  }
  function demandeQuestions(profil, registre, manquantes) {
    return { tache: 'questions', modules: profil.domaines || [], profil: Object.assign({}, profil, { complements: undefined }), complements: profil.complements || {}, registre: (registre || []).map(q => ({ variable: q.variable, question: q.texte })), dejaManquantesSelonCap: manquantes || [] };
  }

  // ---------------------------------------------------------------- Validation des réponses de l'IA
  const REPS_OK = /^(\d{1,2})(-(\d{1,2}))?$|^\d{2,3}(-\d{2,3})? s$|^\d{1,3}(-\d{1,3})? min$/;
  const PATTERNS = ['squat', 'hinge', 'lunge', 'push_h', 'push_inc', 'push_v', 'pull_h', 'pull_v', 'ischios', 'epaules_lat', 'bras_flex', 'bras_ext', 'mollets', 'core', 'cardio', 'mobilite'];
  const MATS = ['aucun', 'halteres', 'barre', 'machine', 'poulie', 'traction', 'elastique', 'banc'];
  // Durée estimée par Cap (on ne fait pas confiance à la durée annoncée par l'IA)
  function dureeExercice(o) {
    const m = /^(\d{1,3})(?:-(\d{1,3}))? min$/.exec(o.reps);
    if (m) return Number(m[2] || m[1]) * 60;
    const sec = /^(\d{2,3})(?:-(\d{2,3}))? s$/.exec(o.reps);
    const travail = sec ? Number(sec[2] || sec[1]) : 40;
    return o.series * (travail + o.repos) + 60;
  }
  function validerProgrammeIA(rep, profil, prog) {
    const erreurs = [], corrections = [];
    if (!rep || !Array.isArray(rep.seances)) return { ok: false, erreurs: ['Réponse sans liste de séances.'], corrections, programme: null };
    const par = prog && prog.parametres ? prog.parametres : null;
    if (!par) return { ok: false, erreurs: ['Pas de contraintes calculées par Cap : impossible de vérifier.'], corrections, programme: null };
    const mineur = (num(profil.age) || 30) < 18, niv = T.NIV[profil.niveau] || 1;
    const zones = par.zones; // null = douleur sans zone (impacts exclus)
    if (rep.seances.length > par.joursRetenus) erreurs.push('Trop de séances : ' + rep.seances.length + ' pour ' + par.joursRetenus + ' possibles.');
    const jours = rep.seances.map(s => num(Number(s.jour)));
    if (jours.some(j => j === null || j < 0 || j > 6)) erreurs.push('Jour de séance manquant ou invalide (0 à 6).');
    else if (new Set(jours).size !== jours.length) erreurs.push('Deux séances le même jour.');
    else if (jours.length + (num(profil.autreSport) || 0) > 6) erreurs.push('Aucun jour de repos complet dans la semaine.');
    let totalSemaine = 0;
    const seances = rep.seances.map((s, i) => {
      if (!s.justification || String(s.justification).trim().length < 15) erreurs.push('Séance ' + (s.nom || i + 1) + ' : justification absente.');
      let duree = 6 * 60;
      const ex = (s.exercices || []).map(e => {
        let ref = e.id ? T.PAR_ID[e.id] : null;
        if (e.id && !ref) { erreurs.push('Exercice inconnu de la bibliothèque : « ' + e.id + ' ». Utilise id null pour un exercice hors bibliothèque.'); return null; }
        const pattern = ref ? ref.pattern : e.pattern, mat = ref ? ref.mat : e.materiel, zs = ref ? ref.zones : (Array.isArray(e.zones) ? e.zones : null);
        const nom = ref ? ref.nom : String(e.nom || '').slice(0, 80);
        if (!ref) {
          if (!nom || PATTERNS.indexOf(pattern) < 0 || MATS.indexOf(mat) < 0 || !zs) { erreurs.push('Exercice hors bibliothèque « ' + (nom || '?') + ' » : mouvement, matériel ou zones non renseignés.'); return null; }
        }
        if (par.materiel.indexOf(mat) < 0 || (ref && (ref.requiert || []).some(r => par.materiel.indexOf(r) < 0))) { erreurs.push(nom + ' : matériel non disponible.'); return null; }
        if (zones && zs.some(z => zones.indexOf(z) >= 0)) { erreurs.push(nom + ' : sollicite une zone douloureuse.'); return null; }
        if (zones === null && ((ref && ref.impact) || /saut|sauté|jump|burpee|corde/i.test(nom))) { erreurs.push(nom + ' : impact alors qu’une douleur est déclarée.'); return null; }
        if (ref && ref.niv > niv) { erreurs.push(nom + ' : niveau trop élevé.'); return null; }
        const o = { id: ref ? ref.id : null, nom, pattern, series: num(Number(e.series)), reps: String(e.reps || '').trim(), repos: num(Number(e.repos)), consigne: String(e.consigne || (ref ? ref.consigne : '')).slice(0, 240), alternative: e.alternative ? String(e.alternative).slice(0, 80) : null, raison: String(e.raison || '').slice(0, 200), horsBibliotheque: !ref, type: pattern === 'cardio' ? 'cardio' : pattern === 'core' ? 'core' : 'poly' };
        if (!o.series || o.series < 1 || o.series > 6) { corrections.push(o.nom + ' : séries ramenées dans 1-6.'); o.series = Math.min(6, Math.max(1, o.series || 3)); }
        if (!REPS_OK.test(o.reps)) { erreurs.push(o.nom + ' : répétitions illisibles « ' + o.reps + ' ».'); o.reps = '8-12'; }
        const bas = parseInt(o.reps, 10), enReps = /^\d{1,2}(-\d{1,2})?$/.test(o.reps);
        if (mineur && enReps && bas < 8) { corrections.push(o.nom + ' : moins de 18 ans, minimum 8 répétitions.'); o.reps = '8-12'; }
        else if (niv === 1 && enReps && bas < 6) { corrections.push(o.nom + ' : débutant, minimum 6 répétitions.'); o.reps = '8-12'; }
        if (o.repos === null || o.repos < 0 || o.repos > 300 || (o.repos < 20 && o.type !== 'cardio')) { corrections.push(o.nom + ' : repos ramené dans 20-300 s.'); o.repos = o.type === 'cardio' ? 0 : 90; }
        duree += dureeExercice(o);
        return o;
      }).filter(Boolean);
      if (!ex.length) erreurs.push('Séance ' + (s.nom || i + 1) + ' sans exercice valide.');
      if (duree > par.minutesRetenues * 60 * 1.1) erreurs.push('Séance ' + (s.nom || i + 1) + ' : ' + Math.round(duree / 60) + ' min estimées par Cap pour ' + par.minutesRetenues + ' disponibles.');
      totalSemaine += duree;
      return { cle: String(s.cle || 'S' + (i + 1)).slice(0, 12), jour: jours[i], nom: String(s.nom || 'Séance ' + (i + 1)).slice(0, 60), objectif: String(s.objectif || '').slice(0, 120), justification: String(s.justification || '').slice(0, 600), echauffement: String(s.echauffement || '6 min de mobilité et de cardio léger').slice(0, 200), duree: Math.round(duree / 60), exercices: ex };
    });
    const NOMS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const ok = erreurs.length === 0;
    return {
      ok, erreurs, corrections,
      programme: ok ? {
        ok: true, origine: 'ia_validee', seances, planning: seances.map(s => ({ jour: s.jour, jourNom: NOMS[s.jour], seance: s.cle })).sort((a, b) => ((a.jour + 6) % 7) - ((b.jour + 6) % 7)),
        resume: String(rep.resume || '').slice(0, 600), progression: rep.progression && rep.progression.regle ? String(rep.progression.regle).slice(0, 500) : prog.progression,
        progressionSemaines: Array.isArray(rep.progression && rep.progression.semaines) ? rep.progression.semaines.slice(0, 12).map(x => ({ semaine: num(Number(x.semaine)), consigne: String(x.consigne || '').slice(0, 200) })) : [],
        recuperation: String(rep.recuperation || '').slice(0, 400), changements: (rep.changements || []).slice(0, 10).map(c => String(c && c.raison || '').slice(0, 200)).filter(Boolean),
        notes: prog.notes || [], parametres: par, minutesSemaine: Math.round(totalSemaine / 60), horsBibliotheque: seances.reduce((n, s) => n + s.exercices.filter(e => e.horsBibliotheque).length, 0)
      } : null
    };
  }

  // Recherche de marché sur les activités du catalogue (format V5 phase 1, conservé)
  function validerMarcheIA(rep) {
    const erreurs = [], retenus = [];
    if (!rep || !Array.isArray(rep.activites)) return { ok: false, erreurs: ['Réponse sans liste d’activités.'], activites: [] };
    rep.activites.forEach(a => {
      if (!B.PAR_ID[a.id]) { erreurs.push('Activité inconnue : ' + a.id); return; }
      const faits = [], hyp = (a.hypotheses || []).filter(x => typeof x === 'string').slice(0, 10);
      (a.faits || []).forEach(f => {
        const src = f && f.source;
        if (src && /^https?:\/\/[^\s]+\.[^\s]+/.test(src.url || '') && /^\d{4}-\d{2}(-\d{2})?$/.test(src.date || '')) faits.push({ theme: f.theme, texte: String(f.texte).slice(0, 400), source: { titre: String(src.titre || '').slice(0, 120), url: src.url, date: src.date } });
        else hyp.push(String((f && f.texte) || '').slice(0, 300) + ' (non sourcé)');
      });
      if (/€\s*(par|\/)\s*mois|revenu (de|prévu|garanti)/i.test(JSON.stringify(a.hypotheses || []))) erreurs.push(a.id + ' : revenu prévisionnel fourni par l’IA, ignoré.');
      retenus.push({ id: a.id, faits, hypotheses: hyp });
    });
    return { ok: !erreurs.length || retenus.length > 0, erreurs, activites: retenus };
  }
  // Activités proposées par l'IA → modèles utilisables par CapBusiness (plan, projection, plan d'action calculés par Cap)
  const URL_OK = /^https?:\/\/[^\s]+\.[^\s]+/;
  const bornes = (v, a, b) => { const n = num(Number(v)); return n === null ? null : Math.min(b, Math.max(a, n)); };
  function validerBusinessIA(rep, profil, sourcesAutorisees) {
    const erreurs = [], retenues = [];
    if (!rep || !Array.isArray(rep.opportunites)) return { ok: false, erreurs: ['Réponse sans liste d’activités.'], opportunites: [] };
    const avecWeb = Array.isArray(sourcesAutorisees);
    rep.opportunites.slice(0, 5).forEach((a, i) => {
      const nom = String(a && a.nom || '').slice(0, 80);
      if (!nom || !a.client || !a.offre) { erreurs.push('Activité ' + (i + 1) + ' : nom, client ou offre manquant.'); return; }
      const texte = JSON.stringify(a);
      if (/(chiffre d.affaires|revenu|gagner|gagneras|bénéfice)[^"]{0,40}\d[\d\s]*\s?€/i.test(texte)) erreurs.push(nom + ' : revenu chiffré fourni par l’IA, ignoré (Cap calcule les scénarios).');
      const prix = a.prix || {};
      const m = {
        id: 'ia_' + i + '_' + nom.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').slice(0, 30), ia: true,
        nom, cat: ['web', 'contenu', 'service', 'commerce', 'autre'].indexOf(a.categorie) >= 0 ? a.categorie : 'autre', format: 'mixte',
        client: String(a.client).slice(0, 300), probleme: String(a.probleme || '').slice(0, 300), offre: String(a.offre).slice(0, 300), pourquoiToi: String(a.pourquoiToi || '').slice(0, 400),
        regime: ['vente', 'bic', 'bnc'].indexOf(a.regime) >= 0 ? a.regime : 'bnc', ageMin: bornes(a.ageMin, 16, 25) || 16, diplome: null, reglementation: String(a.reglementation || '').slice(0, 300) || null,
        capital: bornes(a.coutDemarrage, 0, 1e6) || 0, couts: bornes(a.chargesMensuelles, 0, 1e5) || 0, cVar: bornes(a.coutVariableUnitaire, 0, 1e5) || 0,
        mat: [], matIA: (Array.isArray(a.materiel) ? a.materiel : []).slice(0, 8).map(x => ({ nom: String(x.nom || '').slice(0, 60), cout: bornes(x.cout, 0, 1e5) || 0, possede: !!x.possede })),
        prix: [bornes(prix.bas, 1, 1e6), bornes(prix.median, 1, 1e6), bornes(prix.haut, 1, 1e6)], unite: String(a.unite || 'vente').slice(0, 40),
        hU: bornes(a.heuresParUnite, 0.05, 500), hC: bornes(a.heuresProspectionParClient, 0.1, 200), rec: bornes(a.recurrence, 0, 30) || 0, uC: 1,
        comp: {}, requis: [], demande: 2, risque: 2, difficulte: 2, vente: 2, hMin: 2, delaiSem: 3,
        validation: String(a.validation || 'Obtenir 3 demandes réelles avant d’investir.').slice(0, 300),
        concurrents: (a.concurrents || []).slice(0, 6).map(x => String(x).slice(0, 120)), demandeTexte: String(a.demande || '').slice(0, 400),
        risquesIA: (a.risques || []).slice(0, 6).map(x => String(x).slice(0, 200)), faits: [], hypotheses: (a.hypotheses || []).filter(x => typeof x === 'string').slice(0, 10).map(x => x.slice(0, 300))
      };
      if (m.prix.some(x => x === null) || !(m.prix[0] <= m.prix[1] && m.prix[1] <= m.prix[2])) { erreurs.push(nom + ' : prix bas / médian / haut manquants ou incohérents.'); return; }
      if (!m.hU || !m.hC) { erreurs.push(nom + ' : heures par unité ou de prospection manquantes.'); return; }
      (a.faits || []).forEach(f => {
        const src = f && f.source;
        const sourceOk = avecWeb && src && URL_OK.test(src.url || '') && sourcesAutorisees.some(u => String(src.url).split('#')[0] === String(u).split('#')[0]);
        if (sourceOk) m.faits.push({ theme: f.theme, texte: String(f.texte).slice(0, 400), source: { titre: String(src.titre || '').slice(0, 120), url: src.url, date: String(src.date || '').slice(0, 10) } });
        else m.hypotheses.push(String((f && f.texte) || '').slice(0, 300) + (avecWeb ? ' (source non retrouvée dans la recherche)' : ' (non vérifié : pas de recherche web)'));
      });
      // Matériel : ajouté au budget s'il n'est pas possédé (même règle que le catalogue)
      m.coutMaterielIA = m.matIA.filter(x => !x.possede).reduce((s, x) => s + x.cout, 0);
      m.capital += m.coutMaterielIA;
      const ev = B.evaluer(m, profil);
      retenues.push(Object.assign(m, { statut: ev.statut, raisons: ev.raisons, budget: ev.budget }));
    });
    return { ok: retenues.length > 0, erreurs, opportunites: retenues, mode: avecWeb ? 'web' : 'sans_web' };
  }
  // Questions complémentaires : 3 au maximum, justifiées ; variable connue du registre ou nouvelle question libre
  function validerQuestionsIA(liste, matrice, profil) {
    const champs = {}; (matrice || []).forEach(q => { champs[q.variable] = q; });
    const ok = [], refus = [], vus = {};
    (Array.isArray(liste) ? liste : []).forEach(q => {
      if (ok.length >= 3) { refus.push({ q, raison: 'Plus de 3 questions.' }); return; }
      if (!q || !q.raison || String(q.raison).length < 10) { refus.push({ q, raison: 'Question non justifiée.' }); return; }
      if (q.champ && !champs[q.champ]) { refus.push({ q, raison: 'Champ inconnu : la question n’aurait aucune conséquence.' }); return; }
      if (q.champ && profil && profil[q.champ] !== undefined && profil[q.champ] !== null && !(Array.isArray(profil[q.champ]) && !profil[q.champ].length)) { refus.push({ q, raison: 'Déjà renseigné.' }); return; }
      const id = q.champ || String(q.id || '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30);
      if (!id || vus[id]) { refus.push({ q, raison: 'Identifiant manquant ou en double.' }); return; }
      if (!q.champ && (!q.question || String(q.question).length < 8)) { refus.push({ q, raison: 'Question vide.' }); return; }
      if (!q.champ && profil && profil.complements && profil.complements[id]) { refus.push({ q, raison: 'Déjà posée.' }); return; }
      vus[id] = 1;
      ok.push({ champ: q.champ || null, id, texte: q.champ ? champs[q.champ].texte : String(q.question).slice(0, 200), type: ['texte', 'nombre', 'choix'].indexOf(q.type) >= 0 ? q.type : 'texte', options: Array.isArray(q.options) ? q.options.slice(0, 6).map(x => String(x).slice(0, 60)) : [], raison: String(q.raison).slice(0, 200), module: ['corps', 'argent', 'entreprise'].indexOf(q.module) >= 0 ? q.module : 'corps' });
    });
    return { questions: ok, refus };
  }
  function validerPourquoi(rep) {
    if (!rep || typeof rep.reponse !== 'string' || rep.reponse.length < 20) return { ok: false, erreurs: ['Réponse vide.'] };
    return { ok: true, reponse: rep.reponse.slice(0, 1500), citees: (rep.reponsesCitees || []).slice(0, 8).map(x => String(x).slice(0, 120)) };
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
  return { statutIA, CHAMPS_PROGRAMME, entrees, changements, demandeProgramme, demandeMarche, demandeQuestions, validerProgrammeIA, validerMarcheIA, validerBusinessIA, validerQuestionsIA, validerPourquoi, contexteCoach, expliquerSansIA, dureeExercice };
});
