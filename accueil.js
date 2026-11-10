/* Cap — « Aujourd'hui » : ce qui compte maintenant.
 * Une seule priorité, choisie par des règles fixes (ordre ci-dessous), une action, puis l'état MESURÉ de chaque module.
 * Aucun score global, aucune série ni progression qui ne soit pas mesurée. Les chiffres détaillés vivent dans Journal et Parcours.
 * Ordre des priorités : réponse bloquante → budget en déficit → séance prévue non faite → pesée de la semaine
 *   → action argent de la semaine → prochaine tâche du projet → premier repas du jour → rien d'urgent. */
(function () {
  'use strict';
  const U = () => window.CapUI;
  const J = () => window.CapJournal;

  // Liste ordonnée des choses à faire aujourd'hui ; la première est la priorité, les suivantes « Ensuite ».
  function candidats(d) {
    const { S, dayId, eur, fr, fmtD } = U(), S0 = S, t = dayId(), now = new Date(), out = [];
    const bloq = d.issues.filter(i => i.niveau === 'bloquant');
    if (bloq.length) {
      const i = bloq[0], f = i.fixes[0];
      out.push({ id: 'bloquant', mod: i.domaine, titre: i.titre, texte: i.texte, cta: f ? f.label : 'Revoir mes réponses', go: () => U().editStep(U().STEP_BY_FIELD[f ? f.champ : i.champs[0]] || (f ? f.champ : i.champs[0])) });
    }
    if (d.argent && d.fin && d.fin.ok && d.fin.capacite < 0) out.push({ id: 'deficit', mod: 'argent', titre: 'Ton budget est en déficit', texte: 'Tu dépenses ' + eur(-d.fin.capacite) + ' de plus que tu ne gagnes chaque mois, d’après tes réponses.', cta: 'Voir mon budget', go: () => U().aller('parcours', 'argent') });
    if (d.corps && d.prog && d.prog.ok) {
      const x = U().seanceDuJour(t), se = x && x.se;
      const faite = S0.seances.some(l => l.date === t);
      if (se && !faite) out.push({ id: 'seance', mod: 'corps', titre: se.nom, texte: se.duree + ' min · ' + se.exercices.length + ' exercice' + (se.exercices.length > 1 ? 's' : '') + ' · ' + se.objectif, cta: 'Commencer la séance', go: () => U().lancerSeance(se) });
    }
    if (d.corps && d.phys && d.phys.ok) {
      const last = window.CapEngine.tendance(S0.pesees).dernier;
      if (!last || (new Date(t) - new Date(last.date)) / 864e5 >= 7) out.push({ id: 'pesee', mod: 'corps', titre: 'Pesée de la semaine', texte: last ? 'Dernière pesée le ' + fmtD(last.date) + '. Le matin, à jeun.' : 'Aucune pesée encore. Le matin, à jeun, une fois par semaine.', cta: 'Me peser', go: () => U().addPesee() });
    }
    if (d.argent && d.fin && d.fin.ok && d.fin.capacite >= 0 && !(S0.actions.done || {}).argent) out.push({ id: 'argent', mod: 'argent', titre: 'Action argent de la semaine', texte: d.fin.niveaux.action.texte, cta: 'C’est fait', go: () => U().cocherAction('argent') });
    if (d.entreprise && d.baction && d.baction.ok) {
      const tc = d.baction.taches.find(x => !x.fait);
      if (tc) out.push({ id: 'tache', mod: 'projet', titre: tc.titre, texte: (tc.critere ? 'Terminé quand : ' + tc.critere + '. ' : '') + '≈ ' + fr(tc.heures, tc.heures % 1 ? 1 : 0) + ' h.', cta: 'Ouvrir mon plan', go: () => U().aller('parcours', 'projet') });
    } else if (d.entreprise && d.business && d.business.ok && !d.choisi) out.push({ id: 'choisir', mod: 'projet', titre: 'Choisir ton activité', texte: 'Cap a classé ' + d.business.top.length + ' activités compatibles avec ton temps, ton capital et ton âge.', cta: 'Voir les options', go: () => U().aller('parcours', 'projet') });
    if (d.corps && d.phys && d.phys.ok) {
      const j = S0.journaux[t];
      if (!j || !(j.items || []).length) out.push({ id: 'repas', mod: 'corps', titre: 'Noter ton premier repas', texte: 'Rien n’est noté aujourd’hui. Cap n’estime rien à ta place.', cta: 'Ajouter un repas', go: () => U().aller('journal') });
    }
    return out;
  }

  // État mesuré de chaque module : uniquement des valeurs enregistrées, avec leur date ; sinon « pas encore mesuré ».
  function etats(d) {
    const { S, fr, eur, fmtD, wfmt } = U(), out = [];
    if (d.corps) {
      const last = window.CapEngine.tendance(S.pesees).dernier;
      const a = d.adapt || {};
      out.push({ mod: 'corps', nom: 'Corps', fait: last ? wfmt(last.poids) : null, detail: last ? 'Pesé le ' + fmtD(last.date) + (a.prevues ? ' · ' + a.faites + ' séance' + (a.faites > 1 ? 's' : '') + ' sur ' + a.prevues + ' en 14 jours' : '') : 'Aucune pesée enregistrée' });
    }
    if (d.argent && d.fin && d.fin.ok) {
      const mv = S.epargne.filter(m => typeof m.montant === 'number');
      out.push({ mod: 'argent', nom: 'Argent', fait: eur(Math.max(0, d.fin.actuelle)), detail: mv.length ? 'Épargne réelle · ' + mv.length + ' mouvement' + (mv.length > 1 ? 's' : '') + ' noté' + (mv.length > 1 ? 's' : '') : 'Épargne de départ déclarée · aucun mouvement noté' });
    }
    if (d.entreprise) {
      const v = S.ventes || [], tot = v.reduce((s, x) => s + (x.montant || 0), 0), ba = d.baction;
      out.push({ mod: 'projet', nom: 'Projet', fait: v.length ? eur(tot) : null, detail: (v.length ? v.length + ' vente' + (v.length > 1 ? 's' : '') + ' réelle' + (v.length > 1 ? 's' : '') : 'Aucune vente encore') + (ba && ba.ok ? ' · ' + ba.faites + ' tâche' + (ba.faites > 1 ? 's' : '') + ' sur ' + ba.total : '') });
    }
    return out;
  }

  // ---------- Flamme de régularité (règles dans flammes.js, affichées dans la feuille) ----------
  function entreeFlamme(d) {
    const { S, dayId } = U(), act = {};
    const add = (date, k, n) => { if (!date) return; date = String(date).slice(0, 10); act[date] = act[date] || {}; act[date][k] = (act[date][k] || 0) + (n || 1); };
    Object.keys(S.journaux || {}).forEach(k => { const it = (S.journaux[k].items || []); if (it.length) { add(k, 'repas', it.length); act[k].kcal = it.reduce((s2, x) => s2 + (x.k || 0), 0); } });
    S.seances.forEach(l => add(l.date, 'seance'));
    S.pesees.forEach(r => add(r.date, 'pesee'));
    Object.keys(S.taches || {}).forEach(k => { const t = S.taches[k]; if (t && t.fait) add(t.date, 'tache'); });
    S.epargne.forEach(m => add(m.date, 'epargne'));
    (S.ventes || []).forEach(v => add(v.date, 'vente'));
    Object.keys((S.prefs && S.prefs.reports) || {}).forEach(k => { act[k] = act[k] || {}; act[k].reporte = 1; });
    const plan = d.corps && d.prog && d.prog.ok ? d.prog.planning.map(x => x.jour) : null;
    const debut = (d.p.creeLe || '').slice(0, 10) || Object.keys(act).sort()[0] || dayId();
    return { aujourdHui: dayId(), debut: Object.keys(act).sort()[0] && Object.keys(act).sort()[0] < debut ? Object.keys(act).sort()[0] : debut, activites: act, joursSeance: plan, seancesSemaine: plan ? plan.length : 0, plancher: d.corps && d.phys && d.phys.ok ? d.phys.plancher : null };
  }
  function flammeSVG(n, grande) {
    // Flamme originale de Cap : trois langues superposées, la plus claire au centre ; s'éteint en gris à 0.
    const id = 'fl' + Math.random().toString(36).slice(2, 7), vide = !n;
    return '<svg class="flm' + (grande ? ' grande' : '') + (vide ? ' eteinte' : '') + '" viewBox="0 0 64 80" aria-hidden="true"><defs>' +
      '<linearGradient id="' + id + 'a" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + (vide ? '#B9BBC0' : '#E8553A') + '"/><stop offset="1" stop-color="' + (vide ? '#D7D8DC' : '#F59A3C') + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'b" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + (vide ? '#D7D8DC' : '#F7B25A') + '"/><stop offset="1" stop-color="' + (vide ? '#ECEDEF' : '#FFE3A3') + '"/></linearGradient></defs>' +
      '<g class="flm-ext"><path d="M32 4C38 18 54 28 54 48a22 22 0 0 1-44 0c0-10 5-17 10-22 1 7 4 11 8 13-2-13 2-25 4-35z" fill="url(#' + id + 'a)"/></g>' +
      '<g class="flm-int"><path d="M33 30c4 8 12 13 12 23a13 13 0 0 1-26 0c0-6 3-10 6-13 1 4 3 6 5 7-1-7 1-12 3-17z" fill="url(#' + id + 'b)"/></g>' +
      (vide ? '' : '<g class="flm-coeur"><ellipse cx="32" cy="62" rx="6" ry="7" fill="#FFF6E0"/></g>') + '</svg>';
  }
  function feuilleFlamme(r) {
    const { h, sheet, fmtD } = U();
    const NOMS = { actif: 'Jour compté', repos: 'Repos prévu (pause)', couvert: 'Oubli couvert', neutre: 'Neutre', manque: 'Non compté', attente: 'En cours', avant: '' };
    const jours = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const premier = r.calendrier[0].date, decal = (new Date(premier + 'T12:00:00Z').getUTCDay() + 6) % 7;
    const cases = [];
    for (let i = 0; i < decal; i++) cases.push(h('span', { class: 'fl-c vide-c', 'aria-hidden': 'true' }));
    r.calendrier.forEach(c => cases.push(h('span', { class: 'fl-c ' + c.etat, title: fmtD(c.date) + ' : ' + (NOMS[c.etat] || '') + (c.motifs.length ? ' (' + c.motifs.join(', ') + ')' : ''), role: 'img', 'aria-label': fmtD(c.date) + ' : ' + (NOMS[c.etat] || 'avant le début') + (c.motifs.length ? ', ' + c.motifs.join(', ') : '') }, String(Number(c.date.slice(8))))));
    const sem = r.semaine, types = Object.keys(sem.parType).map(k => sem.parType[k] + ' ' + k + (sem.parType[k] > 1 && !/s$/.test(k) ? 's' : '')).join(', ');
    sheet('Régularité', [
      h('div', { class: 'fl-hero' }, h('div', { class: 'fl-icone', html: flammeSVG(r.serie, true) }), h('div', null, h('p', { class: 'fl-n num' }, String(r.serie)), h('p', { class: 'fl-l' }, r.serie > 1 ? 'jours d’affilée' : r.serie === 1 ? 'jour' : 'Ta flamme démarre au premier jour compté.'))),
      h('dl', { class: 'fl-chiffres' }, h('dt', null, 'Record'), h('dd', { class: 'num' }, r.record + ' j'), h('dt', null, 'Cette semaine'), h('dd', null, sem.actifs + ' jour' + (sem.actifs > 1 ? 's' : '') + ' compté' + (sem.actifs > 1 ? 's' : '') + (types ? ' (' + types + ')' : '')), r.prochain ? [h('dt', null, 'Prochain palier'), h('dd', null, r.prochain.nom + ' dans ' + r.prochain.reste + ' jour' + (r.prochain.reste > 1 ? 's' : ''))] : null),
      h('h3', { class: 'fl-h' }, '5 dernières semaines'),
      h('div', { class: 'fl-cal' }, jours.map(j => h('span', { class: 'fl-j', 'aria-hidden': 'true' }, j)), cases),
      h('p', { class: 'fl-leg' }, h('span', { class: 'fl-c actif mini' }), ' compté ', h('span', { class: 'fl-c repos mini' }), ' repos prévu ', h('span', { class: 'fl-c couvert mini' }), ' oubli couvert ', h('span', { class: 'fl-c manque mini' }), ' non compté'),
      h('h3', { class: 'fl-h' }, 'Paliers'),
      h('ul', { class: 'fl-paliers' }, r.paliers.map(p => h('li', { class: p.atteint ? 'ok' : '' }, h('span', { class: 'fl-pi', 'aria-hidden': 'true', html: p.atteint ? flammeSVG(1) : flammeSVG(0) }), h('span', null, p.nom), h('small', null, p.jours + ' j' + (p.atteint ? ' · atteint' : ''))))),
      r.historique.length ? h('details', { class: 'pg-det' }, h('summary', null, 'Séries passées'), h('ul', { class: 'td-liste' }, r.historique.map(x => h('li', { class: 'pr-jalon' }, h('span', null, fmtD(x.debut) + ' → ' + fmtD(x.fin)), h('b', { class: 'num' }, x.jours + ' j'))))) : null,
      h('details', { class: 'pg-det', open: true }, h('summary', null, 'Comment la flamme est calculée'), h('ul', null,
        h('li', null, 'Un jour compte avec au moins une action réelle enregistrée : séance faite, pesée, tâche du projet terminée, épargne ou vente notée, ou repas notés atteignant ton minimum de sécurité.'),
        h('li', null, 'Faire plus ne rapporte rien de plus : un jour reste un jour.'),
        h('li', null, 'Des repas sous ton minimum de sécurité ne font pas gagner de jour, et les séances au-delà de ton programme non plus. Cap ne récompense ni les restrictions ni le surentraînement.'),
        h('li', null, 'Un repos prévu par ton programme met la flamme en pause. Un oubli par semaine est couvert automatiquement.'),
        h('li', null, 'Les jours suivent l’heure de ton téléphone. Aujourd’hui n’est jamais compté comme manqué.')))
    ], { focus: false });
  }

  function view(d) {
    const { h, icon, dayId } = U();
    const c = candidats(d), prio = c[0], suite = c.slice(1, 4), out = [];
    const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    let fl = null;
    try { fl = window.CapFlammes ? window.CapFlammes.calculer(entreeFlamme(d)) : null; } catch (e) { fl = null; }
    const prenom = (d.p.prenom || '').trim();
    out.push(h('header', { class: 'td-head' }, h('div', { class: 'td-head-l' }, h('p', { class: 'td-date' }, date), h('h1', { class: 'td-titre' }, prenom ? 'Bonjour ' + prenom : 'Aujourd’hui')),
      h('div', { class: 'pc-acts' },
        fl ? h('button', { class: 'td-flamme' + (fl.aujourdhui === 'actif' ? ' allumee' : ''), type: 'button', 'aria-label': 'Flamme de régularité : ' + fl.serie + ' jour' + (fl.serie > 1 ? 's' : '') + (fl.aujourdhui === 'actif' ? ', aujourd’hui compté' : ', aujourd’hui pas encore compté'), onclick: () => feuilleFlamme(fl) }, h('span', { class: 'td-flamme-i', html: flammeSVG(fl.serie) }), h('b', { class: 'num' }, String(fl.serie))) : null,
        h('button', { class: 'round press pc-coach', type: 'button', 'aria-label': 'Ouvrir le coach', onclick: () => (window.CapCoach ? window.CapCoach.ouvrir(d) : window.CapJournal.coach(d)) }, U().icon('chat')))));
    if (prio) {
      out.push(h('section', { class: 'td-prio mod-' + prio.mod, 'aria-labelledby': 'td-prio-t' },
        h('p', { class: 'td-prio-k' }, 'Priorité'),
        h('h2', { id: 'td-prio-t', class: 'td-prio-t' }, prio.titre),
        h('p', { class: 'td-prio-x' }, prio.texte),
        h('button', { class: 'btn td-prio-go', type: 'button', onclick: prio.go }, prio.cta)));
    } else {
      out.push(h('section', { class: 'td-prio calme' }, h('p', { class: 'td-prio-k' }, 'Priorité'), h('h2', { class: 'td-prio-t' }, 'Rien d’urgent aujourd’hui.'), h('p', { class: 'td-prio-x' }, 'Tout ce qui était prévu est fait ou noté. Tu peux relire ta progression dans Parcours.')));
    }
    if (suite.length) out.push(h('section', { class: 'td-bloc', 'aria-labelledby': 'td-suite' }, h('h2', { id: 'td-suite', class: 'td-h' }, 'Ensuite'),
      h('ul', { class: 'td-liste' }, suite.map(x => h('li', null, h('button', { class: 'td-ligne mod-' + x.mod, type: 'button', onclick: x.go }, h('span', { class: 'td-pastille', 'aria-hidden': 'true' }), h('span', { class: 'td-l' }, h('b', null, x.titre), h('small', null, x.cta)), icon('chev', 'chev')))))));
    const et = etats(d);
    if (et.length) out.push(h('section', { class: 'td-bloc', 'aria-labelledby': 'td-etat' }, h('h2', { id: 'td-etat', class: 'td-h' }, 'Où tu en es'),
      h('div', { class: 'td-etats' }, et.map(e => h('button', { class: 'td-etat mod-' + e.mod, type: 'button', onclick: () => U().aller('parcours', e.mod), 'aria-label': e.nom + ' : ' + (e.fait || 'pas encore mesuré') + '. ' + e.detail },
        h('span', { class: 'td-etat-n' }, e.nom), h('b', { class: 'td-etat-v' + (e.fait ? '' : ' vide') }, e.fait || 'Pas encore mesuré'), h('small', null, e.detail))))));
    const imp = d.issues.filter(i => i.niveau !== 'info' && i.niveau !== 'bloquant');
    if (imp.length) out.push(h('details', { class: 'td-verif' }, h('summary', null, imp.length + ' point' + (imp.length > 1 ? 's' : '') + ' à vérifier'), imp.map(i => U().issueView(i, ch => U().editStep(U().STEP_BY_FIELD[ch] || ch)))));
    return out;
  }
  const API = { view, candidats, etats, entreeFlamme };
  if (typeof module === 'object' && module.exports) module.exports = API; else window.CapAccueil = API;
})();
