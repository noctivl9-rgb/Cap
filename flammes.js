/* Cap — flamme de régularité. Fonctions pures (aucun accès au DOM ni au stockage) : testables sous Node.
 *
 * Règles (affichées telles quelles dans l'appli) :
 *  1. Un jour compte s'il contient au moins une action réelle enregistrée : une séance faite, une pesée, une tâche
 *     du projet terminée, un mouvement d'épargne, une vente, ou des repas notés dont le total atteint ton minimum
 *     de sécurité. Un seul jour, quel que soit le nombre d'actions : en faire plus ne rapporte rien de plus.
 *  2. Des repas notés sous le minimum de sécurité ne font pas gagner de jour (Cap ne récompense jamais le fait de
 *     manger trop peu), mais ne cassent pas la flamme non plus : le jour est « neutre ».
 *  3. Les séances au-delà du programme (+1 par semaine toléré) ne comptent pas : pas de récompense au surentraînement.
 *  4. Un jour de repos prévu par ton programme, ou une séance reportée, met la flamme en pause sans la casser.
 *  5. Un oubli par semaine (lundi → dimanche) est couvert automatiquement.
 *  6. Aujourd'hui n'est jamais compté comme manqué : la journée n'est pas finie.
 * Dates : jours locaux « AAAA-MM-JJ » (fuseau de l'appareil), calculés à midi UTC pour éviter les sauts d'heure. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CapFlammes = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const PALIERS = [[3, 'Étincelle'], [7, 'Une semaine'], [14, 'Deux semaines'], [30, 'Un mois'], [60, 'Deux mois'], [100, 'Cent jours'], [180, 'Six mois'], [365, 'Une année']];
  const jour = s => Date.parse(s + 'T12:00:00Z');
  const iso = t => new Date(t).toISOString().slice(0, 10);
  const decaler = (s, n) => iso(jour(s) + n * 864e5);
  const lundi = s => { const d = new Date(jour(s)).getUTCDay(); return decaler(s, -((d + 6) % 7)); };
  const jSem = s => new Date(jour(s)).getUTCDay();

  /* entree = {
   *   aujourdHui: 'AAAA-MM-JJ', debut: 'AAAA-MM-JJ' (création du profil),
   *   activites: { 'AAAA-MM-JJ': { seance: n, pesee: n, tache: n, epargne: n, vente: n, repas: n, kcal: n } },
   *   joursSeance: [0..6] (jours prévus du programme, 0 = dimanche) ou null si pas de module Corps,
   *   seancesSemaine: n (séances prévues par semaine), plancher: kcal ou null } */
  function etats(e) {
    const out = {}, debut = e.debut && e.debut <= e.aujourdHui ? e.debut : e.aujourdHui;
    const prevuesSem = e.seancesSemaine || 0, plan = Array.isArray(e.joursSeance) ? e.joursSeance : null;
    const parSemaine = {}; // séances comptées par semaine (anti-surentraînement)
    for (let d = debut; d <= e.aujourdHui; d = decaler(d, 1)) {
      const a = e.activites[d] || {}, sem = lundi(d);
      let actif = false, neutre = false, motifs = [];
      if (a.seance) { parSemaine[sem] = (parSemaine[sem] || 0) + 1; if (!plan || parSemaine[sem] <= prevuesSem + 1) { actif = true; motifs.push('séance'); } else neutre = true; }
      if (a.pesee) { actif = true; motifs.push('pesée'); }
      if (a.tache) { actif = true; motifs.push('tâche'); }
      if (a.epargne) { actif = true; motifs.push('épargne'); }
      if (a.vente) { actif = true; motifs.push('vente'); }
      if (a.repas) { if (!e.plancher || (a.kcal || 0) >= e.plancher) { actif = true; motifs.push('repas'); } else neutre = true; }
      let etat;
      if (actif) etat = 'actif';
      else if (neutre) etat = 'neutre';
      else if (d === e.aujourdHui) etat = 'attente';
      else if (a.reporte || (plan && plan.indexOf(jSem(d)) < 0)) etat = 'repos';
      else etat = 'manque';
      out[d] = { etat, motifs };
    }
    // Un oubli par semaine couvert : le premier « manqué » de chaque semaine devient « couvert »
    const couverts = {};
    Object.keys(out).sort().forEach(d => { if (out[d].etat === 'manque') { const s = lundi(d); if (!couverts[s]) { couverts[s] = true; out[d].etat = 'couvert'; } } });
    return out;
  }
  function serie(et, jusqua) {
    let n = 0; const jours = Object.keys(et).sort();
    for (let i = jours.length - 1; i >= 0; i--) { const d = jours[i]; if (jusqua && d > jusqua) continue; const s = et[d].etat; if (s === 'actif') n++; else if (s === 'manque') break; }
    return n;
  }
  function record(et) {
    let best = 0, cur = 0;
    Object.keys(et).sort().forEach(d => { const s = et[d].etat; if (s === 'actif') { cur++; if (cur > best) best = cur; } else if (s === 'manque') cur = 0; });
    return best;
  }
  function calculer(e) {
    const et = etats(e), n = serie(et), rec = Math.max(record(et), n);
    const atteints = PALIERS.filter(p => rec >= p[0]);
    const prochain = PALIERS.find(p => n < p[0]) || null;
    const cal = []; for (let i = 34; i >= 0; i--) { const d = decaler(e.aujourdHui, -i); cal.push({ date: d, etat: et[d] ? et[d].etat : 'avant', motifs: et[d] ? et[d].motifs : [] }); }
    const lu = lundi(e.aujourdHui), sem = { actifs: 0, repos: 0, couverts: 0, parType: {} };
    for (let d = lu; d <= e.aujourdHui; d = decaler(d, 1)) { const x = et[d]; if (!x) continue; if (x.etat === 'actif') sem.actifs++; if (x.etat === 'repos') sem.repos++; if (x.etat === 'couvert') sem.couverts++; x.motifs.forEach(m => { sem.parType[m] = (sem.parType[m] || 0) + 1; }); }
    const aujourdhui = et[e.aujourdHui] ? et[e.aujourdHui].etat : 'attente';
    const historique = []; let cur = 0, dep = null;
    Object.keys(et).sort().forEach(d => { const s = et[d].etat; if (s === 'actif') { if (!cur) dep = d; cur++; } else if (s === 'manque') { if (cur >= 3) historique.push({ debut: dep, fin: decaler(d, -1), jours: cur }); cur = 0; } });
    return { serie: n, record: rec, aujourdhui, paliers: PALIERS.map(p => ({ jours: p[0], nom: p[1], atteint: rec >= p[0] })), atteints: atteints.length, prochain: prochain ? { jours: prochain[0], nom: prochain[1], reste: prochain[0] - n } : null, calendrier: cal, semaine: sem, historique: historique.reverse().slice(0, 10) };
  }
  return { calculer, etats, serie, record, PALIERS, decaler, lundi };
});
