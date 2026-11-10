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
      const pl = d.prog.planning.find(x => x.jour === now.getDay()), se = pl && d.prog.seances.find(x => x.cle === pl.seance);
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

  function view(d) {
    const { h, icon, dayId } = U();
    const c = candidats(d), prio = c[0], suite = c.slice(1, 4), out = [];
    const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    out.push(h('header', { class: 'td-head' }, h('p', { class: 'td-date' }, date), h('h1', { class: 'td-titre' }, 'Aujourd’hui')));
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
  const API = { view, candidats, etats };
  if (typeof module === 'object' && module.exports) module.exports = API; else window.CapAccueil = API;
})();
