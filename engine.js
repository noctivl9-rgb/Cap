/* Cap — moteur de calcul déterministe.
 * Toutes les formules, seuils et données externes sont ici, et nulle part ailleurs.
 * Aucune fonction ne touche au DOM : le fichier est testé tel quel sous Node (tests.js). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CapEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------------------------------------------------------------- Références externes (datées)
  const REF = {
    date: '09/11/2026',
    eurAed: 4.10, // FxFeed, 09/11/2026 : 1 EUR = 4,1011 AED
    sources: {
      change: 'FxFeed.io, EUR/AED, 09/11/2026',
      urus: 'Dubicars, Urus Performante neuve, 1 200 000 AED, 09/11/2026',
      appart: 'Annonces Property Finder Dubai Marina, 1 chambre, nov. 2026 (fourchette large ±20 %)',
      loyer: 'DubaiInvest, loyer 1 chambre Dubai Marina 80 000-110 000 AED/an, 2026',
      credit: 'Real Estate Club Dubai, règles LTV 2026 : 80 % résident expatrié, 50-60 % non-résident ; frais d’achat ≈ 7 %'
    }
  };
  const SEUILS = {
    kcalParKg: 7700,          // énergie approximative d'1 kg de masse grasse
    ageMin: 13,
    perteRecAdulte: 0.005,    // 0,5 % du poids / semaine
    perteMaxAdulte: 0.01,     // 1 % du poids / semaine, plafonné à 1 kg
    perteMaxAdulteAbs: 1.0,
    perteRecMineur: 0.25,     // kg / semaine
    perteMaxMineur: 0.4,
    priseRecAdulte: 0.25, priseMaxAdulte: 0.35,
    priseRecMineur: 0.15, priseMaxMineur: 0.25,
    deficitMaxMineur: 450,    // kcal / jour
    plancher: { mineurH: 2000, mineurF: 1700, adulteH: 1500, adulteF: 1200 },
    imcBas: 18.5,
    poidsMinAbsolu: 35,
    perteSuiviMedicalAdulte: 0.25, // > 25 % du poids : suivi médical recommandé
    perteSuiviMedicalMineur: 0.10,
    perteDangereuse: 0.40,
    palBase: { assis: 1.35, mixte: 1.5, physique: 1.65 },
    metNet: { muscu: 4, autre: 6 }, // MET nets (au-dessus du repos)
    dureeAutreSportH: 1.5,
    coussinMois: 3,
    coussinMineur: 500,
    partVoitureMax: 0.15,     // repère courant : coût total voiture ≤ 15 % des revenus nets
    partLoyerMax: 0.33
  };

  const round = (v, d = 0) => { const k = Math.pow(10, d); return Math.round(v * k) / k; };
  const round10 = v => Math.round(v / 10) * 10;
  const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;
  const has = v => v !== undefined && v !== null && v !== '' && !(typeof v === 'number' && !isFinite(v));
  const eur = v => Math.round(v).toLocaleString('fr-FR') + ' €';
  const kgf = v => round(v, 1).toFixed(1).replace('.', ',') + ' kg';

  // ---------------------------------------------------------------- Validation des saisies
  const BORNES = {
    age: [10, 100], taille: [120, 230], poids: [30, 300], cible: [30, 300], tour: [40, 200],
    tempsLibre: [0, 100], heuresProjet: [0, 100], jours: [0, 7], minutes: [10, 180], autreSport: [0, 14],
    revenus: [0, 1e7], fixes: [0, 1e7], variables: [0, 1e7], remboursements: [0, 1e7], epargne: [-1e7, 1e9],
    reveMontant: [1, 1e9], reveAnnee: [2026, 2080], revenuVise: [0, 1e7]
  };
  function valider(champ, v) {
    const b = BORNES[champ];
    if (!b) return null;
    if (!has(v)) return null;
    if (typeof v !== 'number' || !isFinite(v)) return 'Entre un nombre.';
    if (v < b[0] || v > b[1]) return 'Valeur attendue entre ' + b[0].toLocaleString('fr-FR') + ' et ' + b[1].toLocaleString('fr-FR') + '.';
    return null;
  }

  // ---------------------------------------------------------------- Physique
  function imcCategorie(imc) {
    if (imc < 18.5) return 'insuffisance pondérale';
    if (imc < 25) return 'corpulence normale';
    if (imc < 30) return 'surpoids';
    if (imc < 35) return 'obésité modérée';
    if (imc < 40) return 'obésité sévère';
    return 'obésité massive';
  }
  function metabolismeBase(p) {
    const mineur = p.age < 18;
    if (mineur) {
      // Schofield (OMS/FAO 1985), 10-17 ans
      const v = p.sexe === 'F' ? 13.384 * p.poids + 692.6 : 17.686 * p.poids + 658.2;
      return { valeur: v, methode: 'Schofield (OMS) 10-17 ans : ' + (p.sexe === 'F' ? '13,384 × poids + 692,6' : '17,686 × poids + 658,2') };
    }
    const v = 10 * p.poids + 6.25 * p.taille - 5 * p.age + (p.sexe === 'F' ? -161 : 5);
    return { valeur: v, methode: 'Mifflin-St Jeor : 10 × poids + 6,25 × taille − 5 × âge ' + (p.sexe === 'F' ? '− 161' : '+ 5') };
  }
  function limitesRythme(p, sens) {
    const mineur = p.age < 18;
    if (sens < 0) {
      if (mineur) return { rec: Math.min(SEUILS.perteRecMineur, 0.004 * p.poids), max: Math.min(SEUILS.perteMaxMineur, 0.006 * p.poids) };
      return { rec: Math.min(0.75, SEUILS.perteRecAdulte * p.poids), max: Math.min(SEUILS.perteMaxAdulteAbs, SEUILS.perteMaxAdulte * p.poids) };
    }
    if (mineur) return { rec: SEUILS.priseRecMineur, max: SEUILS.priseMaxMineur };
    return { rec: SEUILS.priseRecAdulte, max: SEUILS.priseMaxAdulte };
  }

  function physique(p) {
    const manquants = ['age', 'sexe', 'taille', 'poids', 'objectif', 'activite'].filter(k => !has(p[k]));
    if (p.objectif && p.objectif !== 'maintenir' && !has(p.cible)) manquants.push('cible');
    if (manquants.length) return { ok: false, manquants, message: 'Il manque des informations pour estimer tes besoins : ' + manquants.join(', ') + '.' };
    if (p.age < SEUILS.ageMin) return { ok: false, manquants: [], bloque: true, message: 'Les calculs de Cap sont prévus à partir de 13 ans. Pour un objectif de poids, parles-en avec ton médecin.' };

    const mineur = p.age < 18;
    const h = p.taille / 100;
    const imc = p.poids / (h * h);
    const imcNote = mineur
      ? 'Avant 18 ans, l’IMC se lit sur des courbes par âge et par sexe (carnet de santé). Les seuils adultes ne s’appliquent pas.'
      : 'Catégorie OMS : ' + imcCategorie(imc) + '. L’IMC ne distingue pas muscle et graisse : le tour de taille complète l’information.';
    const bmr = metabolismeBase(p);
    const pal = SEUILS.palBase[p.activite] || SEUILS.palBase.mixte;
    const hMuscu = (num(p.jours) || 0) * (num(p.minutes) || 0) / 60;
    const hAutre = (num(p.autreSport) || 0) * SEUILS.dureeAutreSportH;
    const sportKcal = (SEUILS.metNet.muscu * p.poids * hMuscu + SEUILS.metNet.autre * p.poids * hAutre) / 7;
    const tdee = bmr.valeur * pal + sportKcal;

    const objectif = p.objectif;
    const cible = objectif === 'maintenir' ? p.poids : p.cible;
    const ecart = cible - p.poids;
    const sens = Math.sign(ecart);
    const imcCible = cible / (h * h);
    const lim = sens === 0 ? { rec: 0, max: 0 } : limitesRythme(p, sens);
    const ecartPct = Math.abs(ecart) / p.poids;

    let statut = 'maintien', requis = null, alertes = [];
    const semDelai = num(p.delaiSem);
    if (objectif !== 'maintenir' && sens !== 0) {
      if (objectif === 'perdre' && sens > 0) alertes.push('incoherent_sens');
      if (objectif === 'prendre' && sens < 0) alertes.push('incoherent_sens');
      requis = semDelai ? Math.abs(ecart) / semDelai : null;
      if (requis === null) statut = 'libre';
      else if (requis <= lim.rec + 1e-9) statut = 'realiste';
      else if (requis <= lim.max + 1e-9) statut = 'ambitieux';
      else statut = 'trop_court';
      if (sens < 0) {
        const dangereux = cible < SEUILS.poidsMinAbsolu || imcCible < 16 || ecartPct >= SEUILS.perteDangereuse || imc < SEUILS.imcBas;
        const sousPoids = imcCible < SEUILS.imcBas;
        if (dangereux) statut = 'dangereux';
        else if (sousPoids) statut = 'medical';
        else if (ecartPct > (mineur ? SEUILS.perteSuiviMedicalMineur : SEUILS.perteSuiviMedicalAdulte)) alertes.push('suivi_medical');
      }
    } else if (objectif !== 'maintenir' && sens === 0) {
      statut = 'maintien';
    }

    const planPossible = !(statut === 'dangereux' || statut === 'medical');
    // Rythme : choix de l'utilisateur, sinon recommandé ; jamais au-delà du max (signalé, pas silencieux).
    let rythme = 0, rythmePlafonne = false;
    if (planPossible && sens !== 0 && objectif !== 'maintenir') {
      rythme = num(p.rythme) || lim.rec;
      if (rythme > lim.max + 1e-9) { rythme = lim.max; rythmePlafonne = true; }
    }
    let ecartKcal = sens * rythme * SEUILS.kcalParKg / 7;
    if (mineur && ecartKcal < -SEUILS.deficitMaxMineur) ecartKcal = -SEUILS.deficitMaxMineur;
    const plancher = Math.max(bmr.valeur, mineur ? (p.sexe === 'F' ? SEUILS.plancher.mineurF : SEUILS.plancher.mineurH) : (p.sexe === 'F' ? SEUILS.plancher.adulteF : SEUILS.plancher.adulteH));
    let kcal = tdee + ecartKcal;
    let plancherAtteint = false;
    if (kcal < plancher) { kcal = plancher; plancherAtteint = true; }
    kcal = round10(kcal);
    const rythmeEffectif = Math.abs(kcal - tdee) * 7 / SEUILS.kcalParKg * (sens || 0);
    const semaines = rythme > 0 && Math.abs(rythmeEffectif) > 0.01 ? Math.ceil(Math.abs(ecart) / Math.abs(rythmeEffectif)) : null;

    // Macros
    const poidsRef = imc > 30 ? 25 * h * h : p.poids;
    const protG = Math.round((objectif === 'maintenir' ? 1.6 : 1.8) * poidsRef);
    let lipG = Math.max(Math.round(0.8 * poidsRef), Math.round(kcal * 0.25 / 9));
    let gluG = Math.round((kcal - protG * 4 - lipG * 9) / 4);
    if (gluG < 100) { lipG = Math.round(0.6 * poidsRef); gluG = Math.max(0, Math.round((kcal - protG * 4 - lipG * 9) / 4)); }

    // Étapes intermédiaires : toutes les 4 semaines, plafonnées à la cible
    const etapes = [];
    if (semaines) {
      for (let w = 4; w < semaines + 4 && etapes.length < 26; w += 4) {
        const v = p.poids + rythmeEffectif * Math.min(w, semaines);
        etapes.push({ semaine: Math.min(w, semaines), poids: round(sens < 0 ? Math.max(cible, v) : Math.min(cible, v), 1) });
        if (w >= semaines) break;
      }
    }
    const intermediaire = sens < 0 && planPossible && objectif === 'perdre'
      ? { poids: round(Math.max(cible, p.poids * 0.95), 1), texte: 'Premier palier : −5 % de ton poids, soit ' + kgf(Math.max(cible, p.poids * 0.95)) }
      : (etapes[0] ? { poids: etapes[0].poids, texte: 'Premier palier : ' + kgf(etapes[0].poids) + ' en 4 semaines' } : null);

    const calcul = [
      'Métabolisme de base : ' + bmr.methode + ' = ' + Math.round(bmr.valeur) + ' kcal.',
      'Activité quotidienne (' + p.activite + ') : × ' + pal.toFixed(2).replace('.', ',') + ' = ' + Math.round(bmr.valeur * pal) + ' kcal.',
      'Sport : ' + round(hMuscu, 1) + ' h de muscu + ' + round(hAutre, 1) + ' h d’autre sport par semaine ≈ +' + Math.round(sportKcal) + ' kcal/jour (MET nets 4 et 6).',
      'Dépense estimée : ' + Math.round(tdee) + ' kcal/jour (précision ±10 % : seule ta courbe de poids la confirme).',
      rythme ? ('Rythme ' + (sens < 0 ? 'de perte' : 'de prise') + ' : ' + round(rythme, 2) + ' kg/sem × 7 700 kcal ÷ 7 = ' + Math.round(Math.abs(sens * rythme * SEUILS.kcalParKg / 7)) + ' kcal/jour.') : 'Pas d’écart calorique : objectif de maintien.',
      (mineur ? 'Moins de 18 ans : écart plafonné à ' + SEUILS.deficitMaxMineur + ' kcal/jour pour protéger la croissance. ' : '') + 'Minimum appliqué : ' + Math.round(plancher) + ' kcal/jour.' + (plancherAtteint ? ' Il est atteint : le rythme réel sera plus lent.' : ''),
      'Protéines : ' + (objectif === 'maintenir' ? '1,6' : '1,8') + ' g × ' + round(poidsRef, 1) + ' kg' + (imc > 30 ? ' (poids de référence à IMC 25)' : '') + '. Lipides ≥ 25 % des calories. Glucides : le reste.'
    ];

    return {
      ok: true, mineur, imc: round(imc, 1), imcNote, imcCible: round(imcCible, 1),
      bmr: Math.round(bmr.valeur), bmrMethode: bmr.methode, pal, sportKcal: Math.round(sportKcal), tdee: Math.round(tdee),
      kcal, macros: { prot: protG, lip: lipG, glu: gluG }, plancher: Math.round(plancher), plancherAtteint,
      objectif, cible, ecart: round(ecart, 1), ecartPct: round(ecartPct, 3), statut, alertes, planPossible,
      requis: requis === null ? null : round(requis, 2), rec: round(lim.rec, 2), max: round(lim.max, 2),
      rythme: round(rythme, 2), rythmeEffectif: round(rythmeEffectif, 2), rythmePlafonne, semaines, etapes, intermediaire, calcul
    };
  }

  // ---------------------------------------------------------------- Programme sportif
  const EX = {
    squat: ['Squat barre', 'Squat gobelet (sac à dos lesté)', 'Presse à cuisses', 'poly'],
    bench: ['Développé couché', 'Pompes', 'Développé haltères', 'poly'],
    row: ['Rowing barre', 'Rowing sous une table', 'Tirage horizontal à la poulie', 'poly'],
    ohp: ['Développé militaire haltères', 'Pompes piquées', 'Développé épaules machine', 'poly'],
    rdl: ['Soulevé de terre roumain', 'Soulevé de terre roumain sac à dos', 'Hip thrust', 'poly'],
    pulldown: ['Tirage vertical', 'Tractions avec élastique', 'Tractions', 'poly'],
    lunge: ['Fentes marchées', 'Fentes arrière', 'Step-up sur banc', 'poly'],
    incline: ['Développé incliné haltères', 'Pompes pieds surélevés', 'Écarté à la poulie', 'poly'],
    legcurl: ['Leg curl', 'Leg curl au sol (serviette)', 'Soulevé de terre roumain une jambe', 'iso'],
    lateral: ['Élévations latérales', 'Élévations latérales avec bouteilles', 'Élévations à la poulie', 'iso'],
    curl: ['Curl haltères', 'Curl sac à dos', 'Curl marteau', 'iso'],
    triceps: ['Extension triceps à la poulie', 'Dips sur chaise', 'Barre au front', 'iso'],
    calf: ['Mollets debout', 'Mollets sur une marche', 'Mollets assis', 'iso'],
    plank: ['Gainage', 'Gainage', 'Gainage latéral', 'core']
  };
  const MODELES = {
    FA: ['Corps complet A', 'Force de base sur tout le corps', ['squat', 'bench', 'row', 'ohp', 'plank', 'curl', 'calf']],
    FB: ['Corps complet B', 'Chaîne arrière et tirage', ['rdl', 'pulldown', 'incline', 'lunge', 'lateral', 'triceps', 'plank']],
    FC: ['Corps complet C', 'Équilibre et unilatéral', ['lunge', 'bench', 'pulldown', 'rdl', 'lateral', 'curl', 'plank']],
    H1: ['Haut du corps A', 'Poussée et tirage horizontaux', ['bench', 'row', 'ohp', 'pulldown', 'lateral', 'curl', 'triceps']],
    H2: ['Haut du corps B', 'Poussée et tirage verticaux', ['incline', 'pulldown', 'ohp', 'row', 'lateral', 'triceps', 'curl']],
    B1: ['Bas du corps A', 'Quadriceps et fessiers', ['squat', 'rdl', 'lunge', 'legcurl', 'calf', 'plank']],
    B2: ['Bas du corps B', 'Ischios et fessiers', ['rdl', 'squat', 'lunge', 'legcurl', 'calf', 'plank']],
    PU: ['Poussée', 'Pectoraux, épaules, triceps', ['bench', 'ohp', 'incline', 'lateral', 'triceps', 'plank']],
    PL: ['Tirage', 'Dos, biceps, ischios', ['pulldown', 'row', 'rdl', 'curl', 'legcurl', 'plank']],
    JA: ['Jambes', 'Quadriceps, fessiers, mollets', ['squat', 'lunge', 'legcurl', 'calf', 'plank', 'rdl']]
  };
  const SPLITS = { 1: ['FA'], 2: ['FA', 'FB'], 3: ['FA', 'FB', 'FC'], 4: ['H1', 'B1', 'H2', 'B2'], 5: ['PU', 'PL', 'JA', 'H1', 'B1'], 6: ['PU', 'PL', 'JA', 'PU', 'PL', 'JA'], 7: ['PU', 'PL', 'JA', 'PU', 'PL', 'JA'] };
  const JOURS_SEMAINE = { 1: [3], 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6] };
  const NOMS_JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  function programme(p) {
    const jours = num(p.jours) || 0, minutes = num(p.minutes) || 0;
    if (!has(p.niveau) || !has(p.lieu) || !has(p.jours) || (jours > 0 && !minutes)) return { ok: false, manquants: ['niveau', 'lieu', 'jours', 'minutes'].filter(k => !has(p[k])), seances: [] };
    if (jours === 0) return { ok: true, seances: [], planning: [], note: 'Aucune séance de musculation prévue. Base de départ : 7 000 à 10 000 pas par jour.' };
    const debutant = p.niveau === 'debutant';
    const muscu = debutant ? Math.min(jours, 4) : Math.min(jours, 6);
    const cardio = jours - muscu;
    const split = SPLITS[muscu];
    const maison = p.lieu === 'maison';
    const mineur = (num(p.age) || 30) < 18;
    const prise = p.objectif === 'prendre';
    const series = { debutant: { poly: 3, iso: 2, core: 2 }, intermediaire: { poly: 3, iso: 3, core: 3 }, avance: { poly: 4, iso: 3, core: 3 } }[p.niveau] || { poly: 3, iso: 2, core: 2 };
    const reps = { poly: mineur ? '10-15' : (prise ? '6-10' : '8-12'), iso: '10-15', core: '30-45 s' };
    const repos = { poly: debutant ? 90 : 120, iso: 60, core: 45 };
    const echauffement = 5;
    const dureeExo = (k, s) => s * (40 + repos[k]) + 60; // secondes : travail + repos + installation

    const seances = split.map((key, i) => {
      const [nom, objectif, ids] = MODELES[key];
      const ex = [];
      let total = echauffement * 60;
      for (const id of ids) {
        const e = EX[id]; const kind = e[3];
        let s = series[kind];
        let d = dureeExo(kind, s);
        if (total + d > minutes * 60 && ex.length < 2) { s = Math.max(2, s - 1); d = dureeExo(kind, s); }
        if (total + d > minutes * 60 && ex.length >= 2) break;
        total += d;
        ex.push({ id, nom: maison ? e[1] : e[0], alternative: maison ? (e[2] === e[1] ? e[0] : e[2]) : e[2], series: s, reps: reps[kind], repos: repos[kind], type: kind });
      }
      return { cle: key + (i >= 3 && split.indexOf(key) < i ? '2' : ''), modele: key, nom, objectif, duree: Math.round(total / 60), niveau: p.niveau, echauffement: echauffement + ' min : 3 min de cardio léger, puis 2 séries légères du premier exercice', exercices: ex };
    });
    for (let i = 0; i < cardio; i++) seances.push({ cle: 'C' + (i + 1), modele: 'C', nom: 'Cardio doux', objectif: 'Récupération active et dépense', duree: Math.min(minutes, 40), niveau: p.niveau, echauffement: 'Aucun', exercices: [{ id: 'marche', nom: 'Marche rapide ou vélo', alternative: 'Corde à sauter par blocs', series: 1, reps: Math.min(minutes, 40) + ' min', repos: 0, type: 'cardio' }] });
    const jsem = JOURS_SEMAINE[jours];
    const planning = seances.map((s, i) => ({ jour: jsem[i], jourNom: NOMS_JOURS[jsem[i]], seance: s.cle }));
    const progression = 'Double progression : quand tu atteins le haut de la fourchette de répétitions sur toutes les séries en gardant 2 répétitions en réserve, augmente la charge de 2,5 kg (ou passe à une variante plus difficile à la maison).' + (mineur ? ' Avant 18 ans : pas de charge maximale, la technique passe avant le poids.' : '');
    const notes = [];
    if (debutant && jours > 4) notes.push('Débutant : ' + muscu + ' séances de musculation maximum, les ' + cardio + ' autres jours deviennent du cardio doux. La récupération fait progresser autant que l’entraînement.');
    if ((p.contraintes || []).indexOf('douleur') >= 0) notes.push('Douleur ou blessure déclarée : saute tout exercice qui fait mal et fais valider le programme par un kiné ou un médecin.');
    if ((p.contraintes || []).indexOf('sante') >= 0) notes.push('Problème de santé suivi : demande l’accord de ton médecin avant de commencer.');
    return { ok: true, seances, planning, progression, notes };
  }

  // Adaptation à partir des séances réellement enregistrées
  function adaptation(prog, logs, aujourdhui, depuis) {
    if (!prog || !prog.ok || !prog.seances.length) return { prevues: 0, faites: 0, taux: null, conseil: null };
    const fin = new Date(aujourdhui); const debut = new Date(fin); debut.setDate(debut.getDate() - 13);
    const start = depuis && new Date(depuis) > debut ? new Date(depuis) : debut;
    const joursPlan = prog.planning.map(x => x.jour);
    let prevues = 0;
    for (let d = new Date(start); d <= fin; d.setDate(d.getDate() + 1)) if (joursPlan.indexOf(d.getDay()) >= 0) prevues++;
    const recents = (logs || []).filter(l => new Date(l.date) >= start && new Date(l.date) <= fin);
    const faites = recents.length;
    const taux = prevues ? Math.min(1, faites / prevues) : null;
    const ress = recents.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map(l => l.ressenti);
    let conseil = null;
    if (prevues >= 3 && taux !== null && taux < 0.5) conseil = 'Tu as fait ' + faites + ' séance' + (faites > 1 ? 's' : '') + ' sur ' + prevues + ' prévues en 2 semaines. Réduire d’une séance par semaine rendra le programme plus tenable.';
    else if (ress.length >= 2 && ress.slice(0, 2).every(r => r === 'facile')) conseil = 'Tes deux dernières séances étaient faciles : ajoute 2,5 kg ou une série sur les exercices principaux.';
    else if (ress.length >= 2 && ress.slice(0, 2).every(r => r === 'dur')) conseil = 'Tes deux dernières séances étaient très dures : retire une série par exercice cette semaine.';
    return { prevues, faites, taux, conseil };
  }

  // ---------------------------------------------------------------- Finances
  function annuite(capital, tauxAnnuel, annees) {
    const r = tauxAnnuel / 12, n = annees * 12;
    return capital * r / (1 - Math.pow(1 + r, -n));
  }
  function coutReve(reve, montant) {
    const a = v => v / REF.eurAed;
    if (reve === 'appart') {
      const prix = a(1800000), frais = prix * 0.07, apport = prix * 0.20, pret = prix - apport;
      const mens = annuite(pret, 0.045, 25);
      return {
        label: 'Appartement 1 chambre à Dubai Marina', total: prix + frais, etape: apport + frais, etapeLabel: 'Apport (20 %) + frais d’achat',
        lignes: [
          ['Prix estimé (1,8 M AED)', prix, REF.sources.appart, 'moyenne'],
          ['Frais d’achat ≈ 7 % (taxe DLD 4 %, agence 2 %, dossier)', frais, REF.sources.credit, 'moyenne'],
          ['Apport minimum résident expatrié (20 %)', apport, REF.sources.credit, 'moyenne'],
          ['Mensualité estimée du crédit (80 %, 25 ans, 4,5 %)', mens, 'Calcul d’annuité, taux supposé 4,5 %', 'faible']
        ],
        revenuNecessaire: mens / 0.5, revenuNote: 'Les banques limitent en général les remboursements à 50 % des revenus.',
        note: 'Non-résident : apport de 40 à 50 % au lieu de 20 %.'
      };
    }
    if (reve === 'vivre') {
      const loyer = a(95000) / 12, autres = 1200, mensuel = loyer + autres;
      const installation = loyer * 12 * 0.10 + 3000 + 2000, coussin = mensuel * 6;
      return {
        label: 'Vivre à Dubaï (seul, 1 chambre à Dubai Marina)', total: installation + coussin, etape: installation + coussin, etapeLabel: 'Installation + 6 mois de réserve',
        lignes: [
          ['Loyer (95 000 AED/an)', loyer, REF.sources.loyer + ' — par mois', 'moyenne'],
          ['Courses, transport, téléphone, assurance santé obligatoire', autres, 'Hypothèse — par mois', 'faible'],
          ['Installation : caution + agence (10 % du loyer annuel), déménagement, visa', installation, 'Hypothèse', 'faible'],
          ['Réserve de sécurité : 6 mois de dépenses', coussin, 'Repère de prudence', 'moyenne']
        ],
        mensuel, revenuNecessaire: loyer / SEUILS.partLoyerMax, revenuNote: 'Repère : le loyer ne dépasse pas un tiers des revenus nets.',
        note: 'Il faut aussi un droit de résidence : contrat de travail, permis freelance, société ou visa par l’achat d’un bien.'
      };
    }
    if (reve === 'urus') {
      const prix = a(1200000), assurance = prix * 0.03, entretien = 6000, carburant = 4000, divers = 1000, deprec = prix * 0.12;
      const annuel = assurance + entretien + carburant + divers + deprec;
      return {
        label: 'Lamborghini Urus Performante', total: prix, etape: prix * 0.25, etapeLabel: '25 % du prix',
        lignes: [
          ['Prix (1,2 M AED)', prix, REF.sources.urus, 'moyenne'],
          ['Assurance ≈ 3 % de la valeur / an', assurance, 'Hypothèse', 'faible'],
          ['Entretien / an', entretien, 'Hypothèse', 'faible'],
          ['Carburant / an', carburant, 'Hypothèse (≈ 15 000 km)', 'faible'],
          ['Perte de valeur ≈ 12 % / an', deprec, 'Hypothèse', 'faible']
        ],
        annuel, revenuNecessaire: annuel / SEUILS.partVoitureMax / 12, revenuNote: 'Repère courant : le coût total d’une voiture (perte de valeur comprise) ne dépasse pas 15 % des revenus nets.',
        note: 'Modèle arrêté en 2024 : achat d’occasion.'
      };
    }
    if (reve === 'appart_urus') {
      const x = coutReve('appart'), y = coutReve('urus');
      return { label: 'Appartement + Urus', total: x.total + y.total, etape: x.etape, etapeLabel: 'D’abord l’apport de l’appartement', lignes: x.lignes.concat(y.lignes), annuel: y.annuel, revenuNecessaire: Math.max(x.revenuNecessaire, y.revenuNecessaire), revenuNote: y.revenuNote, note: 'L’appartement d’abord : il se loue ou se revend. La voiture perd de la valeur chaque année.' };
    }
    const m = num(montant) || 0;
    return { label: 'Mon objectif', total: m, etape: m * 0.25, etapeLabel: '25 % de l’objectif', lignes: [['Montant choisi', m, 'Ta saisie', 'haute']], revenuNecessaire: null };
  }
  function moisRestants(annee, aujourdhui) {
    const d = new Date(aujourdhui);
    return Math.max(1, (annee - d.getFullYear()) * 12 + (12 - d.getMonth()));
  }
  function finances(p, mouvements, aujourdhui) {
    const manquants = ['revenus', 'fixes', 'variables', 'epargne', 'reve', 'reveAnnee'].filter(k => !has(p[k]));
    if (p.reve === 'autre' && !has(p.reveMontant)) manquants.push('reveMontant');
    if (manquants.length) return { ok: false, manquants, message: 'Il manque des informations pour calculer ta capacité d’épargne.' };
    const rembours = num(p.remboursements) || 0;
    const depenses = p.fixes + p.variables + rembours;
    const capacite = p.revenus - depenses;
    const reel = (mouvements || []).reduce((s, m) => s + (num(m.montant) || 0), 0);
    const actuelle = p.epargne + reel;
    const statut = capacite < 0 ? 'deficit' : capacite === 0 ? 'nulle' : 'positive';
    const reve = coutReve(p.reve, p.reveMontant);
    const reste = Math.max(0, reve.total - actuelle);
    const mois = moisRestants(p.reveAnnee, aujourdhui);
    const requisMensuel = reste / mois;
    const moisAuRythme = capacite > 0 ? reste / capacite : null;
    let faisabilite;
    if (reste === 0) faisabilite = 'atteint';
    else if (capacite <= 0) faisabilite = 'impossible_en_l_etat';
    else if (requisMensuel <= capacite) faisabilite = 'atteignable';
    else faisabilite = 'ecart';
    const coussin = depenses > 0 ? depenses * SEUILS.coussinMois : SEUILS.coussinMineur;
    const coussinHyp = !(depenses > 0);
    const hyp = num(p.revenuVise) && p.revenuVise > p.revenus ? { revenu: p.revenuVise, capacite: p.revenuVise - depenses, mois: (p.revenuVise - depenses) > 0 ? reste / (p.revenuVise - depenses) : null } : null;
    const voitureSoutenable = reve.annuel ? (p.revenus * 12 * SEUILS.partVoitureMax >= reve.annuel) : null;

    // Trois niveaux d'objectifs
    const niveaux = {
      reve: { titre: reve.label, montant: reve.total, texte: 'Coût estimé : ' + eur(reve.total) + ' (prix du ' + REF.date + ').' },
      intermediaire: actuelle < coussin
        ? { titre: 'Réserve de sécurité', montant: coussin, texte: coussinHyp ? 'Sans dépenses déclarées, on vise une première réserve de ' + eur(coussin) + ' (repère choisi par Cap).' : '3 mois de dépenses : ' + eur(coussin) + '. Elle passe avant tout projet.' }
        : { titre: reve.etapeLabel, montant: reve.etape, texte: eur(reve.etape) + ' : première grande étape vers ton rêve.' },
      action: null
    };
    const age = num(p.age);
    let action;
    if (statut === 'deficit') action = 'Note toutes tes dépenses de ce mois-ci et repère les 3 postes à réduire. Tu dépenses ' + eur(-capacite) + ' de plus que tu ne gagnes.';
    else if (statut === 'nulle' && age !== null && age < 16) action = 'Avant 16 ans, ton capital est ta compétence : consacre tes ' + (num(p.heuresProjet) || 0) + ' h de la semaine à finir un projet que tu peux montrer.';
    else if (statut === 'nulle') action = 'Ta capacité d’épargne est de 0 €. Prochaine action : trouver un premier revenu ou réduire une dépense, même de 20 €.';
    else action = 'Mets ' + eur(capacite) + ' de côté dès que ton argent arrive, avant de dépenser (virement automatique si possible).';
    niveaux.action = { titre: 'Prochaine action', texte: action };

    const notesLegales = [];
    if (age !== null && age < 18) {
      notesLegales.push(age < 16 ? 'Avant 16 ans : pas de micro-entreprise. Jobs déclarés possibles dès 14 ans pendant les vacances (la moitié des vacances maximum), avec l’accord des parents.' : 'À partir de 16 ans : micro-entreprise possible avec l’autorisation des parents.');
      notesLegales.push('Pas de trading ni de plateforme crypto : elles sont réservées aux majeurs.');
    }

    const calcul = [
      'Capacité d’épargne = revenus nets (' + eur(p.revenus) + ') − dépenses fixes (' + eur(p.fixes) + ') − variables (' + eur(p.variables) + ') − remboursements (' + eur(rembours) + ') = ' + eur(capacite) + ' / mois.',
      'Épargne actuelle = départ (' + eur(p.epargne) + ') + mouvements enregistrés (' + eur(reel) + ') = ' + eur(actuelle) + '.',
      'Reste à réunir = ' + eur(reve.total) + ' − ' + eur(actuelle) + ' = ' + eur(reste) + '.',
      'Pour fin ' + p.reveAnnee + ' (' + mois + ' mois) : ' + eur(reste) + ' ÷ ' + mois + ' = ' + eur(requisMensuel) + ' / mois.',
      capacite > 0 ? ('À ton rythme actuel : ' + eur(reste) + ' ÷ ' + eur(capacite) + ' = ' + Math.ceil(moisAuRythme) + ' mois (' + round(moisAuRythme / 12, 1).toString().replace('.', ',') + ' ans).') : 'Avec une capacité nulle ou négative, aucune date ne peut être calculée.',
      'Hypothèses : aucun rendement, aucune inflation, aucun imprévu. Prix convertis à 1 € = ' + String(REF.eurAed).replace('.', ',') + ' AED.'
    ];

    return {
      ok: true, depenses, capacite, actuelle, reel, statut, reve, reste, mois, requisMensuel, moisAuRythme,
      faisabilite, ecartMensuel: Math.max(0, requisMensuel - Math.max(0, capacite)), coussin, coussinHyp, hypothese: hyp,
      voitureSoutenable, niveaux, notesLegales, calcul
    };
  }

  // ---------------------------------------------------------------- Cohérence globale
  function coherence(p, phys, prog, fin) {
    const out = [];
    const add = (id, domaine, niveau, titre, texte, champs, fixes) => out.push({ id, domaine, niveau, titre, texte, champs: champs || [], fixes: fixes || [] });
    const corps = (p.domaines || []).indexOf('corps') >= 0, argent = (p.domaines || []).indexOf('argent') >= 0;

    if (corps && phys) {
      if (!phys.ok && phys.bloque) add('age_min', 'corps', 'bloquant', 'Âge', phys.message, ['age'], [{ label: 'Corriger mon âge', champ: 'age' }]);
      else if (!phys.ok) add('phys_manque', 'corps', 'bloquant', 'Données manquantes', phys.message, phys.manquants, phys.manquants.map(c => ({ label: 'Compléter', champ: c })));
      if (phys.ok) {
        if (phys.statut === 'dangereux') add('dangereux', 'corps', 'bloquant', 'Objectif de poids dangereux',
          'Passer de ' + kgf(p.poids) + ' à ' + kgf(phys.cible) + (phys.requis ? ' en ' + p.delaiSem + ' semaines' : '') + ' représente ' + Math.round(phys.ecartPct * 100) + ' % de ton poids' + (phys.imcCible < SEUILS.imcBas ? ', avec un IMC final de ' + String(phys.imcCible).replace('.', ',') : '') + '. Cap ne calcule pas de programme pour cet objectif : parles-en avec un médecin, qui pourra t’orienter vers une prise en charge adaptée.',
          ['cible', 'delaiSem'], [{ label: 'Modifier mon objectif', champ: 'cible' }]);
        else if (phys.statut === 'medical') add('medical', 'corps', 'bloquant', 'Poids cible trop bas',
          'Ton poids cible donnerait un IMC de ' + String(phys.imcCible).replace('.', ',') + ', sous le seuil de 18,5. Cap ne propose pas de plan vers ce poids : un avis médical est nécessaire pour fixer une cible adaptée.', ['cible'], [{ label: 'Modifier mon objectif', champ: 'cible' }]);
        if (phys.statut === 'trop_court') add('trop_court', 'corps', 'attention', 'Délai trop court',
          'Il faudrait ' + String(phys.requis).replace('.', ',') + ' kg par semaine. Le maximum prudent pour toi est ' + String(phys.max).replace('.', ',') + ' kg. Tu gardes ton objectif, mais le plan suit un rythme progressif : ≈ ' + phys.semaines + ' semaines.',
          ['delaiSem', 'cible'], [{ label: 'Changer le délai', champ: 'delaiSem' }, { label: 'Changer la cible', champ: 'cible' }]);
        if (phys.alertes.indexOf('suivi_medical') >= 0) add('suivi_medical', 'corps', 'attention', 'Suivi médical conseillé', 'Perdre ' + Math.round(phys.ecartPct * 100) + ' % de ton poids est un projet long. Un suivi par un médecin ou un diététicien est recommandé, surtout au début.', ['cible']);
        if (phys.alertes.indexOf('incoherent_sens') >= 0) add('sens', 'corps', 'bloquant', 'Objectif contradictoire', 'Ton objectif est « ' + (p.objectif === 'perdre' ? 'perdre' : 'prendre') + ' » mais ton poids cible va dans l’autre sens.', ['objectif', 'cible'], [{ label: 'Corriger', champ: 'cible' }]);
        if (phys.rythmePlafonne) add('rythme_plafonne', 'corps', 'info', 'Rythme ajusté', 'Le rythme choisi dépasse le maximum prudent (' + String(phys.max).replace('.', ',') + ' kg/sem) avec tes données actuelles. Le plan utilise ce maximum.', ['rythme'], [{ label: 'Choisir un rythme', champ: 'rythme' }]);
        if (phys.plancherAtteint) add('plancher', 'corps', 'info', 'Minimum de calories atteint', 'Ton plan touche le minimum de ' + phys.plancher + ' kcal. Le rythme réel sera plus lent que prévu, et c’est voulu.', []);
        if (phys.mineur) add('mineur', 'corps', 'info', 'Règles moins de 18 ans', 'Rythme plafonné, écart calorique limité à ' + SEUILS.deficitMaxMineur + ' kcal et minimum de calories relevé, pour ne pas freiner ta croissance.', []);
      }
    }
    if (corps && prog && prog.ok && prog.notes) prog.notes.forEach((n, i) => add('prog_' + i, 'corps', 'info', 'Programme', n, ['jours']));
    // Temps disponible
    if (has(p.tempsLibre)) {
      const sportH = corps ? ((num(p.jours) || 0) * (num(p.minutes) || 0) / 60 + (num(p.autreSport) || 0) * SEUILS.dureeAutreSportH) : 0;
      const projetH = argent ? (num(p.heuresProjet) || 0) : 0;
      if (sportH + projetH > p.tempsLibre + 1e-9) add('temps', 'global', 'attention', 'Plus d’heures prévues que de temps libre',
        'Sport ' + round(sportH, 1).toString().replace('.', ',') + ' h + projet ' + projetH + ' h = ' + round(sportH + projetH, 1).toString().replace('.', ',') + ' h par semaine, pour ' + p.tempsLibre + ' h de temps libre déclarées.',
        ['jours', 'minutes', 'heuresProjet', 'tempsLibre'], [{ label: 'Moins de séances', champ: 'jours' }, { label: 'Moins d’heures projet', champ: 'heuresProjet' }, { label: 'Corriger mon temps libre', champ: 'tempsLibre' }]);
    }
    if (corps && (num(p.jours) || 0) + (num(p.autreSport) || 0) > 6) add('repos', 'corps', 'attention', 'Pas de jour de repos', (num(p.jours) || 0) + ' séances de muscu + ' + (num(p.autreSport) || 0) + ' d’autre sport par semaine : garde au moins 1 jour de repos complet.', ['jours', 'autreSport'], [{ label: 'Ajuster les séances', champ: 'jours' }]);

    if (argent && fin) {
      if (!fin.ok) add('fin_manque', 'argent', 'bloquant', 'Données manquantes', fin.message, fin.manquants, fin.manquants.map(c => ({ label: 'Compléter', champ: c })));
      else {
        if (fin.statut === 'deficit') add('deficit', 'argent', 'bloquant', 'Dépenses supérieures aux revenus', 'Tu dépenses ' + eur(-fin.capacite) + ' de plus que tu ne gagnes chaque mois. Aucune épargne n’est projetée tant que ce n’est pas corrigé.', ['fixes', 'variables', 'revenus'], [{ label: 'Revoir mes dépenses', champ: 'variables' }, { label: 'Revoir mes revenus', champ: 'revenus' }]);
        if (fin.statut === 'nulle') add('nulle', 'argent', 'attention', 'Capacité d’épargne nulle', 'Revenus et dépenses s’équilibrent : aucune date ne peut être calculée pour ton objectif. La première étape est de créer un écart, même petit.', ['revenus', 'variables']);
        if (fin.faisabilite === 'ecart') add('ecart', 'argent', 'attention', 'Délai hors de portée avec tes revenus actuels',
          'Il faudrait ' + eur(fin.requisMensuel) + ' par mois, tu peux mettre ' + eur(fin.capacite) + '. À ce rythme : ' + Math.ceil(fin.moisAuRythme / 12) + ' ans.', ['reveAnnee', 'revenus'], [{ label: 'Repousser la date', champ: 'reveAnnee' }, { label: 'Changer d’objectif', champ: 'reve' }]);
        if (fin.voitureSoutenable === false) add('voiture', 'argent', 'attention', 'Voiture non soutenable avec tes revenus actuels',
          'Coût estimé ≈ ' + eur(fin.reve.annuel) + ' par an (assurance, entretien, carburant, perte de valeur). Repère : ce coût ne devrait pas dépasser 15 % des revenus, soit ≈ ' + eur(fin.reve.annuel / SEUILS.partVoitureMax / 12) + ' net par mois.', ['reve']);
        if (fin.hypothese) add('hypothese', 'argent', 'info', 'Revenu visé : hypothèse', 'Les ' + eur(fin.hypothese.revenu) + '/mois visés ne sont jamais comptés comme acquis. Ils apparaissent seulement dans un scénario séparé.', ['revenuVise']);
        if (has(p.remboursements) && p.remboursements > p.revenus && p.revenus > 0) add('dettes', 'argent', 'bloquant', 'Remboursements supérieurs aux revenus', 'Tes remboursements dépassent tes revenus. Contacte ta banque ou un conseiller (point conseil budget, gratuit en France).', ['remboursements']);
      }
    }
    const ordre = { bloquant: 0, attention: 1, info: 2 };
    return out.sort((a, b) => ordre[a.niveau] - ordre[b.niveau]);
  }

  // ---------------------------------------------------------------- Tendance réelle (pesées)
  function tendance(pesees) {
    const rows = (pesees || []).filter(r => r && r.date && typeof r.poids === 'number').sort((a, b) => a.date.localeCompare(b.date));
    if (rows.length < 2) return { n: rows.length, rythme: null, dernier: rows[rows.length - 1] || null };
    const last = rows[rows.length - 1];
    const ref = rows.find(r => (new Date(last.date) - new Date(r.date)) / 864e5 <= 31) || rows[0];
    const sem = (new Date(last.date) - new Date(ref.date)) / (7 * 864e5);
    return { n: rows.length, rythme: sem >= 0.9 ? round((last.poids - ref.poids) / sem, 2) : null, dernier: last };
  }

  // ---------------------------------------------------------------- Journal alimentaire
  const CRENEAUX = { petitdej: 'Petit-déjeuner', dejeuner: 'Déjeuner', diner: 'Dîner', collation: 'Collations' };
  const ORDRE_CRENEAUX = ['petitdej', 'dejeuner', 'collation', 'diner'];
  function creneauParHeure(d) { const h = d.getHours() + d.getMinutes() / 60; return h < 10.5 ? 'petitdej' : h < 15 ? 'dejeuner' : h < 18 ? 'collation' : 'diner'; }
  // Matière grasse ajoutée par la cuisson, en g d'huile pour 100 g d'aliment (hypothèse documentée)
  const CUISSON = { aucune: ['Sans matière grasse', 0], poele: ['Poêlé, sauté', 3], frit: ['Frit', 8] };
  // Convertit un aliment (valeurs pour 100 g) + une quantité en entrée du journal
  function entreeDepuisAliment(al, grammes, cuisson) {
    const q = Math.max(0, num(grammes) || 0), r = q / 100;
    const huile = (CUISSON[cuisson] || CUISSON.aucune)[1] * r;
    return {
      n: al.n, q: round(q, 0), cuisson: cuisson && cuisson !== 'aucune' ? cuisson : undefined,
      k: round(al.k * r + huile * 9, 0), p: round(al.p * r, 1), c: round(al.c * r, 1), f: round(al.f * r + huile, 1)
    };
  }
  // Normalise une entrée (y compris l'ancien format v2 : g = glucides, l = lipides)
  function normEntree(it) {
    if (!it || typeof it !== 'object') return null;
    const v2 = it.l !== undefined && it.f === undefined;
    const o = {
      id: it.id || null, n: String(it.n || 'Aliment'), slot: CRENEAUX[it.slot] ? it.slot : 'collation', q: num(it.q),
      k: num(it.k) || 0, p: num(it.p) || 0, c: num(v2 ? it.g : it.c) || 0, f: num(v2 ? it.l : it.f) || 0,
      src: it.src || (v2 ? 'v2' : 'manuel'), conf: it.conf || null, cuisson: it.cuisson || null, ts: it.ts || null
    };
    return o;
  }
  function totaux(items) {
    const t = { k: 0, p: 0, c: 0, f: 0 };
    (items || []).forEach(it => { const e = normEntree(it); if (!e) return; t.k += e.k; t.p += e.p; t.c += e.c; t.f += e.f; });
    return { k: Math.round(t.k), p: round(t.p, 1), c: round(t.c, 1), f: round(t.f, 1) };
  }
  // Activités : MET (Compendium of Physical Activities, valeurs moyennes). Calories nettes = (MET − 1) × kg × heures
  const ACTIVITES = {
    marche: ['Marche rapide', 4.3], course: ['Course à pied', 9.0], velo: ['Vélo', 7.0], foot: ['Football', 7.0],
    muscu: ['Musculation', 5.0], natation: ['Natation', 7.0], basket: ['Basket', 6.5], combat: ['Sport de combat', 7.5], autre: ['Autre activité modérée', 5.0]
  };
  function kcalActivite(type, minutes, poids) {
    const met = (ACTIVITES[type] || ACTIVITES.autre)[1];
    if (!(minutes > 0) || !(poids > 0)) return 0;
    return Math.round((met - 1) * poids * minutes / 60);
  }
  function objectifEau(poids) {
    if (!(poids > 0)) return 2000;
    return Math.min(3500, Math.max(1500, Math.round(poids * 30 / 50) * 50));
  }
  // Objectifs personnalisés : contrôlés, jamais acceptés sous le minimum de sécurité
  function validerObjectifsPerso(o, phys) {
    const err = [], warn = [];
    if (!o) return { ok: true, err, warn };
    if (!(o.kcal > 0)) err.push('Indique un objectif de calories.');
    else if (phys && phys.ok && o.kcal < phys.plancher) err.push('Minimum de sécurité pour ton profil : ' + phys.plancher + ' kcal.');
    else if (o.kcal > 6000) err.push('Objectif de calories trop élevé (6 000 kcal maximum).');
    ['p', 'c', 'f'].forEach(k => { if (!(o[k] >= 0)) err.push('Les macros doivent être des nombres positifs.'); });
    if (!err.length) {
      const somme = o.p * 4 + o.c * 4 + o.f * 9;
      if (Math.abs(somme - o.kcal) / o.kcal > 0.08) warn.push('Tes macros font ' + Math.round(somme) + ' kcal, pour un objectif de ' + Math.round(o.kcal) + ' kcal. Écart de plus de 8 %.');
      if (phys && phys.ok && o.p < phys.macros.prot * 0.7) warn.push('Protéines nettement sous la recommandation calculée (' + phys.macros.prot + ' g) : ta récupération musculaire peut en souffrir.');
    }
    return { ok: !err.length, err, warn };
  }
  function cibleJour(phys, perso) {
    if (perso && validerObjectifsPerso(perso, phys).ok) return { kcal: Math.round(perso.kcal), macros: { prot: Math.round(perso.p), glu: Math.round(perso.c), lip: Math.round(perso.f) }, perso: true };
    return { kcal: phys.kcal, macros: phys.macros, perso: false };
  }
  // Budget du jour : objectif + bonus d'activité (option, 50 %) + report de la veille (option, 200 kcal max)
  function budgetJour(o) {
    const cj = cibleJour(o.phys, o.perso);
    const prefs = o.prefs || {};
    const journal = o.journal || {}, veille = o.veille || null;
    const acts = (journal.activites || []);
    const net = acts.reduce((s, a) => s + (num(a.kcal) || 0), 0);
    const horsProg = acts.filter(a => a.hors !== false).reduce((s, a) => s + (num(a.kcal) || 0), 0);
    const bonus = prefs.bonusActivite ? Math.round(horsProg * 0.5) : 0;
    let report = 0;
    if (prefs.report && veille && (veille.items || []).length) {
      const mv = totaux(veille.items).k;
      report = Math.min(200, Math.max(0, cj.kcal - mv));
    }
    const t = totaux(journal.items);
    const total = cj.kcal + bonus + report;
    return { base: cj.kcal, perso: cj.perso, bonus, report, total, mange: t.k, restant: total - t.k, totaux: t, macros: cj.macros, activitesKcal: net, horsProgKcal: horsProg };
  }
  // Série : jours consécutifs avec au moins un aliment noté, jusqu'à aujourd'hui (ou hier si rien aujourd'hui)
  function serie(joursAvecDonnees, aujourdhui) {
    const set = new Set(joursAvecDonnees);
    const d = new Date(aujourdhui + 'T12:00');
    const id = x => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
    if (!set.has(id(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (set.has(id(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  // Bilan des 7 derniers jours : uniquement les jours renseignés
  function bilanSemaine(journaux, cibleKcal, pesees, aujourdhui) {
    const d0 = new Date(aujourdhui + 'T12:00');
    const jours = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(d0); d.setDate(d.getDate() - i); jours.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')); }
    const parJour = jours.map(id => { const j = journaux[id]; const n = j && (j.items || []).length; return { date: id, renseigne: !!n, kcal: n ? totaux(j.items).k : null }; });
    const rens = parJour.filter(x => x.renseigne);
    const moyenne = rens.length ? Math.round(rens.reduce((s, x) => s + x.kcal, 0) / rens.length) : null;
    const tr = tendance(pesees);
    let message;
    if (rens.length === 0) message = 'Aucun repas noté cette semaine : impossible de faire un bilan.';
    else if (rens.length < 4) message = rens.length + ' jour' + (rens.length > 1 ? 's' : '') + ' renseigné' + (rens.length > 1 ? 's' : '') + ' sur 7 : le bilan reste peu fiable. Note au moins 4 jours.';
    else if (cibleKcal && moyenne > cibleKcal * 1.1) message = 'Moyenne de ' + moyenne + ' kcal, soit ' + (moyenne - cibleKcal) + ' au-dessus de ton objectif sur les jours notés.';
    else if (cibleKcal && moyenne < cibleKcal * 0.85) message = 'Moyenne de ' + moyenne + ' kcal, nettement sous ton objectif. Manger trop peu ralentit la récupération : rapproche-toi de ' + cibleKcal + ' kcal.';
    else message = 'Moyenne de ' + moyenne + ' kcal sur ' + rens.length + ' jours notés : proche de ton objectif.';
    return { jours: parJour, renseignes: rens.length, moyenne, rythmePoids: tr.rythme, message };
  }
  // Jalons : uniquement des faits mesurés
  function jalons(pesees, poidsDepart, cible, serieJours) {
    const rows = (pesees || []).filter(r => typeof r.poids === 'number').sort((a, b) => a.date.localeCompare(b.date));
    const out = [];
    if (rows.length) out.push({ t: 'Première pesée', date: rows[0].date });
    const perdre = cible < poidsDepart;
    const seuil = (txt, test) => { const r = rows.find(test); if (r) out.push({ t: txt, date: r.date }); };
    if (perdre) {
      seuil('−1 kg', r => r.poids <= poidsDepart - 1);
      seuil('−5 % du poids de départ', r => r.poids <= poidsDepart * 0.95);
      seuil('Objectif atteint', r => r.poids <= cible);
    } else if (cible > poidsDepart) {
      seuil('+1 kg', r => r.poids >= poidsDepart + 1);
      seuil('Objectif atteint', r => r.poids >= cible);
    }
    if (serieJours >= 7) out.push({ t: serieJours + ' jours de suivi d’affilée', date: null });
    return out;
  }
  // Résultat d'analyse photo : validation et calcul déterministe
  function validerScan(rep) {
    const out = [], notes = [];
    const arr = rep && Array.isArray(rep.aliments) ? rep.aliments.slice(0, 15) : [];
    arr.forEach(a => {
      const n = String(a && a.nom || '').trim().slice(0, 60);
      const g = num(a && a.grammes), k = num(a && a.kcal_100g), p = num(a && a.proteines_100g), c = num(a && a.glucides_100g), f = num(a && a.lipides_100g);
      if (!n || g === null || g <= 0 || g > 2000) { notes.push('Un élément illisible a été ignoré.'); return; }
      if ([k, p, c, f].some(v => v === null || v < 0) || k > 900 || p + c + f > 100.5) { notes.push('Valeurs incohérentes pour « ' + n + ' » : à vérifier.'); }
      const kk = Math.max(0, Math.min(900, k || 0)), pp = Math.max(0, p || 0), cc = Math.max(0, c || 0), ff = Math.max(0, f || 0);
      const kMacros = pp * 4 + cc * 4 + ff * 9;
      const coherent = kk === 0 ? kMacros < 5 : Math.abs(kMacros - kk) / kk <= 0.25;
      out.push({ nom: n, grammes: Math.round(g), cuisson: CUISSON[a.preparation] ? a.preparation : 'aucune', confiance: ['haute', 'moyenne', 'faible'].indexOf(a.confiance) >= 0 ? a.confiance : 'faible', par100: { n, k: kk, p: pp, c: cc, f: ff }, coherent });
    });
    return { aliments: out, remarque: rep && typeof rep.remarque === 'string' ? rep.remarque.slice(0, 300) : '', notes };
  }

  return { REF, SEUILS, BORNES, valider, physique, programme, adaptation, finances, coutReve, coherence, tendance, imcCategorie, NOMS_JOURS,
    CRENEAUX, ORDRE_CRENEAUX, creneauParHeure, CUISSON, entreeDepuisAliment, normEntree, totaux, ACTIVITES, kcalActivite, objectifEau,
    validerObjectifsPerso, cibleJour, budgetJour, serie, bilanSemaine, jalons, validerScan };
});
