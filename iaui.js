/* Cap — interface de l'IA : génération et adaptation du programme, « Pourquoi ? », questions complémentaires,
 * recherche d'activités. Toute génération passe par CapIA (validation par CapContrats). Rien n'est simulé :
 * sans service IA, les boutons l'indiquent et l'explication calculée reste disponible. */
(function () {
  'use strict';
  const U = () => window.CapUI, IA = () => window.CapIA, K = () => window.CapContrats, Mx = () => window.CapMatrice;
  const LIB = { age: 'âge', poids: 'poids', taille: 'taille', tempsLibre: 'temps libre', jours: 'séances', minutes: 'durée', niveau: 'niveau', lieu: 'lieu', materielSport: 'matériel', prioriteSport: 'priorité', contraintes: 'contraintes', zonesDouleur: 'douleurs', heuresProjet: 'heures projet', autreSport: 'autre sport', obstacle: 'frein', objectif: 'objectif', sexe: 'formule', activite: 'activité', complements: 'réponses complémentaires', capital: 'capital', competences: 'compétences', materielPro: 'matériel', experience: 'expérience', aisanceVente: 'démarchage', risque: 'risque', formatPref: 'format', pays: 'pays', ville: 'ville', revenuVise: 'revenu visé' };
  const CHAMPS_BUSINESS = ['age', 'pays', 'ville', 'capital', 'competences', 'materielPro', 'heuresProjet', 'experience', 'aisanceVente', 'risque', 'formatPref', 'revenuVise', 'complements'];
  const val = v => v === null || v === undefined ? '—' : Array.isArray(v) ? (v.join(', ') || '—') : typeof v === 'object' ? Object.keys(v).length + ' réponse(s)' : String(v);
  const sansId = x => { const o = Object.assign({}, x); delete o.id; return o; };
  const fmtDate = iso => { try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); } catch (e) { return iso; } };
  const etat = () => window.CapContrats.statutIA(() => !!(IA() && IA().dispo()));

  // ------------------------------------------------------------ Attente réelle (aucune fausse progression)
  function attente(titre, texte) {
    const { h, sheet } = U();
    const ac = new AbortController();
    const close = sheet(titre, [h('p', { class: 'sub' }, texte), h('p', { class: 'foot muted' }, 'Le modèle travaille vraiment : cela prend en général 20 secondes à 2 minutes. Rien n’est modifié tant que la réponse n’a pas été vérifiée.'), h('div', { class: 'ia-attente', role: 'status', 'aria-live': 'polite' }, h('i'), h('i'), h('i')), h('button', { class: 'btn secondary', type: 'button', onclick: () => { ac.abort(); close(); } }, 'Annuler')], { focus: false, onClose: () => ac.abort() });
    return { close, signal: ac.signal };
  }
  function echec(r, fallback) {
    const { h, sheet } = U();
    let texte;
    if (r.indisponible) texte = etat().texte;
    else if (r.refuse) texte = 'L’IA a proposé deux fois une réponse refusée par les vérifications de Cap. Rien n’a été remplacé.';
    else texte = window.CapAI ? window.CapAI.erreur(r.erreur) : 'Le service IA a échoué.';
    const errs = r.refuse && r.validation && r.validation.erreurs ? r.validation.erreurs : [];
    sheet('Génération non effectuée', [h('p', { class: 'sub' }, texte), errs.length ? h('ul', { class: 'calc' }, errs.slice(0, 8).map(e => h('li', { class: 'foot' }, e))) : null, fallback ? h('p', { class: 'foot muted' }, fallback) : null], { focus: false });
  }

  // ------------------------------------------------------------ Programme
  async function genererProgramme(d) {
    const { put, toast, S, dayId } = U(), p = d.p;
    const doc = d.progIA ? d.progIA.doc : null;
    const ctx = { prog: d.progRegles, energie: d.energie, physique: d.phys, tendance: window.CapEngine.tendance(S.pesees), seances: S.seances, precedent: doc ? doc.brut : null, changements: d.progIA ? d.progIA.changements : [], registre: Mx() ? Mx().REGISTRE : [] };
    const w = attente(doc ? 'Adaptation du programme' : 'Création du programme', 'L’IA analyse tes objectifs, ta dépense estimée, ton niveau, ton temps, ton matériel, tes contraintes et tes séances passées.');
    const r = await IA().programme(p, ctx, { signal: w.signal });
    if (w.signal.aborted) return;
    w.close();
    if (!r.ok) { echec(r, 'Ton programme actuel reste affiché.'); return; }
    const id = 'ia' + Date.now().toString(36);
    try {
      for (const x of S.programmes.filter(x => x.actif)) await put('programmes', x.id, Object.assign(sansId(x), { actif: false, remplacePar: id }));
      await put('programmes', id, { date: new Date().toISOString(), origine: 'ia', modele: r.modele, transport: r.transport, entrees: K().entrees(p, K().CHAMPS_PROGRAMME.concat(['complements'])), brut: r.brut, corrections: r.corrections || [], essais: r.essais, questions: r.questions || [], actif: true, adaptationDe: doc ? doc.id : null });
    } catch (e) { toast('Échec de l’enregistrement, réessaie'); return; }
    if (window.CapSon) window.CapSon.jouer('programme');
    resultat(r);
  }
  function resultat(r) {
    const { h, sheet } = U();
    const pg = r.programme;
    sheet('Programme généré et vérifié', [
      h('p', { class: 'sub' }, pg.resume || ''),
      h('p', { class: 'foot muted' }, 'Modèle : ' + (r.modele || 'non communiqué') + ' · ' + r.essais.length + ' essai(s) · ' + pg.seances.length + ' séance(s), ' + pg.minutesSemaine + ' min par semaine estimées par Cap.'),
      r.corrections && r.corrections.length ? h('div', { class: 'note' }, h('b', null, 'Corrigé par Cap : '), r.corrections.join(' ')) : null,
      pg.horsBibliotheque ? h('p', { class: 'foot' }, pg.horsBibliotheque + ' exercice(s) hors bibliothèque : vérifiés sur le matériel et les zones, pas sur la technique.') : null,
      r.questions && r.questions.length ? questionsBloc(r.questions) : null
    ], { focus: false });
  }
  function programmePanel(d) {
    const { h } = U(), out = [];
    const pi = d.progIA, dispo = IA() && IA().dispo();
    const btn = (t, f, cls) => h('button', { class: 'btn small' + (cls ? ' ' + cls : ''), type: 'button', disabled: !dispo && /IA/.test(t) ? true : null, onclick: f }, t);
    if (pi && pi.valide) {
      const pg = pi.programme;
      out.push(h('div', { class: 'note tint' }, h('b', null, 'Programme généré par IA et vérifié par Cap'), ' le ' + fmtDate(pg.date) + (pg.modele ? ' (' + pg.modele + ')' : '') + '. ', pg.resume || ''));
      if (pi.changements.length) out.push(h('div', { class: 'alert warn' }, U().icon('alert'), h('div', null, h('h3', null, 'Tes réponses ont changé depuis ce programme'), h('p', null, pi.changements.map(c => (LIB[c.champ] || c.champ) + ' : ' + val(c.avant) + ' → ' + val(c.apres)).join(' · ')), h('p', { class: 'foot muted' }, 'Le programme respecte encore tes contraintes de sécurité actuelles. L’IA peut l’adapter en gardant ce qui fonctionne.'))));
    } else if (pi && !pi.valide) {
      out.push(h('div', { class: 'alert warn' }, U().icon('alert'), h('div', null, h('h3', null, 'Programme IA suspendu'), h('p', null, 'Le programme généré le ' + fmtDate(pi.doc.date) + ' ne respecte plus tes contraintes actuelles : ' + pi.erreurs.slice(0, 2).join(' ') + ' Le programme calculé par les règles est affiché à la place.'))));
    }
    const rang = h('div', { class: 'row-btns', style: 'flex-wrap:wrap' },
      btn(pi ? 'Adapter avec l’IA' : 'Générer mon programme avec l’IA', () => genererProgramme(d), pi && pi.valide && !pi.changements.length ? 'secondary' : ''),
      h('button', { class: 'btn small secondary', type: 'button', onclick: () => pourquoi(d) }, 'Pourquoi ce programme ?'),
      pi && pi.valide ? h('button', { class: 'btn small secondary', type: 'button', onclick: () => revenir(pi) }, 'Revenir au programme calculé') : null,
      dispo ? h('button', { class: 'btn small secondary', type: 'button', onclick: () => demanderQuestions(d) }, 'L’IA a-t-elle des questions ?') : null);
    out.push(rang);
    if (!dispo) out.push(h('p', { class: 'foot muted', style: 'margin:0 4px' }, etat().texte));
    const n = (U().S.programmes || []).length;
    if (n) out.push(h('p', { class: 'foot muted', style: 'margin:0 4px' }, n + ' version(s) générée(s) conservée(s) dans l’historique.'));
    return out;
  }
  async function revenir(pi) {
    const { put, toast } = U();
    try { await put('programmes', pi.doc.id, Object.assign(sansId(pi.doc), { actif: false })); toast('Programme calculé rétabli. La version IA reste dans l’historique.'); } catch (e) { toast('Échec, réessaie'); }
  }

  // ------------------------------------------------------------ « Pourquoi ? »
  function contextePourquoi(d) {
    const p = d.p, pg = d.prog;
    return {
      reponses: K().entrees(p, K().CHAMPS_PROGRAMME.concat(['complements'])),
      programme: pg && pg.ok ? { origine: pg.origine, resume: pg.resume || null, seances: pg.seances.map(s => ({ nom: s.nom, jour: s.jour, duree: s.duree, justification: s.justification || null, exercices: s.exercices.map(e => e.nom + (e.raison ? ' (' + e.raison + ')' : '')) })) } : null,
      decisionsCap: d.progRegles && d.progRegles.decisions ? d.progRegles.decisions.map(x => ({ decision: x.raison, reponses: x.champs })) : [],
      calculs: K().expliquerSansIA({ energie: d.energie, prog: null, business: null }),
      changementsDepuisLeProgramme: d.progIA ? d.progIA.changements : []
    };
  }
  function pourquoi(d, question) {
    const { h, sheet } = U();
    const zone = h('div', { style: 'display:flex;flex-direction:column;gap:10px' });
    const q = h('textarea', { id: 'pq', rows: '2' }); q.value = question || 'Pourquoi m’as-tu proposé ce programme ?';
    const sansIA = () => { zone.textContent = ''; add(zone, h('p', { class: 'foot muted' }, 'Explication calculée par Cap à partir de tes réponses (sans IA) :'), h('ul', { class: 'calc' }, K().expliquerSansIA({ energie: d.energie, prog: d.progRegles, business: null }).map(l => h('li', { class: 'foot' }, l)))); };
    const add = (el, ...c) => { U().add(el, ...c); return el; };
    const go = async () => {
      if (!(IA() && IA().dispo())) { sansIA(); return; }
      zone.textContent = ''; zone.appendChild(h('div', { class: 'ia-attente', role: 'status' }, h('i'), h('i'), h('i')));
      const r = await IA().pourquoi(q.value.trim(), contextePourquoi(d));
      zone.textContent = '';
      if (!r.ok) { zone.appendChild(h('p', { class: 'sub' }, r.indisponible ? etat().texte : (window.CapAI ? window.CapAI.erreur(r.erreur) : 'Échec.'))); sansIA(); return; }
      add(zone, h('p', { class: 'sub', style: 'white-space:pre-wrap' }, r.reponse), r.citees && r.citees.length ? h('p', { class: 'foot muted' }, 'Réponses utilisées : ' + r.citees.join(' · ')) : null, h('p', { class: 'foot muted' }, 'Réponse rédigée par l’IA à partir des calculs et décisions de Cap. Ce n’est pas un avis médical.'));
    };
    sheet('Pourquoi ce programme ?', [h('label', { class: 'field', for: 'pq' }, 'Ta question', q), h('button', { class: 'btn', type: 'button', onclick: go }, (IA() && IA().dispo()) ? 'Demander à l’IA' : 'Voir l’explication'), zone], { focus: false });
    if (!(IA() && IA().dispo())) sansIA();
  }

  // ------------------------------------------------------------ Questions complémentaires
  async function demanderQuestions(d) {
    const p = d.p;
    const w = attente('Questions de l’IA', 'L’IA cherche les informations qui manquent pour mieux te conseiller.');
    const r = await IA().questions(p, { registre: Mx().REGISTRE, manquantes: Mx().questionsManquantes(p) }, { signal: w.signal });
    if (w.signal.aborted) return;
    w.close();
    if (!r.ok) { echec(r); return; }
    const { h, sheet } = U();
    sheet('L’IA aimerait savoir', r.questions.length ? [questionsBloc(r.questions)] : [h('p', { class: 'sub' }, 'Aucune information importante ne manque pour l’instant.')], { focus: false });
  }
  function questionsBloc(qs) {
    const { h, editStep, saveProfil, toast, S } = U();
    return h('div', { style: 'display:flex;flex-direction:column;gap:14px' }, h('div', { class: 'cap' }, 'Questions complémentaires'), qs.map(q => {
      if (q.champ) return h('div', { class: 'panel' }, h('p', { class: 'sub', style: 'margin:0 0 4px' }, q.texte), h('p', { class: 'foot muted', style: 'margin:0 0 8px' }, 'Pourquoi : ' + q.raison), h('button', { class: 'btn small secondary', type: 'button', onclick: () => editStep(U().STEP_BY_FIELD[q.champ] || q.champ) }, 'Répondre'));
      const inp = q.type === 'choix' && q.options.length ? h('select', { id: 'qc-' + q.id }, q.options.map(o => h('option', { value: o }, o))) : h('input', { id: 'qc-' + q.id, inputmode: q.type === 'nombre' ? 'decimal' : 'text', autocomplete: 'off' });
      const btn = h('button', { class: 'btn small', type: 'button', onclick: async () => {
        const v = String(inp.value || '').trim(); if (!v) { toast('Écris une réponse'); return; }
        const comp = Object.assign({}, (S.profil || {}).complements || {}, { [q.id]: { question: q.texte, reponse: q.type === 'nombre' ? Number(v.replace(',', '.')) : v, raison: q.raison, module: q.module, date: new Date().toISOString() } });
        try { await saveProfil({ complements: comp }); btn.disabled = true; btn.textContent = 'Enregistré'; toast('Réponse enregistrée : elle sera utilisée à la prochaine adaptation'); } catch (e) { toast('Échec, réessaie'); }
      } }, 'Enregistrer');
      return h('div', { class: 'panel field' }, h('label', { for: 'qc-' + q.id }, q.texte), h('small', { class: 'muted' }, 'Pourquoi : ' + q.raison), inp, btn);
    }));
  }
  function complementsSection() {
    const { h, section, S } = U();
    const c = (S.profil || {}).complements || {};
    const ids = Object.keys(c);
    if (!ids.length) return null;
    return section(null, null, h('div', { class: 'cap' }, 'Réponses aux questions de l’IA'), h('div', { class: 'panel flush' }, ids.map(id => h('div', { class: 'cell', style: 'align-items:flex-start' }, h('span', { class: 'lbl' }, c[id].question, h('small', null, 'Ta réponse : ' + c[id].reponse + ' · utilisée pour : ' + c[id].module))))), h('p', { class: 'foot muted', style: 'margin:0 16px' }, 'Ces réponses sont envoyées à l’IA à chaque génération ou adaptation.'));
  }

  // ------------------------------------------------------------ Activités (business)
  async function chercherBusiness(d) {
    const { put, toast } = U(), p = d.p;
    const w = attente('Recherche d’activités', 'L’IA analyse tes compétences, ton capital, ton matériel, ton temps et tes contraintes pour proposer 3 activités, au-delà du catalogue de Cap.');
    const r = await IA().business(p, { reco: d.business, registre: Mx().REGISTRE }, { signal: w.signal });
    if (w.signal.aborted) return;
    w.close();
    if (!r.ok) { echec(r, 'Le classement calculé par Cap reste disponible.'); return; }
    try { await put('opportunites', 'op' + Date.now().toString(36), { date: new Date().toISOString(), modele: r.modele, transport: r.transport, mode: r.mode, entrees: K().entrees(p, CHAMPS_BUSINESS), opportunites: r.opportunites, erreurs: r.erreurs || [], essais: r.essais, questions: r.questions || [] }); }
    catch (e) { toast('Échec de l’enregistrement, réessaie'); return; }
    if (window.CapSon) window.CapSon.jouer('valider');
    if (r.questions && r.questions.length) U().sheet('L’IA aimerait savoir', [questionsBloc(r.questions)], { focus: false });
  }
  function businessPanel(d) {
    const { h, section, eur, saveProfil, toast, dayId } = U(), B = window.CapBusiness, out = [];
    const dispo = IA() && IA().dispo(), op = d.opIA;
    const btn = h('button', { class: 'btn small', type: 'button', disabled: dispo ? null : true, onclick: () => chercherBusiness(d) }, op ? 'Relancer la recherche IA' : 'Chercher 3 activités avec l’IA');
    if (!op) { out.push(section('Recherche par IA', dispo ? 'L’IA peut proposer des activités hors du catalogue de Cap. Les chiffres (budget, scénarios, plan) restent calculés par Cap.' : etat().texte, btn)); return out; }
    const ch = K().changements(op.entrees, K().entrees(d.p, CHAMPS_BUSINESS));
    const modeTxt = op.mode === 'web' ? 'avec recherche web : faits sourcés' : 'sans recherche web : prix, demande et concurrence sont des estimations du modèle, non vérifiées';
    out.push(section('Propositions de l’IA', 'Générées le ' + fmtDate(op.date) + (op.modele ? ' (' + op.modele + ')' : '') + ', ' + modeTxt + '. Statut et budget recalculés par Cap avec tes réponses actuelles.',
      ch.length ? h('div', { class: 'alert warn' }, U().icon('alert'), h('div', null, h('p', null, 'Tes réponses ont changé depuis cette recherche : ' + ch.map(c => (LIB[c.champ] || c.champ) + ' ' + val(c.avant) + ' → ' + val(c.apres)).join(' · ') + '.'))) : null,
      op.opportunites.map(m0 => {
        const ev = B.evaluer(m0, d.p), choisi = d.p.businessChoisi === 'ia' && d.p.businessIA && d.p.businessIA.id === m0.id;
        const pl = ev.statut === 'compatible' ? B.plan(m0, d.p, []) : null;
        return h('div', { class: 'panel', style: 'display:flex;flex-direction:column;gap:8px;margin-bottom:12px' },
          h('div', { style: 'display:flex;justify-content:space-between;gap:10px;align-items:baseline' }, h('h3', { style: 'margin:0;font-size:17px' }, m0.nom), h('span', { class: 'chip ' + (ev.statut === 'compatible' ? 'good' : 'warn') }, { compatible: 'Compatible', non_financable: 'Non finançable', rejete: 'Écartée' }[ev.statut])),
          h('p', { class: 'sub', style: 'margin:0' }, m0.client + '. ' + m0.probleme), h('p', { class: 'foot', style: 'margin:0' }, 'Offre : ' + m0.offre),
          m0.pourquoiToi ? h('p', { class: 'foot muted', style: 'margin:0' }, 'Pourquoi toi : ' + m0.pourquoiToi) : null,
          ev.raisons.length ? h('p', { class: 'foot', style: 'margin:0;color:var(--warn,#B25000)' }, ev.raisons.join(' ')) : null,
          h('div', { class: 'stats' }, h('div', { class: 'stat' }, h('b', null, eur(ev.budget)), h('span', null, 'Budget de départ (calcul Cap)')), h('div', { class: 'stat' }, h('b', null, pl ? eur(pl.scenarios.median.mois[5].net) : '—'), h('span', null, 'Net au 6e mois, scénario médian (calcul Cap)'))),
          m0.faits.length ? h('details', null, h('summary', { class: 'foot' }, m0.faits.length + ' fait(s) sourcé(s)'), h('ul', { class: 'calc' }, m0.faits.map(f => h('li', { class: 'foot' }, f.texte + ' — ', h('a', { href: f.source.url, target: '_blank', rel: 'noopener' }, f.source.titre || f.source.url), f.source.date ? ' (' + f.source.date + ')' : '')))) : null,
          m0.hypotheses.length ? h('details', null, h('summary', { class: 'foot' }, m0.hypotheses.length + ' hypothèse(s) non vérifiée(s)'), h('ul', { class: 'calc' }, m0.hypotheses.map(x => h('li', { class: 'foot' }, x)))) : null,
          h('button', { class: 'btn small' + (choisi ? ' secondary' : ''), type: 'button', disabled: choisi || ev.statut !== 'compatible' ? true : null, onclick: async () => { try { await saveProfil({ businessChoisi: 'ia', businessIA: m0, debutProjet: dayId() }); toast('Activité choisie : plan calculé par Cap'); } catch (e) { toast('Échec, réessaie'); } } }, choisi ? 'Activité choisie' : ev.statut === 'compatible' ? 'Choisir cette activité' : 'Non disponible'));
      }), op.erreurs && op.erreurs.length ? h('p', { class: 'foot muted' }, 'Écarté par les vérifications : ' + op.erreurs.join(' ')) : null, btn));
    return out;
  }
  window.CapIAUI = { programmePanel, genererProgramme, pourquoi, demanderQuestions, questionsBloc, complementsSection, businessPanel, chercherBusiness };
})();
