/* Cap — moteur de programmes sportifs (règles déterministes, AUCUNE IA).
 * Entrées : réponses du questionnaire + calculs (temps disponible, âge, niveau, matériel, douleurs).
 * Sortie : séances, exercices, séries, repos, progression, alternatives, et la liste des décisions prises avec leur raison.
 * Même profil → même programme (reproductible). Toute IA future devra passer par CapContrats.validerProgrammeIA. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CapTraining = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const VERSION = 'cap-training-1.0';
  const has = v => v !== undefined && v !== null && v !== '' && !(typeof v === 'number' && !isFinite(v));
  const num = v => (typeof v === 'number' && isFinite(v)) ? v : null;

  // ---------------------------------------------------------------- Bibliothèque d'exercices
  // mat : matériel requis ('aucun', 'halteres', 'barre', 'machine', 'poulie', 'traction', 'elastique', 'banc')
  // niv : niveau minimal (1 débutant, 2 intermédiaire, 3 avancé) ; tech : exigence technique (1 à 3)
  // zones : articulations fortement sollicitées (exclues si douleur déclarée) ; impact : sauts / chocs
  // Relu à partir des principes généraux ACSM / NSCA ; ce n'est pas une validation médicale individuelle.
  const B = (id, nom, pattern, type, mat, niv, tech, zones, consigne, extra) => Object.assign({ id, nom, pattern, type, mat, niv, tech, zones, consigne, impact: false, mineur: true }, extra || {});
  const LIB = [
    // Squat (quadriceps, fessiers)
    B('squat_pdc', 'Squat au poids du corps', 'squat', 'poly', 'aucun', 1, 1, ['genou'], 'Pieds largeur d’épaules, descends en gardant le dos neutre, genoux dans l’axe des pieds.'),
    B('squat_gobelet', 'Squat gobelet', 'squat', 'poly', 'halteres', 1, 1, ['genou'], 'Haltère contre la poitrine, descends entre les talons, buste droit.'),
    B('squat_elastique', 'Squat avec élastique', 'squat', 'poly', 'elastique', 1, 1, ['genou'], 'Élastique sous les pieds, mains aux épaules, monte en poussant le sol.'),
    B('squat_barre', 'Squat barre', 'squat', 'poly', 'barre', 2, 3, ['genou', 'dos'], 'Barre sur le haut du dos, gainage avant de descendre, remonte en poussant le sol.'),
    B('presse', 'Presse à cuisses', 'squat', 'poly', 'machine', 1, 1, ['genou'], 'Dos collé au dossier, ne verrouille pas les genoux en haut.'),
    B('chaise', 'Chaise contre un mur', 'squat', 'poly', 'aucun', 1, 1, [], 'Cuisses parallèles au sol, dos au mur. Alternative douce pour le genou.', { reps: 'temps' }),
    // Charnière (ischios, fessiers, dos)
    B('pont_fessier', 'Pont fessier', 'hinge', 'poly', 'aucun', 1, 1, [], 'Pousse dans les talons, serre les fessiers en haut, ne cambre pas.'),
    B('rdl_halteres', 'Soulevé de terre roumain haltères', 'hinge', 'poly', 'halteres', 1, 2, ['dos'], 'Hanches vers l’arrière, dos plat, haltères le long des cuisses.'),
    B('rdl_barre', 'Soulevé de terre roumain barre', 'hinge', 'poly', 'barre', 2, 2, ['dos'], 'Barre près des jambes, dos plat, arrête quand les ischios tirent.'),
    B('hip_thrust', 'Hip thrust sur banc', 'hinge', 'poly', 'banc', 1, 1, [], 'Haut du dos sur le banc, menton rentré, monte jusqu’à l’alignement.'),
    B('good_morning_el', 'Good morning élastique', 'hinge', 'poly', 'elastique', 1, 2, ['dos'], 'Élastique sous les pieds et sur la nuque, penche-toi dos plat.'),
    // Fentes (unilatéral)
    B('fente_arriere', 'Fentes arrière', 'lunge', 'poly', 'aucun', 1, 1, ['genou'], 'Grand pas en arrière, genou arrière proche du sol, buste droit.'),
    B('fente_halteres', 'Fentes marchées haltères', 'lunge', 'poly', 'halteres', 2, 2, ['genou'], 'Pas réguliers, genou avant au-dessus du pied.'),
    B('step_up', 'Montées sur banc', 'lunge', 'poly', 'banc', 1, 1, ['genou'], 'Pied entier sur le banc, monte sans t’aider de la jambe arrière.'),
    B('split_squat', 'Squat bulgare', 'lunge', 'poly', 'banc', 2, 2, ['genou'], 'Pied arrière sur le banc, descends à la verticale.'),
    // Poussée horizontale
    B('pompes_inclinees', 'Pompes mains surélevées', 'push_h', 'poly', 'aucun', 1, 1, ['poignet'], 'Mains sur une table, corps gainé, poitrine vers le bord.'),
    B('pompes', 'Pompes', 'push_h', 'poly', 'aucun', 1, 1, ['poignet', 'epaule'], 'Corps gainé de la tête aux pieds, coudes à 45°.'),
    B('dc_halteres', 'Développé couché haltères', 'push_h', 'poly', 'halteres', 1, 2, ['epaule'], 'Omoplates serrées, haltères descendent au niveau de la poitrine.', { requiert: ['banc'] }),
    B('dc_sol', 'Développé haltères au sol', 'push_h', 'poly', 'halteres', 1, 1, [], 'Allongé au sol, les coudes touchent le sol en bas : amplitude protégée pour l’épaule.'),
    B('dc_barre', 'Développé couché barre', 'push_h', 'poly', 'barre', 2, 3, ['epaule'], 'Pieds ancrés, barre au bas des pectoraux, toujours avec pareur ou sécurités.', { requiert: ['banc'] }),
    B('dc_machine', 'Développé machine', 'push_h', 'poly', 'machine', 1, 1, ['epaule'], 'Poignées à hauteur de poitrine, pousse sans décoller le dos.'),
    // Poussée inclinée
    B('pompes_pieds', 'Pompes pieds surélevés', 'push_inc', 'poly', 'aucun', 2, 2, ['poignet', 'epaule'], 'Pieds sur une chaise, corps gainé.'),
    B('di_halteres', 'Développé incliné haltères', 'push_inc', 'poly', 'halteres', 1, 2, ['epaule'], 'Banc à 30°, descente contrôlée.', { requiert: ['banc'] }),
    B('ecarte_poulie', 'Écarté à la poulie', 'push_inc', 'iso', 'poulie', 1, 1, ['epaule'], 'Bras légèrement fléchis, rapproche les mains devant toi.'),
    B('pompes_el', 'Pompes avec élastique', 'push_inc', 'poly', 'elastique', 2, 2, ['poignet', 'epaule'], 'Élastique dans le dos, mains dans les boucles.'),
    // Poussée verticale
    B('pompes_piquees', 'Pompes piquées', 'push_v', 'poly', 'aucun', 2, 2, ['epaule', 'poignet'], 'Hanches hautes, tête vers le sol entre les mains.'),
    B('dm_halteres', 'Développé épaules haltères', 'push_v', 'poly', 'halteres', 1, 2, ['epaule'], 'Assis ou debout, gainé, pousse au-dessus de la tête.'),
    B('dm_elastique', 'Développé épaules élastique', 'push_v', 'poly', 'elastique', 1, 1, ['epaule'], 'Élastique sous les pieds, pousse sans cambrer.'),
    B('dm_machine', 'Développé épaules machine', 'push_v', 'poly', 'machine', 1, 1, ['epaule'], 'Dos collé, poignées à hauteur d’oreilles.'),
    // Tirage horizontal
    B('rowing_table', 'Rowing inversé sous une table', 'pull_h', 'poly', 'aucun', 1, 2, [], 'Allongé sous une table solide, tire la poitrine vers le bord. Vérifie la stabilité de la table.'),
    B('rowing_halteres', 'Rowing haltère un bras', 'pull_h', 'poly', 'halteres', 1, 1, [], 'Main et genou en appui, tire le coude vers la hanche.'),
    B('rowing_el', 'Rowing élastique', 'pull_h', 'poly', 'elastique', 1, 1, [], 'Élastique accroché devant, tire en serrant les omoplates.'),
    B('rowing_barre', 'Rowing barre', 'pull_h', 'poly', 'barre', 2, 2, ['dos'], 'Buste penché dos plat, barre vers le nombril.'),
    B('tirage_horiz', 'Tirage horizontal poulie', 'pull_h', 'poly', 'poulie', 1, 1, [], 'Buste droit, tire vers le ventre.'),
    // Tirage vertical
    B('tractions', 'Tractions', 'pull_v', 'poly', 'traction', 3, 2, ['epaule'], 'Prise largeur d’épaules, menton au-dessus de la barre.'),
    B('tractions_el', 'Tractions avec élastique', 'pull_v', 'poly', 'traction', 1, 2, ['epaule'], 'Élastique sous les genoux ou les pieds pour alléger.', { requiert: ['elastique'] }),
    B('tractions_neg', 'Tractions négatives', 'pull_v', 'poly', 'traction', 1, 1, ['epaule'], 'Monte avec une chaise, descends en 4 secondes.'),
    B('tirage_vertical', 'Tirage vertical poulie', 'pull_v', 'poly', 'poulie', 1, 1, ['epaule'], 'Tire la barre vers le haut de la poitrine, coudes vers le bas.'),
    B('tirage_el', 'Tirage vertical élastique', 'pull_v', 'poly', 'elastique', 1, 1, [], 'Élastique accroché en haut d’une porte, tire vers la poitrine.'),
    B('y_raise', 'Élévations en Y allongé', 'pull_v', 'iso', 'aucun', 1, 1, [], 'À plat ventre, lève les bras en Y, pouces vers le haut.'),
    // Ischios isolés
    B('leg_curl', 'Leg curl machine', 'ischios', 'iso', 'machine', 1, 1, ['genou'], 'Mouvement lent, sans décoller les hanches.'),
    B('curl_serviette', 'Leg curl au sol avec serviette', 'ischios', 'iso', 'aucun', 2, 2, ['genou'], 'En pont, glisse les talons sur une serviette.'),
    B('pont_unilat', 'Pont fessier une jambe', 'ischios', 'iso', 'aucun', 1, 1, [], 'Une jambe tendue, pousse avec l’autre talon.'),
    // Épaules latérales
    B('elev_lat', 'Élévations latérales haltères', 'epaules_lat', 'iso', 'halteres', 1, 1, ['epaule'], 'Coudes légèrement fléchis, monte jusqu’à l’horizontale.'),
    B('elev_lat_el', 'Élévations latérales élastique', 'epaules_lat', 'iso', 'elastique', 1, 1, ['epaule'], 'Élastique sous le pied, monte sans hausser les épaules.'),
    B('elev_lat_bouteilles', 'Élévations latérales avec bouteilles', 'epaules_lat', 'iso', 'aucun', 1, 1, ['epaule'], 'Deux bouteilles d’eau, mouvement lent.'),
    // Bras
    B('curl_halteres', 'Curl haltères', 'bras_flex', 'iso', 'halteres', 1, 1, [], 'Coudes fixes le long du corps.'),
    B('curl_el', 'Curl élastique', 'bras_flex', 'iso', 'elastique', 1, 1, [], 'Élastique sous les pieds, coudes fixes.'),
    B('curl_sac', 'Curl sac à dos', 'bras_flex', 'iso', 'aucun', 1, 1, [], 'Sac chargé de livres, tenu par les bretelles.'),
    B('dips_chaise', 'Dips sur chaise', 'bras_ext', 'iso', 'aucun', 1, 1, ['epaule', 'poignet'], 'Mains au bord de la chaise, descends les coudes à 90° maximum.'),
    B('ext_poulie', 'Extension triceps poulie', 'bras_ext', 'iso', 'poulie', 1, 1, [], 'Coudes collés, tends les bras vers le bas.'),
    B('ext_halteres', 'Extension triceps haltère au-dessus de la tête', 'bras_ext', 'iso', 'halteres', 1, 1, ['epaule'], 'Coudes vers le plafond, descente derrière la tête.'),
    B('ext_el', 'Extension triceps élastique', 'bras_ext', 'iso', 'elastique', 1, 1, [], 'Élastique accroché en haut, tends les bras.'),
    // Mollets
    B('mollets_marche', 'Mollets sur une marche', 'mollets', 'iso', 'aucun', 1, 1, [], 'Talons dans le vide, monte et descends lentement.'),
    B('mollets_machine', 'Mollets debout machine', 'mollets', 'iso', 'machine', 1, 1, [], 'Amplitude complète.'),
    // Gainage
    B('gainage', 'Gainage ventral', 'core', 'core', 'aucun', 1, 1, [], 'Coudes sous les épaules, corps aligné.', { reps: 'temps' }),
    B('gainage_lat', 'Gainage latéral', 'core', 'core', 'aucun', 1, 1, [], 'Hanches hautes, corps aligné.', { reps: 'temps' }),
    B('dead_bug', 'Dead bug', 'core', 'core', 'aucun', 1, 1, [], 'Bas du dos plaqué au sol, bras et jambe opposés s’éloignent lentement.'),
    // Cardio
    B('marche_rapide', 'Marche rapide', 'cardio', 'cardio', 'aucun', 1, 1, [], 'Tu dois pouvoir parler mais pas chanter.'),
    B('velo', 'Vélo ou vélo d’appartement', 'cardio', 'cardio', 'aucun', 1, 1, [], 'Intensité modérée.'),
    B('corde', 'Corde à sauter par blocs', 'cardio', 'cardio', 'aucun', 2, 2, ['genou', 'cheville'], '30 s de sauts, 30 s de repos.', { impact: true }),
    B('rameur', 'Rameur', 'cardio', 'cardio', 'machine', 1, 2, ['dos'], 'Pousse avec les jambes d’abord, puis tire.')
  ];
  const PAR_ID = {}; LIB.forEach(e => { PAR_ID[e.id] = e; });

  const TEMPLATES = {
    FA: ['Corps complet A', 'Force de base sur tout le corps', ['squat', 'push_h', 'pull_h', 'push_v', 'core', 'bras_flex', 'mollets']],
    FB: ['Corps complet B', 'Chaîne arrière et tirage', ['hinge', 'pull_v', 'push_inc', 'lunge', 'epaules_lat', 'bras_ext', 'core']],
    FC: ['Corps complet C', 'Équilibre et unilatéral', ['lunge', 'push_h', 'pull_v', 'hinge', 'epaules_lat', 'bras_flex', 'core']],
    H1: ['Haut du corps A', 'Poussée et tirage horizontaux', ['push_h', 'pull_h', 'push_v', 'pull_v', 'epaules_lat', 'bras_flex', 'bras_ext']],
    H2: ['Haut du corps B', 'Poussée et tirage verticaux', ['push_inc', 'pull_v', 'push_v', 'pull_h', 'epaules_lat', 'bras_ext', 'bras_flex']],
    B1: ['Bas du corps A', 'Quadriceps et fessiers', ['squat', 'hinge', 'lunge', 'ischios', 'mollets', 'core']],
    B2: ['Bas du corps B', 'Ischios et fessiers', ['hinge', 'squat', 'lunge', 'ischios', 'mollets', 'core']],
    PU: ['Poussée', 'Pectoraux, épaules, triceps', ['push_h', 'push_v', 'push_inc', 'epaules_lat', 'bras_ext', 'core']],
    PL: ['Tirage', 'Dos, biceps, ischios', ['pull_v', 'pull_h', 'hinge', 'bras_flex', 'ischios', 'core']],
    JA: ['Jambes', 'Quadriceps, fessiers, mollets', ['squat', 'lunge', 'ischios', 'mollets', 'core', 'hinge']]
  };
  const SPLITS = { 1: ['FA'], 2: ['FA', 'FB'], 3: ['FA', 'FB', 'FC'], 4: ['H1', 'B1', 'H2', 'B2'], 5: ['PU', 'PL', 'JA', 'H1', 'B1'], 6: ['PU', 'PL', 'JA', 'PU', 'PL', 'JA'] };
  const JOURS_SEMAINE = { 1: [3], 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 5, 6], 6: [1, 2, 3, 4, 5, 6], 7: [0, 1, 2, 3, 4, 5, 6] };
  const NOMS_JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const MUSCLES = { squat: 'quadriceps', lunge: 'quadriceps', hinge: 'fessiers et ischios', ischios: 'fessiers et ischios', push_h: 'pectoraux', push_inc: 'pectoraux', push_v: 'épaules', epaules_lat: 'épaules', pull_h: 'dos', pull_v: 'dos', bras_flex: 'biceps', bras_ext: 'triceps', mollets: 'mollets', core: 'gainage' };
  // Volume hebdomadaire visé par groupe musculaire (séries), repères de la littérature (Schoenfeld 2017 ; ACSM 2009)
  const VOLUME = { 1: [6, 10], 2: [10, 16], 3: [12, 20] };
  const MAX_SERIES_SEANCE = { 1: 16, 2: 20, 3: 24 };
  const DUREES = [90, 75, 60, 45, 40, 30, 20];
  const NIV = { debutant: 1, intermediaire: 2, avance: 3 };
  // Si aucun exercice n'existe pour un mouvement, repli sur le mouvement le plus proche (signalé dans les décisions)
  const REPLI = { push_inc: 'push_h', push_v: 'epaules_lat', pull_v: 'pull_h', ischios: 'hinge', lunge: 'squat', epaules_lat: 'push_v' };
  // Préférence de matériel quand le choix existe : charge progressive plus facile à doser
  const RANG_MAT = { barre: 4, machine: 3, halteres: 3, poulie: 3, traction: 3, banc: 2, aucun: 1, elastique: 0 };

  function materielDispo(p) {
    if (p.lieu === 'salle') return { liste: ['aucun', 'halteres', 'barre', 'machine', 'poulie', 'traction', 'elastique', 'banc'], hypothese: false };
    const m = Array.isArray(p.materielSport) ? p.materielSport.filter(x => x !== 'aucun') : null;
    if (!m) return { liste: ['aucun'], hypothese: true };
    return { liste: ['aucun'].concat(m), hypothese: false };
  }
  function priorite(p, mineur, niv, d) {
    let pr = p.prioriteSport;
    if (!has(pr) || pr === 'auto') { pr = p.objectif === 'prendre' ? 'muscle' : 'forme'; d('priorite', pr, 'Priorité déduite de ton objectif (« ' + (p.objectif || 'non renseigné') + ' »). Tu peux la choisir dans Réglages.', ['objectif']); }
    if (pr === 'force' && (mineur || niv === 1)) { d('priorite', 'muscle', (mineur ? 'Moins de 18 ans' : 'Débutant') + ' : pas de charges proches du maximum. Cap travaille d’abord la technique avec 6 à 12 répétitions.', ['prioriteSport', mineur ? 'age' : 'niveau']); pr = 'muscle'; }
    return pr;
  }
  function parametresSeries(pr, niv, mineur) {
    const t = {
      force: { poly: [4, '4-6', 180], iso: [2, '8-12', 90], core: [3, '30-45 s', 60] },
      muscle: { poly: [niv === 3 ? 4 : 3, niv === 1 ? '8-12' : '6-10', 120], iso: [niv === 1 ? 2 : 3, '10-15', 75], core: [3, '30-45 s', 45] },
      forme: { poly: [3, '10-15', 75], iso: [2, '12-15', 45], core: [3, '30-45 s', 30] }
    }[pr] || null;
    const r = JSON.parse(JSON.stringify(t));
    if (mineur) { if (r.poly[1] === '6-10') r.poly[1] = '8-12'; }
    return r;
  }

  function generer(p) {
    const decisions = [];
    const d = (sujet, valeur, raison, champs) => decisions.push({ sujet, valeur, raison, champs: champs || [] });
    const manquants = ['niveau', 'jours'].filter(k => !has(p[k]));
    if (num(p.jours) > 0) ['minutes', 'lieu'].forEach(k => { if (!has(p[k])) manquants.push(k); });
    if (manquants.length) return { ok: false, origine: 'calcul', manquants, seances: [], planning: [], decisions, message: 'Pour construire ton programme, Cap a besoin de : ' + manquants.join(', ') + '.' };
    const age = num(p.age) || 30, mineur = age < 18, niv = NIV[p.niveau] || 1;
    let jours = num(p.jours) || 0, minutes = num(p.minutes) || 0;
    if (jours === 0) return { ok: true, origine: 'calcul', seances: [], planning: [], decisions: [{ sujet: 'seances', valeur: 0, raison: 'Tu as choisi 0 séance de musculation.', champs: ['jours'] }], note: 'Aucune séance de musculation prévue. Base de départ : 7 000 à 10 000 pas par jour.', notes: [], progression: '' };

    // 1. Budget de temps réel (temps libre − projet − autre sport)
    const autreH = (num(p.autreSport) || 0) * 1.5;
    const projetH = (p.domaines || []).some(x => x === 'argent' || x === 'entreprise') ? (num(p.heuresProjet) || 0) : 0;
    let budgetMin = has(p.tempsLibre) ? Math.max(0, (p.tempsLibre - projetH - autreH) * 60) : null;
    if (budgetMin === null) d('temps', 'non vérifié', 'Temps libre non renseigné : Cap ne peut pas vérifier que le programme tient dans ta semaine.', ['tempsLibre']);
    const demande = jours * minutes;
    if (budgetMin !== null && demande > budgetMin) {
      const avantJ = jours, avantM = minutes;
      // Séances de 40 min minimum tant que possible : en dessous, l'échauffement prend une part trop grande
      while (jours * minutes > budgetMin && minutes > 40) { const nxt = DUREES.find(x => x < minutes); if (!nxt || nxt < 40) break; minutes = nxt; }
      while (jours * minutes > budgetMin && jours > 1) jours--;
      if (jours * minutes > budgetMin) minutes = Math.max(20, DUREES.find(x => x <= budgetMin) || 20);
      d('temps', jours + ' × ' + minutes + ' min', 'Tu demandais ' + avantJ + ' × ' + avantM + ' min, mais il te reste ' + Math.round(budgetMin / 60 * 10) / 10 + ' h par semaine (temps libre ' + p.tempsLibre + ' h − projet ' + projetH + ' h − autre sport ' + autreH + ' h). Cap réduit d’abord la durée, puis le nombre de séances.', ['tempsLibre', 'jours', 'minutes', 'heuresProjet', 'autreSport']);
    }
    else if (budgetMin !== null) d('temps', jours + ' × ' + minutes + ' min', 'Ton programme prend ' + Math.round(demande / 6) / 10 + ' h par semaine, dans les ' + Math.round(budgetMin / 6) / 10 + ' h qu’il te reste (temps libre − projet − autre sport).', ['tempsLibre', 'jours', 'minutes']);
    // 2. Récupération et niveau
    const maxMuscu = Math.min(niv === 1 ? 4 : 6, mineur && age < 16 ? 4 : 6);
    if (jours + (num(p.autreSport) || 0) > 6) { const j2 = Math.max(1, 6 - (num(p.autreSport) || 0)); d('recuperation', j2 + ' séances', jours + ' séances + ' + p.autreSport + ' d’autre sport : au moins 1 jour de repos complet par semaine.', ['jours', 'autreSport']); jours = j2; }
    if (p.obstacle === 'regularite' && jours > 3) { d('regularite', '3 séances', 'Tu as indiqué que la régularité est ton frein : 3 séances tenues valent mieux que 5 prévues.', ['obstacle']); jours = 3; }
    if (p.obstacle === 'temps' && minutes > 45) { d('duree', '45 min', 'Le manque de temps est ton frein : séances limitées à 45 min, exercices enchaînés.', ['obstacle']); minutes = 45; }
    let muscu = Math.min(jours, maxMuscu), cardio = jours - muscu;
    if (cardio > 0) d('cardio', cardio + ' séance(s)', (niv === 1 ? 'Débutant' : 'Moins de 16 ans') + ' : ' + maxMuscu + ' séances de musculation maximum. Les autres deviennent du cardio doux pour récupérer.', ['niveau', 'age']);

    // 3. Matériel, douleurs, priorité
    const mat = materielDispo(p);
    if (mat.hypothese) d('materiel', 'poids du corps', 'Matériel à la maison non précisé : Cap prend l’hypothèse prudente « aucun matériel ». Précise-le pour plus d’exercices.', ['materielSport']);
    const douleur = (p.contraintes || []).indexOf('douleur') >= 0;
    const zones = douleur ? (Array.isArray(p.zonesDouleur) && p.zonesDouleur.length ? p.zonesDouleur.filter(z => z !== 'autre') : null) : [];
    if (douleur && !zones) d('douleur', 'impacts exclus', 'Douleur déclarée sans zone précisée : Cap retire les sauts et te demande la zone concernée.', ['zonesDouleur']);
    if (zones && zones.length) d('douleur', zones.join(', '), 'Exercices qui sollicitent fortement ' + zones.join(', ') + ' retirés. Fais valider le programme par un kiné ou un médecin.', ['zonesDouleur']);
    const pr = priorite(p, mineur, niv, d);
    const P = parametresSeries(pr, niv, mineur);
    const echauffement = pr === 'force' ? 8 : 6;

    // 4. Séances
    const split = SPLITS[muscu];
    d('decoupage', split.map(k => TEMPLATES[k][0]).join(' / '), muscu <= 3 ? muscu + ' séance(s) : corps complet, chaque muscle travaillé ' + muscu + ' fois par semaine.' : muscu === 4 ? '4 séances : haut / bas du corps, chaque muscle 2 fois par semaine.' : muscu + ' séances : poussée / tirage / jambes.', ['jours', 'niveau']);
    const compatibles = pattern => LIB.filter(e => e.pattern === pattern && mat.liste.indexOf(e.mat) >= 0 && (e.requiert || []).every(r => mat.liste.indexOf(r) >= 0) && e.niv <= niv
      && !(zones === null && e.impact) && !(zones && e.zones.some(z => zones.indexOf(z) >= 0)) && !(mineur && e.mineur === false))
      .sort((a, b) => (niv === 1 ? a.tech - b.tech : 0) || (RANG_MAT[b.mat] - RANG_MAT[a.mat]) || LIB.indexOf(a) - LIB.indexOf(b));
    const replis = {};
    const vus = {}; const volume = {}; const sansExo = [];
    const dureeSerie = k => 40 + P[k][2];
    const seances = split.map((key, i) => {
      const [nom, objectif, patterns] = TEMPLATES[key];
      const ex = []; let total = echauffement * 60, seriesTot = 0; const utilises = {};
      for (const pat of patterns) {
        let c = compatibles(pat).filter(e => !utilises[e.id]);
        if (!c.length && REPLI[pat]) { c = compatibles(REPLI[pat]).filter(e => !utilises[e.id]); if (c.length) replis[pat] = REPLI[pat]; }
        if (!c.length) { if (sansExo.indexOf(pat) < 0) sansExo.push(pat); continue; }
        if (p.lieu === 'salle') { const charges = c.filter(e => e.mat !== 'aucun' && e.mat !== 'elastique'); if (charges.length) c = charges; }
        // Variété d'une séance à l'autre, mais seulement parmi les 2 meilleurs choix
        const top = c.slice(0, 2);
        const n = vus[pat] || 0; vus[pat] = n + 1;
        const e = top[n % top.length], alt = c.find(x => x !== e) || null;
        const k = e.type === 'cardio' ? 'core' : e.type;
        let s = P[k][0];
        if (pr === 'force' && ex.length >= 2 && k === 'poly') s = 3;
        let du = s * dureeSerie(k) + 60;
        if (total + du > minutes * 60) { if (ex.length < 2) { s = Math.max(2, s - 1); du = s * dureeSerie(k) + 60; } else break; }
        if (total + du > minutes * 60 && ex.length >= 2) break;
        if (seriesTot + s > MAX_SERIES_SEANCE[niv]) break;
        total += du; seriesTot += s; utilises[e.id] = 1;
        const m = MUSCLES[pat]; volume[m] = (volume[m] || 0) + s;
        ex.push({ id: e.id, nom: e.nom, alternative: alt ? alt.nom : null, alternativeId: alt ? alt.id : null, series: s, reps: e.reps === 'temps' ? '30-45 s' : P[k][1], repos: P[k][2], type: k, consigne: e.consigne, pattern: pat });
      }
      let finisher = null;
      if (pr === 'forme' && minutes * 60 - total >= 8 * 60) { const cc = compatibles('cardio')[0]; if (cc) { finisher = { id: cc.id, nom: cc.nom + ' (finisher)', alternative: null, series: 1, reps: '8 min', repos: 0, type: 'cardio', consigne: cc.consigne, pattern: 'cardio' }; ex.push(finisher); total += 8 * 60; } }
      return { cle: key + (split.indexOf(key) < i ? '2' : ''), modele: key, nom, objectif, duree: Math.round(total / 60), niveau: p.niveau, echauffement: echauffement + ' min : 3 min de cardio léger, mobilité, puis 2 séries légères du premier exercice', exercices: ex, series: seriesTot };
    });
    if (Object.keys(replis).length) d('substitution', Object.keys(replis).map(k => MUSCLES[k] + ' → ' + MUSCLES[replis[k]]).join(', '), 'Pas d’exercice adapté à ton niveau et ton matériel pour certains mouvements : Cap les remplace par le mouvement le plus proche.', ['materielSport', 'niveau']);
    if (sansExo.length) d('compatibilite', sansExo.map(x => MUSCLES[x]).join(', '), 'Aucun exercice de la bibliothèque n’est compatible avec ton matériel, ton niveau ou tes douleurs pour : ' + sansExo.map(x => MUSCLES[x]).join(', ') + '.', ['materielSport', 'zonesDouleur', 'niveau']);
    const cardioEx = compatibles('cardio')[0] || PAR_ID.marche_rapide;
    for (let i = 0; i < cardio; i++) seances.push({ cle: 'C' + (i + 1), modele: 'C', nom: 'Cardio doux', objectif: 'Récupération active et dépense', duree: Math.min(minutes, 40), niveau: p.niveau, echauffement: 'Aucun', exercices: [{ id: cardioEx.id, nom: cardioEx.nom, alternative: 'Marche rapide', series: 1, reps: Math.min(minutes, 40) + ' min', repos: 0, type: 'cardio', consigne: cardioEx.consigne, pattern: 'cardio' }], series: 0 });

    // 5. Volume hebdomadaire vérifié
    const [vMin, vMax] = VOLUME[niv];
    const sousVol = Object.keys(volume).filter(m => m !== 'gainage' && volume[m] < vMin);
    d('volume', Object.keys(volume).map(m => m + ' ' + volume[m]).join(', '), 'Séries par semaine et par muscle. Repère pour ton niveau : ' + vMin + ' à ' + vMax + '.' + (sousVol.length ? ' Sous le repère : ' + sousVol.join(', ') + ' (limité par ' + (minutes < 45 ? 'la durée des séances' : 'le nombre de séances') + ').' : ''), ['jours', 'minutes', 'niveau']);
    d('series', P.poly[0] + ' × ' + P.poly[1] + ', repos ' + P.poly[2] + ' s', 'Priorité « ' + pr + ' » : ' + (pr === 'force' ? 'peu de répétitions, charges lourdes, repos longs.' : pr === 'muscle' ? 'zone de 6 à 15 répétitions proche de l’échec, efficace pour le volume musculaire.' : 'répétitions plus nombreuses, repos courts, dépense plus élevée.') + (mineur ? ' Moins de 18 ans : jamais moins de 8 répétitions.' : ''), ['prioriteSport', 'objectif', 'age']);

    const jsem = JOURS_SEMAINE[jours];
    const planning = seances.map((s, i) => ({ jour: jsem[i], jourNom: NOMS_JOURS[jsem[i]], seance: s.cle }));
    const progression = (niv === 1 ? 'Double progression : quand tu atteins le haut de la fourchette sur toutes les séries en gardant 2 répétitions en réserve, augmente la charge (2,5 kg) ou passe à la variante plus difficile.' : 'Double progression, puis une semaine allégée (séries divisées par deux) toutes les 6 semaines.') + (mineur ? ' Avant 18 ans : pas de charge maximale, la technique passe avant le poids.' : '');
    const notes = [];
    if (cardio) notes.push('Débutant : ' + muscu + ' séances de musculation maximum, les ' + cardio + ' autres jours deviennent du cardio doux. La récupération fait progresser autant que l’entraînement.');
    if (douleur) notes.push('Douleur ou blessure déclarée : saute tout exercice qui fait mal et fais valider le programme par un kiné ou un médecin.');
    if ((p.contraintes || []).indexOf('sante') >= 0) notes.push('Problème de santé suivi : demande l’accord de ton médecin avant de commencer.');
    if (p.obstacle === 'motivation') notes.push('Motivation : un objectif court toutes les 2 semaines (ajouter une répétition par exercice) plutôt qu’un seul objectif lointain.');
    if (p.objectif === 'perdre') notes.push('Perte de gras : la musculation garde le muscle ; ajoute 8 000 à 10 000 pas par jour pour la dépense.');
    const parametres = { age, niveau: p.niveau, jours: num(p.jours), joursRetenus: jours, minutes: num(p.minutes), minutesRetenues: minutes, lieu: p.lieu, materiel: mat.liste, zones, priorite: pr, tempsLibre: p.tempsLibre, heuresProjet: projetH, autreSport: p.autreSport || 0, obstacle: p.obstacle || null };
    return { ok: true, origine: 'calcul', version: VERSION, seances, planning, progression, notes, decisions, volume, parametres, empreinte: empreinte({ seances, planning, notes }) };
  }
  function empreinte(v) { const s = JSON.stringify(v); let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); }
  // Explication en langage clair des décisions (sert au coach, avec ou sans IA)
  function expliquer(prog) {
    if (!prog || !prog.ok) return (prog && prog.message) || 'Programme indisponible.';
    return prog.decisions.map(x => '• ' + x.raison).join('\n');
  }
  return { VERSION, LIB, PAR_ID, TEMPLATES, VOLUME, NIV, generer, expliquer, materielDispo };
});
