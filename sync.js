/* Cap — export, import et fusion des données. Fonctions pures (aucun accès réseau ni stockage),
 * testées sous Node (dev/tests/sync-tests.js).
 * Règles : on ne supprime jamais un document absent de l'import ; un conflit (même identifiant,
 * contenu différent) n'est jamais résolu en silence ; un profil différent est signalé à part. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CapSync = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const FORMAT = 1;
  const COLLS = ['profil', 'pesees', 'repas', 'epargne', 'seances', 'actions', 'prefs', 'aliments', 'recettes', 'photos', 'historique'];
  // Photos : fichiers stockés dans l'espace Claude, non transférables ; seules leurs fiches voyagent.
  const NON_TRANSFERABLES = ['photos'];
  const NOMS = { profil: 'profil', pesees: 'pesées', repas: 'jours de journal', epargne: 'mouvements d’épargne', seances: 'séances', actions: 'semaines d’actions', prefs: 'préférences', aliments: 'aliments perso', recettes: 'recettes', photos: 'photos', historique: 'anciennes versions du profil' };

  const NOMS1 = { profil: 'profil', pesees: 'pesée', repas: 'jour de journal', epargne: 'mouvement d’épargne', seances: 'séance', actions: 'semaine d’actions', prefs: 'préférences', aliments: 'aliment perso', recettes: 'recette', photos: 'photo', historique: 'ancienne version du profil' };
  const libelle = (c, n) => n + ' ' + (n === 1 ? NOMS1[c] : NOMS[c]);
  // JSON à clés triées : deux objets égaux donnent toujours la même chaîne
  function stable(v) {
    if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  }
  // FNV-1a 32 bits : détecte une sauvegarde tronquée ou modifiée (pas une protection cryptographique)
  function empreinte(v) {
    const s = stable(v); let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  const egal = (a, b) => stable(a) === stable(b);
  function vide() { const o = {}; COLLS.forEach(c => { o[c] = {}; }); return o; }
  function normaliser(data) {
    const o = vide();
    COLLS.forEach(c => { const src = data && data[c]; if (src && typeof src === 'object' && !Array.isArray(src)) Object.keys(src).forEach(id => { if (src[id] && typeof src[id] === 'object') o[c][id] = src[id]; }); });
    return o;
  }
  function comptes(data) { const n = {}; COLLS.forEach(c => { n[c] = Object.keys((data && data[c]) || {}).length; }); return n; }
  function total(data) { return COLLS.reduce((s, c) => s + Object.keys((data && data[c]) || {}).length, 0); }

  function creerExport(data, source, maintenant) {
    const collections = normaliser(data);
    return { app: 'cap', format: FORMAT, source: source || 'inconnue', exporte_le: (maintenant || new Date()).toISOString(), comptes: comptes(collections), empreinte: empreinte(collections), collections };
  }

  // Contrôles de type minimaux : on refuse ce que l'appli ne saurait pas afficher
  const num = (x, a, b) => typeof x === 'number' && isFinite(x) && x >= a && x <= b;
  const date = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}/.test(x);
  const CONTROLES = {
    pesees: d => date(d.date) && num(d.poids, 20, 400),
    epargne: d => date(d.date) && num(d.montant, -1e9, 1e9),
    repas: d => date(d.date),
    seances: d => date(d.date),
    profil: d => typeof d === 'object'
  };

  function lireExport(entree) {
    const erreurs = [], avertissements = [];
    let obj = entree;
    if (typeof entree === 'string') { try { obj = JSON.parse(entree); } catch (e) { return { ok: false, erreurs: ['Ce fichier n’est pas un JSON lisible (copie incomplète ?).'], avertissements }; } }
    if (!obj || typeof obj !== 'object') return { ok: false, erreurs: ['Fichier vide ou illisible.'], avertissements };
    if (obj.app !== 'cap') return { ok: false, erreurs: ['Ce fichier ne vient pas de Cap.'], avertissements };
    if (obj.format !== FORMAT) return { ok: false, erreurs: ['Format de sauvegarde ' + obj.format + ' non pris en charge (attendu : ' + FORMAT + ').'], avertissements };
    if (!obj.collections || typeof obj.collections !== 'object') return { ok: false, erreurs: ['Aucune donnée dans ce fichier.'], avertissements };
    const inconnues = Object.keys(obj.collections).filter(c => COLLS.indexOf(c) < 0);
    if (inconnues.length) avertissements.push('Rubriques ignorées : ' + inconnues.join(', ') + '.');
    const data = normaliser(obj.collections);
    if (obj.empreinte && empreinte(normaliser(obj.collections)) !== obj.empreinte) erreurs.push('Empreinte différente : le fichier a été modifié ou tronqué. Import bloqué.');
    let rejetes = 0;
    Object.keys(CONTROLES).forEach(c => Object.keys(data[c]).forEach(id => { if (!CONTROLES[c](data[c][id])) { delete data[c][id]; rejetes++; } }));
    if (rejetes) avertissements.push(rejetes + ' élément(s) invalide(s) écarté(s).');
    NON_TRANSFERABLES.forEach(c => { const n = Object.keys(data[c]).length; if (n) { avertissements.push(n + ' photo(s) non transférée(s) : les fichiers restent dans l’espace Claude d’origine.'); data[c] = {}; } });
    if (!total(data) && !erreurs.length) erreurs.push('Ce fichier ne contient aucune donnée utilisable.');
    return { ok: !erreurs.length, erreurs, avertissements, data, source: obj.source, exporte_le: obj.exporte_le };
  }

  // Compare deux jeux de données, document par document
  function planifier(actuel, entrant) {
    const A = normaliser(actuel), B = normaliser(entrant);
    const parColl = {}; const t = { nouveaux: 0, identiques: 0, conflits: 0 };
    COLLS.forEach(c => {
      const r = { nouveaux: [], identiques: [], conflits: [] };
      Object.keys(B[c]).forEach(id => {
        if (!(id in A[c])) r.nouveaux.push(id);
        else if (egal(A[c][id], B[c][id])) r.identiques.push(id);
        else r.conflits.push(id);
      });
      parColl[c] = r; t.nouveaux += r.nouveaux.length; t.identiques += r.identiques.length; t.conflits += r.conflits.length;
    });
    const profilA = A.profil.main, profilB = B.profil.main;
    return { parColl, total: t, profilsDifferents: !!(profilA && profilB && !egal(profilA, profilB)), actuelVide: total(A) === 0, entrantVide: total(B) === 0 };
  }

  // mode 'garder'   : ajoute les nouveaux, garde la version actuelle en cas de conflit
  // mode 'remplacer': ajoute les nouveaux, prend la version importée en cas de conflit
  // Renvoie la liste des écritures à faire ; l'ancienne version d'un profil remplacé part dans l'historique.
  function ecritures(actuel, entrant, mode, maintenant) {
    if (mode !== 'garder' && mode !== 'remplacer') throw new Error('mode inconnu : ' + mode);
    const A = normaliser(actuel), B = normaliser(entrant), plan = planifier(A, B), out = [];
    COLLS.forEach(c => {
      plan.parColl[c].nouveaux.forEach(id => out.push({ coll: c, id, data: B[c][id] }));
      if (mode === 'remplacer') plan.parColl[c].conflits.forEach(id => out.push({ coll: c, id, data: B[c][id] }));
    });
    if (mode === 'remplacer' && plan.profilsDifferents) {
      const quand = (maintenant || new Date()).toISOString();
      out.unshift({ coll: 'historique', id: 'p-' + quand.replace(/[^0-9]/g, ''), data: { date: quand, raison: 'import', profil: A.profil.main } });
    }
    return out;
  }
  function appliquer(actuel, liste) {
    const o = normaliser(actuel);
    liste.forEach(w => { o[w.coll][w.id] = w.data; });
    return o;
  }
  function resume(plan) {
    const lignes = [];
    COLLS.forEach(c => { const r = plan.parColl[c]; const n = r.nouveaux.length, k = r.conflits.length; if (n || k) lignes.push({ coll: c, nom: NOMS[c], nouveaux: n, conflits: k, identiques: r.identiques.length }); });
    return lignes;
  }
  return { FORMAT, COLLS, NOMS, libelle, stable, empreinte, egal, vide, normaliser, comptes, total, creerExport, lireExport, planifier, ecritures, appliquer, resume };
});
