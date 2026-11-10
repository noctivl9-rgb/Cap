/* Cap — onglet Projet : trois activités recommandées, plan financier, plan 30/60/90 jours, ventes réelles.
 * Tout est calculé par CapBusiness (règles). Rien n'est présenté comme généré par une IA. */
(function () {
  'use strict';
  const U = () => window.CapUI, B = () => window.CapBusiness;
  const STATUT = { compatible: 'Compatible', non_financable: 'Non finançable', rejete: 'Écartée' };

  // Projet : sans activité choisie → les contraintes, puis UNE décision (choisir) ; avec activité → la prochaine tâche à impact,
  // la première vente réelle, puis le plan. Chaque chiffre porte son statut : Calcul, Hypothèse, Prévision, Observé, IA.
  const tag = t => { const { h } = U(); return h('span', { class: 'tag ' + ({ observe: 'mesure', hypothese: 'hypo', prevision: 'calc', calcul: 'calc', ia: 'ia' }[t] || 'calc') }, { observe: 'Observé', hypothese: 'Hypothèse', prevision: 'Prévision', calcul: 'Calcul', ia: 'IA' }[t] || t); };
  function contraintes(d) {
    const { h, eur, editStep, icon } = U(), p = d.p, Bz = B(), K = window.CapKit;
    const items = [['clock', (p.heuresProjet || 0) + ' h/sem', 'heuresProjet', 'Temps : ' + (p.heuresProjet || 0) + ' h par semaine'], ['wallet', eur(p.capital || 0), 'capital', 'Capital : ' + eur(p.capital || 0)], ['star', (p.competences || []).map(c => (Bz.COMPETENCES[c]) || (c === 'aucune' ? 'aucune' : c)).join(', ') || '—', 'competences', 'Compétences'], ['person', p.age ? p.age + ' ans' : '—', null, 'Âge'], ['compass', ({ france: 'France', emirats: 'Émirats', autre: 'Autre' })[p.pays] || '—', null, 'Pays']];
    return h('section', { class: 'pj-contr v2', 'aria-label': 'Avec quoi tu pars' },
      h('div', { class: 'kt' }, h('h2', null, 'Avec quoi tu pars'), K ? K.info('Avec quoi tu pars', ['Âge et légalité filtrent avant tout : une activité interdite ou impossible à financer n’est jamais proposée.', 'Touche une valeur pour la modifier : le classement est recalculé.']) : null),
      h('div', { class: 'pj-puces' }, items.map(x => h(x[2] ? 'button' : 'span', { class: 'pj-puce', type: x[2] ? 'button' : null, onclick: x[2] ? () => editStep(x[2]) : null, 'aria-label': x[2] ? 'Modifier — ' + x[3] : x[3] }, icon(x[0]), h('span', null, x[1])))));
  }
  function view(d) {
    const { h, largeTitle, section, eur, editStep, howBtn } = U();
    const out = [largeTitle('Projet')];
    const ia = window.CapContrats ? window.CapContrats.statutIA(() => false) : null;
    const r = d.business;
    if (!r || !r.ok) {
      out.push(h('div', { class: 'vide' }, h('p', null, (r && r.message) || 'Il manque des réponses pour construire ton projet.')));
      if (r && r.manquants) out.push(h('ul', { class: 'td-liste' }, r.manquants.map(m => h('li', null, h('button', { class: 'td-ligne mod-projet', type: 'button', onclick: () => editStep(U().STEP_BY_FIELD[m.champ] || m.champ) }, h('span', { class: 'td-pastille' }), h('span', { class: 'td-l' }, h('b', null, 'Répondre : ' + m.raison)), U().icon('chev', 'chev'))))));
      return out;
    }
    const PB = window.CapProjetBudget;
    if (d.p.activiteExistante && PB) { out.push(...PB.existant(d)); out.push(h('button', { class: 'btn text', type: 'button', onclick: () => U().saveProfil({ activiteExistante: null }) }, 'Revenir au parcours débutant')); return out; }
    const choisi = d.choisi && d.bplan;
    if (choisi) out.push(...planView(d));
    else {
      const K = window.CapKit;
      const infoClass = K ? K.info('Origine du classement', ['Classement calculé par les règles de Cap à partir de tes réponses.', 'Prix, demande et temps de prospection sont des hypothèses de départ, pas une étude de ton marché.']) : null;
      out.push(contraintes(d));
      if (PB) out.push(h('button', { class: 'pj-exist v2', type: 'button', onclick: () => PB.declarerExistant(d) }, U().icon('building'), h('span', null, 'J’ai déjà une activité'), U().icon('chev', 'chev')));
      r.notes.forEach(n => out.push(h('div', { class: 'alert info' }, U().icon('info'), h('div', null, h('p', null, n)))));
      if (!r.top.length) out.push(h('div', { class: 'vide' }, h('p', null, 'Aucune activité du catalogue n’est compatible avec ton capital, ton temps et ton âge. Les raisons sont détaillées plus bas : souvent, quelques dizaines d’euros ou une heure de plus par semaine suffisent.')));
      else out.push(h('section', { class: 'pj-opts', 'aria-labelledby': 'pj-opts-t' }, h('div', { class: 'kt' }, h('h2', { id: 'pj-opts-t', class: 'td-h' }, 'Tes 3 options'), infoClass), h('p', { class: 'sr' }, 'Classement calculé par les règles de Cap à partir de tes réponses.'), r.top.map((x, i) => carte(x, d, i === 0))));
    }
    if (window.CapIAUI) out.push(...window.CapIAUI.businessPanel(d));
    const i0 = out.length;
    if (choisi && r.top.length) out.push(h('details', { class: 'pg-det' }, h('summary', null, 'Autres options du classement'), r.top.map((x, i) => carte(x, d, false))));
    out.push(h('details', { class: 'pg-det' }, h('summary', null, 'Comment le classement est calculé'), h('ol', { class: 'calc' }, [
      'Filtres : âge légal, diplôme obligatoire, budget de départ (matériel manquant et 2 mois de charges compris), heures minimales.',
      'Score sur 100 : ' + Object.keys(r.poids).map(k => k + ' ' + Math.round(r.poids[k] * 100) + ' %').join(', ') + '.',
      'À score proche, une activité dont tu as déjà la compétence clé passe devant une activité à apprendre.',
      'Une seule activité par catégorie dans le top 3 quand c’est possible, pour te montrer des options différentes.',
      r.hypotheses].map(l => h('li', null, l)))));
    if (r.ecartes.length) out.push(h('details', { class: 'pg-det' }, h('summary', null, 'Activités écartées (' + r.ecartes.length + ')'), h('p', { class: 'foot muted' }, 'Avec la raison exacte. Si tes réponses changent, le classement est recalculé.'),
      h('ul', { class: 'td-liste' }, r.ecartes.map(x => h('li', { class: 'pj-ecart' }, h('b', null, x.nom), h('small', null, STATUT[x.statut] + ' · ' + x.raisons.join(' '))))),
      h('div', { class: 'ia-actions' }, h('button', { class: 'btn small secondary', type: 'button', onclick: () => editStep('capital') }, 'Modifier mon capital'), h('button', { class: 'btn small secondary', type: 'button', onclick: () => editStep('heuresProjet') }, 'Modifier mes heures'), h('button', { class: 'btn small secondary', type: 'button', onclick: () => editStep('competences') }, 'Modifier mes compétences'))));
    out.push(U().plus(out.splice(i0)));
    return out;
  }

  function carte(x, d, fort) {
    const { h, eur } = U(), K = window.CapKit;
    const m = B().PAR_ID[x.id], choisi = d.choisi === x.id || (d.choisi && d.choisi.id === x.id);
    return h('article', { class: 'pj-opt v2' + (fort ? ' fort' : '') },
      h('div', { class: 'pj-opt-h' }, K ? K.anneau({ valeur: x.score, max: 100, label: 'Score', texte: String(x.score), centre: String(x.score), couleur: fort ? 'var(--projet, #5B4BDB)' : 'var(--ink-2)', taille: 48, epaisseur: 5, cls: 'pj-an' }) : null,
        h('div', { class: 'pj-opt-t' }, h('h3', null, x.rang + '. ' + x.nom), h('p', { class: 'pj-cible' }, m.client))),
      h('div', { class: 'pj-kpi' },
        h('div', null, h('small', null, 'Départ'), h('b', { class: 'num' }, eur(x.budget))),
        h('div', null, h('small', null, x.preparation ? 'Ventes' : 'Prévu au 6e mois'), h('b', { class: 'num', 'aria-label': x.preparation ? null : eur(x.net6) + ' net au 6e mois, scénario médian' }, x.preparation ? 'Pas avant 16 ans' : eur(x.net6) + ' net'))),
      h('details', { class: 'pj-pq' }, h('summary', null, 'Détails'), h('p', { class: 'foot' }, m.probleme), h('p', { class: 'foot' }, h('b', null, 'Offre : '), m.offre), x.preparation ? null : h('p', { class: 'foot muted' }, 'Net au 6e mois : scénario médian, avant impôt.'), h('p', { class: 'foot muted' }, h('b', null, 'Pourquoi ce rang : '), x.explication)),
      h('button', { class: 'btn ' + (choisi ? 'secondary' : fort ? 'pj-go' : 'secondary'), type: 'button', disabled: choisi ? true : null, onclick: () => choisir(x.id, d) }, choisi ? 'Activité choisie' : 'Choisir cette activité'));
  }
  async function choisir(id, d) {
    try { await U().saveProfil({ businessChoisi: id, debutProjet: d.p.businessChoisi === id && d.p.debutProjet ? d.p.debutProjet : U().dayId() }); U().toast('Activité choisie : plan calculé'); if (window.CapSon) window.CapSon.jouer('valider'); }
    catch (e) { U().toast('Échec de l’enregistrement, réessaie'); }
  }

  function planView(d) {
    const { h, eur, fmtD } = U();
    const P = d.bplan, A = d.baction, out = [];
    const ventes = U().S.ventes.slice().sort((a, b) => b.date.localeCompare(a.date));
    // 1. Activité active + prochaine tâche à impact
    const prochaine = A && A.ok ? A.taches.find(t => !t.fait) : null;
    const nomDe = id => { const t = A && A.ok ? A.taches.find(x => x.id === id) : null; return t ? t.titre : id; };
    const PB = window.CapProjetBudget, bud = PB ? PB.etat(d) : null;
    if (A && A.ok) A.taches.forEach(t => { t.depsNoms = t.deps.map(nomDe).join(', '); const nx = A.taches.find(x => x.deps.indexOf(t.id) >= 0); t.suivante = nx ? nx.titre : null; });
    const finOk = t => !t.cout || !bud || window.CapBudget.tacheFinancable(bud, t.cout).ok;
    const detail = t => PB ? PB.detailTache(t, d, cocher) : null;
    out.push(h('section', { class: 'pj-hero', 'aria-labelledby': 'pj-h' },
      h('p', { class: 'pj-k' }, 'Ton activité · ' + P.nom),
      prochaine ? [h('h2', { id: 'pj-h', class: 'pj-t' }, prochaine.titre),
        h('p', { class: 'pj-x' }, 'Réussi si : ' + prochaine.critere + '. ≈ ' + prochaine.heures + ' h, jours ' + prochaine.jourDebut + ' à ' + prochaine.jourFin + '.' + (prochaine.deps.length ? ' Après : ' + prochaine.deps.map(nomDe).join(', ') + '.' : '')),
        prochaine.cout ? h('p', { class: 'pj-cout' + (finOk(prochaine) ? '' : ' bloque') }, finOk(prochaine) ? 'Coût prévu : ' + eur(prochaine.cout) + ' (hypothèse), finançable.' : 'Non finançable en l’état : il manque ' + eur(window.CapBudget.tacheFinancable(bud, prochaine.cout).manque) + '.') : null,
        h('div', { class: 'pg-acts' }, h('button', { class: 'btn pj-go', type: 'button', role: 'checkbox', 'aria-checked': 'false', disabled: finOk(prochaine) ? null : true, onclick: () => cocher(prochaine) }, 'Marquer comme faite'), PB ? h('button', { class: 'btn text', type: 'button', onclick: () => detail(prochaine) }, 'Comment faire') : null)]
        : [h('h2', { id: 'pj-h', class: 'pj-t' }, 'Toutes les tâches du plan sont faites.'), h('p', { class: 'pj-x' }, 'La suite se mesure à tes ventes réelles.')]));
    // 2. Première vente
    const pv = A && A.ok ? A.taches.find(t => t.id === 'premiere_vente') : null;
    out.push(h('section', { class: 'pj-vente', 'aria-labelledby': 'pj-v' }, h('h2', { id: 'pj-v', class: 'td-h' }, 'Première vente'),
      ventes.length ? h('p', null, eur(ventes[ventes.length - 1].montant) + ' encaissés le ' + fmtD(ventes[ventes.length - 1].date) + '. ' + ventes.length + ' vente' + (ventes.length > 1 ? 's' : '') + ' au total.')
        : h('p', null, pv ? 'Visée : jour ' + pv.jourFin + ' du plan · rien encaissé' : 'Rien n’est encore encaissé.', pv ? h('span', { class: 'sr' }, ' (si les tâches avancent au rythme de ' + A.heuresSemaine + ' h par semaine)') : null),
      h('button', { class: 'btn secondary', type: 'button', onclick: () => vente() }, 'Enregistrer une vente')));
    if (PB) out.push(PB.panneau(d));
    // 3. Plan d'action
    if (A && A.ok) {
      const phases = [['fait', 'Terminé'], ['30', 'Jours 1 à 30'], ['60', 'Jours 31 à 60'], ['90', 'Jours 61 à 90'], ['apres', 'Après 90 jours']];
      out.push(h('section', { class: 'pj-plan', 'aria-labelledby': 'pj-p' }, h('h2', { id: 'pj-p', class: 'td-h' }, 'Plan d’action'),
        h('p', { class: 'pj-avance' }, h('b', { class: 'num' }, A.faites + ' tâche(s) sur ' + A.total), ' terminée(s) · calculé pour ' + A.heuresSemaine + ' h par semaine.'),
        h('div', { class: 'jr-jauge', role: 'img', 'aria-label': A.faites + ' tâches sur ' + A.total }, h('i', { style: 'width:' + (A.total ? A.faites / A.total * 100 : 0) + '%' })),
        A.alerte ? h('div', { class: 'alert warn' }, U().icon('alert'), h('div', null, h('p', null, A.alerte))) : null,
        phases.map(ph => { const ts = A.taches.filter(t => t.phase === ph[0]); if (!ts.length) return null; return h('details', { class: 'pg-det', open: ph[0] === '30' ? true : null }, h('summary', null, ph[1] + ' (' + ts.length + ')'), h('ul', { class: 'td-liste' }, ts.map(t => h('li', { class: 'pj-tl' + (t.fait ? ' fait' : '') }, h('button', { class: 'pj-cb', type: 'button', role: 'checkbox', 'aria-checked': String(t.fait), 'aria-label': (t.fait ? 'Rouvrir : ' : 'Terminer : ') + t.titre, disabled: !t.fait && !finOk(t) ? true : null, onclick: () => cocher(t) }, h('span', { class: 'pj-coche', 'aria-hidden': 'true' })), h('button', { class: 'pj-tache' + (t.fait ? ' fait' : ''), type: 'button', onclick: () => detail(t) }, h('span', { class: 'td-l' }, h('b', null, t.titre), h('small', null, (t.fait ? 'Fait' + (t.faitLe ? ' le ' + fmtD(t.faitLe) : '') : 'Jours ' + t.jourDebut + ' à ' + t.jourFin + ' · ' + t.heures + ' h') + ' · Réussi si : ' + t.critere + (t.deps.length && !t.fait ? ' · Après : ' + t.deps.map(nomDe).join(', ') : '')))))))); })));
    }
    if (PB) { out.push(PB.journal(d)); out.push(h('button', { class: 'btn secondary', type: 'button', onclick: () => PB.comparateur(d) }, 'Comparer des fournisseurs')); }
    // 4. Chiffres et compléments, regroupés sous une seule ligne
    const i0 = out.length;
    const mois = [1, 3, 6, 12];
    const ligne = (nom, sc) => h('li', { class: 'pr-jalon' }, h('span', null, nom, h('small', { class: 'muted' }, ' · 12 mois : ' + eur(sc.total12))), h('span', { class: 'num pj-mois' }, mois.map(i => { const x = sc.mois[i - 1]; return 'M' + i + ' ' + eur(x.net) + (x.type === 'observe' ? '*' : ''); }).join(' · ')));
    out.push(h('details', { class: 'pg-det' }, h('summary', null, 'Chiffres de l’activité'),
      h('ul', { class: 'td-liste' }, [['Budget initial', eur(P.budgetInitial.total), 'calcul'], ['Prix médian', eur(P.prix.median) + ' / ' + P.concept.unite, 'hypothese'], ['Marge par ' + P.concept.unite, eur(P.margeParUnite), 'calcul'], ['Seuil de rentabilité', P.seuilRentabilite ? P.seuilRentabilite.texte : 'Non calculable', 'calcul'], ['Budget récupéré', P.retourInvestissement.median ? 'mois ' + P.retourInvestissement.median + ' (médian)' : 'pas dans les 12 mois (médian)', 'prevision']].map(x => h('li', { class: 'pr-jalon' }, h('span', null, x[0], ' ', tag(x[2])), h('b', { class: 'num' }, x[1])))),
      h('h3', { class: 'pj-h3' }, 'Scénarios de bénéfice net'), h('p', { class: 'foot muted' }, 'Après cotisations et charges, avant impôt. Mois futurs : ', tag('prevision'), ' ; * = mois avec ventes saisies : ', tag('observe'), '.'),
      h('ul', { class: 'td-liste' }, ligne('Prudent', P.scenarios.prudent), ligne('Médian', P.scenarios.median), ligne('Favorable', P.scenarios.favorable)),
      U().howBtn('Hypothèses du calcul', P.hypotheses)));
    out.push(h('details', { class: 'pg-det' }, h('summary', null, 'Ventes réelles (' + ventes.length + ')'), h('p', { class: 'foot muted' }, P.observe ? P.observe.mois + ' mois avec des ventes, ' + eur(P.observe.ca) + ' encaissés. Les scénarios utilisent ces montants à la place des prévisions.' : 'Aucune vente enregistrée : tout le reste est une prévision.'),
      ventes.length ? h('ul', { class: 'td-liste' }, ventes.map(v => h('li', { class: 'pr-jalon' }, h('span', null, fmtD(v.date) + (v.note ? ' · ' + v.note : '')), h('b', { class: 'num pos' }, eur(v.montant))))) : null));
    out.push(h('details', { class: 'pg-det' }, h('summary', null, 'Légalité et formalités'), P.formalites.map(f => h('p', { class: 'sub' }, f))));
    out.push(h('details', { class: 'pg-det' }, h('summary', null, 'Risques et validation de la demande'), P.risques.map(f => h('p', { class: 'sub' }, f)), h('p', { class: 'sub' }, h('b', null, 'Avant d’investir : '), P.validation)));
    out.push(U().plus(out.splice(i0)));
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
  window.CapProjet = { view, vente };
})();
