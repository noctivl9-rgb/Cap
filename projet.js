/* Cap — onglet Projet : trois activités recommandées, plan financier, plan 30/60/90 jours, ventes réelles.
 * Tout est calculé par CapBusiness (règles). Rien n'est présenté comme généré par une IA. */
(function () {
  'use strict';
  const U = () => window.CapUI, B = () => window.CapBusiness;
  const STATUT = { compatible: 'Compatible', non_financable: 'Non finançable', rejete: 'Écartée' };

  function view(d) {
    const { h, largeTitle, section, cellKV, eur, editStep, howBtn } = U();
    const out = [largeTitle('Projet', 'Activités calculées à partir de tes réponses')];
    const ia = window.CapContrats ? window.CapContrats.statutIA(() => false) : null;
    out.push(h('div', { class: 'note' }, h('b', null, 'Classement calculé par les règles de Cap. '), 'Prix, demande et temps de prospection sont des hypothèses de départ, pas une étude de ton marché. ', ia ? 'Recherche de marché par IA : ' + (ia.actif ? 'disponible.' : 'indisponible tant que le service n’est pas activé.') : ''));
    const r = d.business;
    if (!r || !r.ok) {
      out.push(h('div', { class: 'note' }, (r && r.message) || 'Données manquantes.'));
      if (r && r.manquants) out.push(h('div', { class: 'panel flush' }, r.manquants.map(m => h('button', { class: 'cell', type: 'button', onclick: () => editStep(U().STEP_BY_FIELD[m.champ] || m.champ) }, h('span', { class: 'lbl' }, 'Répondre : ' + m.champ, h('small', null, m.raison)), U().icon('chev', 'chev')))));
      return out;
    }
    r.notes.forEach(n => out.push(h('div', { class: 'alert info' }, U().icon('info'), h('div', null, h('p', null, n)))));
    if (!r.top.length) out.push(h('div', { class: 'note' }, 'Aucune activité du catalogue n’est compatible avec ton capital, ton temps et ton âge. Regarde les raisons ci-dessous : souvent, quelques dizaines d’euros ou une heure de plus par semaine changent le résultat.'));
    if (window.CapIAUI) out.push(...window.CapIAUI.businessPanel(d));
    out.push(section(window.CapIAUI ? 'Classement calculé par Cap (catalogue)' : 'Tes trois meilleures options', null, r.top.map(x => carte(x, d))));
    out.push(h('div', { style: 'margin:0 4px' }, howBtn('Comment le classement est calculé', [
      'Filtres : âge légal, diplôme obligatoire, budget de départ (matériel manquant et 2 mois de charges compris), heures minimales.',
      'Score sur 100 : ' + Object.keys(r.poids).map(k => k + ' ' + Math.round(r.poids[k] * 100) + ' %').join(', ') + '.',
      'À score proche, une activité dont tu as déjà la compétence clé passe devant une activité à apprendre.',
      'Une seule activité par catégorie dans le top 3 quand c’est possible, pour te montrer des options différentes.',
      r.hypotheses
    ])));
    if (r.ecartes.length) out.push(section('Activités écartées', 'Avec la raison exacte. Si tes réponses changent, le classement est recalculé.', h('div', { class: 'panel flush' }, r.ecartes.map(x => h('div', { class: 'cell', style: 'align-items:flex-start' }, h('span', { class: 'lbl' }, x.nom, h('small', null, STATUT[x.statut] + ' · ' + x.raisons.join(' ')))))),
      h('div', { class: 'row-btns' }, h('button', { class: 'btn small secondary', type: 'button', onclick: () => editStep('capital') }, 'Modifier mon capital'), h('button', { class: 'btn small secondary', type: 'button', onclick: () => editStep('heuresProjet') }, 'Modifier mes heures'), h('button', { class: 'btn small secondary', type: 'button', onclick: () => editStep('competences') }, 'Modifier mes compétences'))));
    if (d.choisi && d.bplan) out.push(...planView(d));
    return out;
  }

  function carte(x, d) {
    const { h, eur } = U();
    const m = B().PAR_ID[x.id], choisi = d.choisi === x.id || (d.choisi && d.choisi.id === x.id);
    return h('div', { class: 'panel', style: 'display:flex;flex-direction:column;gap:8px;margin-bottom:12px' },
      h('div', { style: 'display:flex;justify-content:space-between;gap:12px;align-items:baseline' }, h('h3', { style: 'margin:0;font-size:17px' }, x.rang + '. ' + x.nom), h('span', { class: 'chip neutral' }, x.score + '/100')),
      h('p', { class: 'sub', style: 'margin:0' }, m.client + '. ' + m.probleme),
      h('p', { class: 'foot', style: 'margin:0' }, 'Offre : ' + m.offre),
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('b', null, eur(x.budget)), h('span', null, 'Budget de départ')),
        h('div', { class: 'stat' }, h('b', null, x.preparation ? '—' : eur(x.net6)), h('span', null, x.preparation ? 'Pas de vente avant 16 ans' : 'Net au 6e mois (scénario médian)'))),
      h('p', { class: 'foot muted', style: 'margin:0' }, x.explication),
      h('button', { class: 'btn small' + (choisi ? ' secondary' : ''), type: 'button', disabled: choisi ? true : null, onclick: () => choisir(x.id, d) }, choisi ? 'Activité choisie' : 'Choisir cette activité'));
  }
  async function choisir(id, d) {
    try { await U().saveProfil({ businessChoisi: id, debutProjet: d.p.businessChoisi === id && d.p.debutProjet ? d.p.debutProjet : U().dayId() }); U().toast('Activité choisie : plan calculé'); if (window.CapSon) window.CapSon.jouer('valider'); }
    catch (e) { U().toast('Échec de l’enregistrement, réessaie'); }
  }

  function planView(d) {
    const { h, section, cellKV, eur, howBtn, sheet, toast, put, dayId, fmtD } = U();
    const P = d.bplan, A = d.baction, out = [];
    const tag = t => h('span', { class: 'chip ' + (t === 'observe' ? 'good' : t === 'hypothese' ? 'warn' : 'neutral'), style: 'font-size:11px;padding:2px 8px' }, { observe: 'Observé', hypothese: 'Hypothèse', prevision: 'Prévision', calcul: 'Calcul', reel: 'Réel' }[t] || t);
    out.push(section('Ton activité : ' + P.nom, P.avertissement,
      h('div', { class: 'panel flush' },
        cellKV('Budget initial', eur(P.budgetInitial.total)),
        cellKV('Prix médian', eur(P.prix.median) + ' / ' + P.concept.unite),
        cellKV('Marge par ' + P.concept.unite, eur(P.margeParUnite)),
        cellKV('Seuil de rentabilité', P.seuilRentabilite ? P.seuilRentabilite.texte : 'Non calculable'),
        cellKV('Budget récupéré', P.retourInvestissement.median ? 'mois ' + P.retourInvestissement.median + ' (médian)' : 'pas dans les 12 mois (médian)')),
      h('p', { class: 'foot muted', style: 'margin:0 4px' }, 'Prix : ', tag('hypothese'), ' · Budget et seuil : ', tag('calcul'), ' · Mois futurs : ', tag('prevision'), ' · Ventes saisies : ', tag('observe'))));
    const mois = [1, 3, 6, 12];
    const ligne = (nom, sc) => h('div', { class: 'cell' }, h('span', { class: 'lbl' }, nom, h('small', null, 'Total 12 mois : ' + eur(sc.total12))), h('span', { class: 'val num' }, mois.map(i => { const x = sc.mois[i - 1]; return 'M' + i + ' ' + eur(x.net) + (x.type === 'observe' ? '*' : ''); }).join(' · ')));
    out.push(section('Scénarios de bénéfice net', 'Après cotisations et charges, avant impôt. * = mois avec ventes réelles.', h('div', { class: 'panel flush' }, ligne('Prudent', P.scenarios.prudent), ligne('Médian', P.scenarios.median), ligne('Favorable', P.scenarios.favorable)),
      h('div', { style: 'margin:0 4px' }, howBtn('Hypothèses du calcul', P.hypotheses))));
    // Ventes réelles
    const ventes = U().S.ventes.slice().sort((a, b) => b.date.localeCompare(a.date));
    out.push(section('Ventes réelles', P.observe ? P.observe.mois + ' mois avec des ventes, ' + eur(P.observe.ca) + ' encaissés. Les scénarios utilisent ces montants à la place des prévisions.' : 'Aucune vente enregistrée : tout ce qui précède est une prévision.',
      ventes.length ? h('div', { class: 'panel flush' }, ventes.map(v => cellKV(fmtD(v.date) + (v.note ? ' · ' + v.note : ''), eur(v.montant)))) : null,
      h('button', { class: 'btn small', type: 'button', onclick: () => vente() }, 'Enregistrer une vente')));
    // Plan 30/60/90
    if (A && A.ok) {
      const phases = [['fait', 'Terminé'], ['30', 'Jours 1 à 30'], ['60', 'Jours 31 à 60'], ['90', 'Jours 61 à 90'], ['apres', 'Après 90 jours']];
      out.push(section('Plan d’action', 'Calculé pour ' + A.heuresSemaine + ' h par semaine. ' + A.faites + ' tâche(s) sur ' + A.total + ' terminée(s).',
        A.alerte ? h('div', { class: 'alert warn' }, U().icon('alert'), h('div', null, h('p', null, A.alerte))) : null,
        phases.map(ph => { const ts = A.taches.filter(t => t.phase === ph[0]); if (!ts.length) return null; return h('div', { class: 'sec' }, h('div', { class: 'cap' }, ph[1]), h('div', { class: 'panel flush' }, ts.map(t => h('button', { class: 'cell', type: 'button', role: 'checkbox', 'aria-checked': String(t.fait), onclick: () => cocher(t) }, h('span', { class: 'lbl' }, t.titre, h('small', null, (t.fait ? 'Fait' + (t.faitLe ? ' le ' + fmtD(t.faitLe) : '') : 'Jours ' + t.jourDebut + ' à ' + t.jourFin + ' · ' + t.heures + ' h') + ' · Réussi si : ' + t.critere)), h('span', { class: 'switch' + (t.fait ? ' on' : '') }, h('i')))))); })));
    }
    out.push(section('Formalités', null, h('div', { class: 'panel' }, P.formalites.map(f => h('p', { class: 'sub' }, f)))));
    out.push(section('Risques', null, h('div', { class: 'panel' }, P.risques.map(f => h('p', { class: 'sub' }, f)))));
    out.push(section('Valider la demande avant d’investir', null, h('div', { class: 'note' }, P.validation)));
    return out;
  }
  async function cocher(t) {
    const { put, dayId, toast, S } = U();
    const prev = S.taches[t.cle] || {};
    const hist = (prev.historique || []).concat([{ fait: !t.fait, date: new Date().toISOString() }]);
    try { await put('taches', t.cle, { id: t.cle, fait: !t.fait, date: !t.fait ? dayId() : (prev.date || null), historique: hist }); S.taches[t.cle] = { id: t.cle, fait: !t.fait, date: dayId(), historique: hist }; U().refresh(); if (!t.fait && window.CapSon) window.CapSon.jouer('etape'); }
    catch (e) { toast('Échec, réessaie'); }
  }
  function vente() {
    const { h, sheet, put, dayId, toast, money } = U();
    const A = {}; const ctx = { A, onChange: [], changed() {} };
    const dt = h('input', { id: 'v-date', type: 'date', value: dayId(), max: dayId() });
    const note = h('input', { id: 'v-note', placeholder: 'Ex. site du garage Martin', autocomplete: 'off' });
    const err = h('div', { class: 'err', role: 'alert' });
    let close;
    close = sheet('Nouvelle vente', [h('p', { class: 'muted sub' }, 'Montant réellement encaissé. Il remplace la prévision du mois concerné.'), money(ctx, 'montant', { label: 'Montant' }), h('label', { class: 'field', for: 'v-date' }, 'Date', dt), h('label', { class: 'field', for: 'v-note' }, 'Client ou détail (facultatif)', note), err,
      h('button', { class: 'btn', type: 'button', onclick: async () => {
        if (!(A.montant > 0)) { err.textContent = 'Indique un montant supérieur à 0.'; return; }
        try { await put('ventes', 'v' + Date.now().toString(36), { date: dt.value || dayId(), montant: A.montant, note: note.value.trim() || null }); close(); toast('Vente enregistrée, scénarios mis à jour'); if (window.CapSon) window.CapSon.jouer('objectif'); }
        catch (e) { err.textContent = 'Échec, réessaie.'; }
      } }, 'Enregistrer')]);
  }
  window.CapProjet = { view };
})();
