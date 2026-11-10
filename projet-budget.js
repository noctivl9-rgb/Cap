/* Cap Business — budget du projet, détail exécutable des tâches, journal (décisions, blocages, résultats),
 * comparateur de fournisseurs et suivi d'une activité existante. Tous les calculs passent par budget.js.
 * Réponses aux blocages : règles déterministes à partir des données enregistrées ; jamais de conseil de dépenser plus. */
(function () {
  'use strict';
  const U = () => window.CapUI, BG = () => window.CapBudget;
  const eur = v => U().eur(v);
  function etat(d) {
    const S = U().S, p = d.p;
    return BG().calculer({ capital: p.capital, reserve: typeof p.reserveProjet === 'number' ? p.reserveProjet : undefined, depenses: S.depenses, ventes: S.ventes });
  }
  const today = () => U().dayId();

  // ---------- Panneau budget ----------
  function panneau(d) {
    const { h } = U(), b = etat(d);
    const ligne = (l, v, cls, aide) => h('div', { class: 'bp-l' + (cls ? ' ' + cls : '') }, h('span', null, l, aide ? h('small', null, aide) : null), h('b', { class: 'num' }, eur(v)));
    return h('section', { class: 'bp', 'aria-labelledby': 'bp-t' },
      h('div', { class: 'bp-h' }, h('h2', { id: 'bp-t', class: 'td-h' }, 'Budget du projet'), h('button', { class: 'btn small', type: 'button', onclick: () => ajouterDepense(d) }, U().icon('plus'), 'Dépense')),
      b.alertes.filter(a => a.niveau !== 'info').map(a => h('div', { class: 'ag-alerte', role: 'note' }, h('p', null, a.texte))),
      h('div', { class: 'bp-dispo' }, h('span', null, 'Encore engageable'), h('b', { class: 'num' + (b.disponible < 0 ? ' neg' : '') }, eur(b.disponible)), h('small', null, 'Trésorerie ' + eur(b.tresorerie) + ' − dépenses prévues ' + eur(b.prevu))),
      h('div', { class: 'bp-grille' },
        ligne('Budget de départ', b.total, null, 'déclaré'),
        h('div', { class: 'bp-l' }, h('span', null, 'Réserve protégée', h('small', null, b.reserveDefinie ? 'à ne pas toucher' : 'non définie')), h('button', { class: 'link', type: 'button', onclick: () => definirReserve(d, b) }, b.reserveDefinie ? eur(b.reserve) : 'Définir')),
        ligne('Mobilisable', b.mobilisable),
        ligne('Dépenses payées', b.confirme, 'neg-t'),
        ligne('Dépenses prévues', b.prevu),
        ligne('Ventes encaissées', b.revenus, 'pos-t'),
        b.recurrentMois ? ligne('Abonnements prévus', b.recurrentMois, null, 'par mois') : null),
      h('p', { class: 'bp-res' }, 'Résultat réel du projet : ', h('b', { class: 'num ' + (b.resultat >= 0 ? 'pos' : 'neg') }, (b.resultat >= 0 ? '+' : '−') + eur(Math.abs(b.resultat))), ' (ventes − dépenses payées, avant impôt et cotisations).'),
      listeDepenses(d));
  }
  function listeDepenses(d) {
    const { h, fmtD, icon, put, remove, confirmDel, toast } = U();
    const deps = U().S.depenses.slice().sort((a, b) => b.date.localeCompare(a.date));
    if (!deps.length) return h('p', { class: 'foot muted' }, 'Aucune dépense enregistrée. Enregistre-les avant de payer : Cap refuse celles que ton budget ne couvre pas.');
    return h('details', { class: 'pg-det' }, h('summary', null, 'Dépenses (' + deps.length + ')'), h('ul', { class: 'td-liste' }, deps.map(x => h('li', { class: 'pg-log' },
      h('span', { class: 'td-l' }, h('b', null, x.note || BG().NOM_CAT[x.categorie]), h('small', null, fmtD(x.date) + ' · ' + BG().NOM_CAT[x.categorie] + ' · ' + (x.statut === 'confirmee' ? 'payée' : 'prévue') + (x.recurrence ? ' · chaque mois' : ''))),
      h('b', { class: 'num' }, eur(x.montant)),
      x.statut === 'prevue' ? h('button', { class: 'btn small text', type: 'button', onclick: async () => { const id = x.id, o = Object.assign({}, x); delete o.id; o.statut = 'confirmee'; o.payeLe = today(); try { await put('depenses', id, o); toast('Dépense marquée payée'); } catch (e) { toast('Échec, réessaie'); } } }, 'Payée') : null,
      h('button', { class: 'round press pg-del', type: 'button', 'aria-label': 'Supprimer la dépense ' + (x.note || '') + ' du ' + fmtD(x.date), onclick: () => confirmDel(() => remove('depenses', x.id)) }, icon('trash'))))));
  }
  function definirReserve(d, b) {
    const { h, sheet, saveProfil, toast } = U();
    let close;
    const inp = h('input', { id: 'bp-res', type: 'number', inputmode: 'decimal', min: '0', step: '1', value: b.reserveDefinie ? String(b.reserve) : '' });
    const err = h('div', { class: 'err', role: 'alert' });
    close = sheet('Réserve protégée', [h('p', { class: 'sub' }, 'La somme que tu ne veux pas risquer dans le projet. Cap ne la compte jamais comme disponible.'), h('label', { class: 'field', for: 'bp-res' }, 'Montant (€)', inp), err,
      h('button', { class: 'btn', type: 'button', onclick: async () => { const v = Number(inp.value); if (!(v >= 0) || inp.value === '') { err.textContent = 'Indique un montant positif ou 0.'; return; } if (v > b.total) { err.textContent = 'La réserve ne peut pas dépasser ton budget de départ (' + eur(b.total) + ').'; return; } try { await saveProfil({ reserveProjet: Math.round(v) }); close(); toast('Réserve enregistrée'); } catch (e) { err.textContent = 'Échec, réessaie.'; } } }, 'Enregistrer')]);
  }
  // Ajout d'une dépense : contrôle immédiat par le budget
  function ajouterDepense(d, preset) {
    const { h, sheet, put, uid, toast, choices } = U();
    preset = preset || {};
    const A = { statut: preset.statut || 'prevue', categorie: preset.categorie || null, recurrence: null };
    const montant = h('input', { id: 'dp-m', type: 'number', inputmode: 'decimal', min: '0', step: '0.01', value: preset.montant ? String(preset.montant) : '' });
    const note = h('input', { id: 'dp-n', maxlength: '80', value: preset.note || '', placeholder: 'Ex. : 50 étuis, hébergement…' });
    const date = h('input', { id: 'dp-d', type: 'date', value: today() });
    const verdict = h('div', { class: 'bp-verdict', 'aria-live': 'polite' });
    const save = h('button', { class: 'btn', type: 'button', disabled: true }, 'Enregistrer la dépense');
    const doc = () => { const o = { montant: Math.round(Number(montant.value) * 100) / 100, statut: A.statut, categorie: A.categorie, date: date.value }; if (A.recurrence === 'mensuelle') o.recurrence = 'mensuelle'; if (note.value.trim()) o.note = note.value.trim().slice(0, 80); if (preset.tache) o.tache = preset.tache; return o; };
    const maj = () => {
      verdict.textContent = ''; verdict.className = 'bp-verdict';
      if (!montant.value || !A.categorie) { save.disabled = true; return; }
      const v = BG().verifier(etat(d), doc());
      save.disabled = !v.ok;
      verdict.classList.add(v.ok ? (v.depasse ? 'warn' : 'ok') : 'bad');
      verdict.textContent = v.ok ? (v.depasse ? v.raison : 'Finançable. Il restera ' + eur(v.reste) + (A.statut === 'confirmee' ? ' de trésorerie.' : ' à engager.')) : v.raison;
    };
    const ctx = { A, onChange: [], changed() { maj(); } };
    [montant, date].forEach(x => x.addEventListener('input', maj));
    let close;
    save.addEventListener('click', async () => { save.disabled = true; try { await put('depenses', uid(), doc()); close(); toast('Dépense enregistrée'); } catch (e) { verdict.textContent = 'Échec de l’enregistrement, réessaie.'; save.disabled = false; } });
    close = sheet('Nouvelle dépense', [
      h('div', { class: 'field' }, 'Statut', choices(ctx, 'statut', [{ v: 'prevue', t: 'Prévue', s: 'Pas encore payée' }, { v: 'confirmee', t: 'Payée', s: 'Déjà dépensée' }], { grid: true })),
      h('label', { class: 'field', for: 'dp-m' }, 'Montant (€)', montant),
      h('div', { class: 'field' }, 'Catégorie', choices(ctx, 'categorie', BG().CATEGORIES.map(c => ({ v: c[0], t: c[1] })), { grid: true })),
      h('div', { class: 'field' }, 'Fréquence', choices(ctx, 'recurrence', [{ v: null, t: 'Une fois' }, { v: 'mensuelle', t: 'Chaque mois' }], { grid: true })),
      h('label', { class: 'field', for: 'dp-n' }, 'Détail', note), h('label', { class: 'field', for: 'dp-d' }, 'Date', date), verdict, save], { focus: false });
    if (preset.montant) maj();
  }

  // ---------- Détail d'une tâche ----------
  function detailTache(t, d, cocher) {
    const { h, sheet, fr } = U(), b = etat(d);
    const fin = BG().tacheFinancable(b, t.cout || 0);
    let close;
    close = sheet(t.titre, [
      t.objectif ? h('p', { class: 'sub' }, h('b', null, 'Objectif : '), t.objectif) : null,
      t.pourquoi ? h('p', { class: 'sub' }, h('b', null, 'Pourquoi : '), t.pourquoi) : null,
      h('dl', { class: 'td-meta' }, h('dt', null, 'Durée estimée'), h('dd', null, '≈ ' + fr(t.heures, t.heures % 1 ? 1 : 0) + ' h'),
        h('dt', null, 'Coût'), h('dd', null, t.cout === undefined ? 'Aucun' : t.cout === null ? 'À chiffrer' : eur(t.cout) + ' (hypothèse)'),
        t.deps && t.deps.length ? [h('dt', null, 'Prérequis'), h('dd', null, t.depsNoms || t.deps.join(', '))] : null,
        h('dt', null, 'Réussi si'), h('dd', null, t.critere), t.preuve ? [h('dt', null, 'Preuve'), h('dd', null, t.preuve)] : null,
        t.suivante ? [h('dt', null, 'Ensuite'), h('dd', null, t.suivante)] : null),
      t.cout && !fin.ok ? h('div', { class: 'ag-alerte', role: 'alert' }, h('b', null, 'Non finançable en l’état'), h('p', null, 'Il manque ' + eur(fin.manque) + ' à ton budget engageable. Options : réduire la dépense (occasion, prêt, location), retirer une dépense prévue, ou modifier ton budget de départ. Cap ne te conseille pas d’emprunter.')) : null,
      t.coutNote ? h('p', { class: 'foot muted' }, t.coutNote) : null,
      t.instructions ? [h('h3', { class: 'pj-h3' }, 'Comment faire'), h('ol', { class: 'td-instr' }, t.instructions.map(x => h('li', null, x)))] : null,
      t.outils ? h('p', { class: 'sub' }, h('b', null, 'Outils : '), t.outils.join(', ')) : null,
      t.liens ? [h('h3', { class: 'pj-h3' }, 'Sources officielles'), h('ul', { class: 'td-liens' }, t.liens.map(l => h('li', null, h('a', { href: l.url, target: '_blank', rel: 'noopener' }, l.nom), h('small', null, ' · consulté le ' + U().fmtD(l.date)))))] : null,
      h('div', { class: 'ia-actions' },
        !t.fait ? h('button', { class: 'btn', type: 'button', disabled: t.cout && !fin.ok ? true : null, onclick: () => { close(); cocher(t); } }, 'Marquer comme faite') : h('button', { class: 'btn secondary', type: 'button', onclick: () => { close(); cocher(t); } }, 'Rouvrir'),
        t.cout ? h('button', { class: 'btn secondary', type: 'button', onclick: () => { close(); setTimeout(() => ajouterDepense(d, { montant: t.cout, categorie: t.id === 'equipement' ? 'outil' : 'achat', note: t.titre.slice(0, 80), tache: t.id }), 60); } }, 'Prévoir la dépense') : null,
        t.id === 'equipement' || t.id === 'lancement' ? h('button', { class: 'btn secondary', type: 'button', onclick: () => { close(); setTimeout(() => comparateur(d), 60); } }, 'Comparer des fournisseurs') : null,
        h('button', { class: 'btn text', type: 'button', onclick: () => { close(); setTimeout(() => noter(d, 'blocage', t), 60); } }, 'Signaler un blocage'))
    ], { focus: false });
  }

  // ---------- Journal du projet : décisions, blocages, résultats ----------
  const TYPES = [['blocage', 'Blocage'], ['decision', 'Décision'], ['resultat', 'Résultat'], ['note', 'Note']];
  function noter(d, type, tache) {
    const { h, sheet, put, uid, toast, choices } = U();
    const A = { type: type || 'note' };
    const txt = h('textarea', { id: 'pj-txt', rows: '3', maxlength: '400', placeholder: 'Ex. : il me reste 120 € et le fournisseur demande 180 €' });
    const mt = h('input', { id: 'pj-mt', type: 'number', inputmode: 'decimal', min: '0', step: '0.01' });
    const err = h('div', { class: 'err', role: 'alert' });
    let close;
    const save = h('button', { class: 'btn', type: 'button', onclick: async () => {
      if (!txt.value.trim()) { err.textContent = 'Décris la situation en une phrase.'; return; }
      const o = { date: today(), type: A.type, texte: txt.value.trim().slice(0, 400) };
      if (mt.value) o.montant = Math.round(Number(mt.value) * 100) / 100;
      if (tache) o.tache = tache.id;
      o.analyse = analyser(d, o);
      save.disabled = true;
      try { await put('decisions', uid(), o); close(); toast('Noté dans le journal du projet'); setTimeout(() => afficherAnalyse(o), 80); } catch (e) { err.textContent = 'Échec, réessaie.'; save.disabled = false; }
    } }, 'Enregistrer');
    const ctx = { A, onChange: [], changed() {} };
    close = sheet(tache ? 'Blocage : ' + tache.titre : 'Journal du projet', [
      h('div', { class: 'field' }, 'Type', choices(ctx, 'type', TYPES.map(x => ({ v: x[0], t: x[1] })), { grid: true })),
      h('label', { class: 'field', for: 'pj-txt' }, 'Ce qui se passe', txt),
      h('label', { class: 'field', for: 'pj-mt' }, 'Montant concerné (€, facultatif)', mt), err, save], { focus: false });
  }
  // Analyse par règles, à partir des données enregistrées uniquement. Liste aussi ce qui manque pour conclure.
  function analyser(d, o) {
    const S = U().S, b = etat(d), out = { constats: [], options: [], manque: [] };
    const t = o.texte.toLowerCase();
    const pub = S.depenses.filter(x => x.categorie === 'publicite' && x.statut === 'confirmee').reduce((s, x) => s + x.montant, 0);
    out.constats.push('Encore engageable : ' + eur(b.disponible) + ' (trésorerie ' + eur(b.tresorerie) + ', dépenses prévues ' + eur(b.prevu) + ').');
    if (o.montant) {
      if (o.montant > b.disponible) out.constats.push('Le montant (' + eur(o.montant) + ') dépasse ce qui reste de ' + eur(o.montant - Math.max(0, b.disponible)) + '.');
      else out.constats.push('Le montant (' + eur(o.montant) + ') est couvert par ton budget engageable.');
    }
    if (/fournisseur|stock|commande|minimum/.test(t) || (o.montant && o.montant > b.disponible)) {
      out.options.push('Demander une première commande plus petite ou un échantillon.', 'Comparer au moins deux autres fournisseurs dans le comparateur (prix + livraison + retours).', 'Retirer ou reporter une dépense prévue moins utile.', 'Commencer par une offre qui ne demande pas de stock (précommande, service).');
      out.manque.push('Le prix unitaire et la quantité minimale exacts du fournisseur.', 'Les frais de livraison et les conditions de retour.');
    }
    if (/pub|publicit|annonce|ads/.test(t)) {
      out.constats.push('Publicité payée enregistrée : ' + eur(pub) + '. Ventes enregistrées : ' + S.ventes.length + '.');
      out.options.push('Arrêter la dépense publicitaire tant que le message n’a pas obtenu de réponses en prospection directe (gratuite).', 'Vérifier l’offre et le prix auprès de 5 personnes de la cible avant toute nouvelle annonce.');
      out.manque.push('Le nombre de personnes ayant vu et cliqué l’annonce.', 'Ce que montrait la page d’arrivée (prix, moyen de commander).', 'La cible choisie dans la plateforme.');
      out.constats.push('Cap ne recommande pas d’augmenter le budget publicitaire sans ces informations.');
    }
    if (/client|réponse|reponse|personne ne/.test(t)) { out.options.push('Relire l’offre : le problème du client est-il dans la première phrase ?', 'Contacter 10 nouvelles personnes avec un message plus court et une question simple.'); out.manque.push('Le nombre de contacts, de réponses et de refus (avec la raison).'); }
    if (!out.options.length) { out.options.push('Découper le blocage en une action de moins de 30 minutes.', 'Noter la décision prise dans ce journal pour la retrouver plus tard.'); }
    return out;
  }
  function afficherAnalyse(o) {
    const { h, sheet } = U(), a = o.analyse;
    if (!a) return;
    sheet('Ce que Cap en dit', [h('p', { class: 'foot muted' }, h('span', { class: 'tag calc' }, 'Calculé par Cap'), ' À partir de tes données enregistrées. Aucune réponse générée par une IA.'),
      h('h3', { class: 'pj-h3' }, 'Ce que l’on sait'), h('ul', { class: 'td-instr' }, a.constats.map(x => h('li', null, x))),
      h('h3', { class: 'pj-h3' }, 'Options réalistes'), h('ul', { class: 'td-instr' }, a.options.map(x => h('li', null, x))),
      a.manque.length ? [h('h3', { class: 'pj-h3' }, 'Ce qui manque pour conclure'), h('ul', { class: 'td-instr' }, a.manque.map(x => h('li', null, x)))] : null], { focus: false });
  }
  function journal(d) {
    const { h, fmtD } = U();
    const l = U().S.decisions.slice().sort((a, b) => (b.date + (b.id || '')).localeCompare(a.date + (a.id || '')));
    return h('section', { class: 'pj-journal', 'aria-labelledby': 'pj-j' }, h('div', { class: 'bp-h' }, h('h2', { id: 'pj-j', class: 'td-h' }, 'Journal du projet'), h('button', { class: 'btn small secondary', type: 'button', onclick: () => noter(d, 'blocage') }, 'Noter')),
      l.length ? h('ul', { class: 'td-liste' }, l.slice(0, 6).map(x => h('li', null, h('button', { class: 'td-ligne mod-projet', type: 'button', onclick: () => afficherAnalyse(x) }, h('span', { class: 'td-pastille' }), h('span', { class: 'td-l' }, h('b', null, x.texte.slice(0, 90)), h('small', null, fmtD(x.date) + ' · ' + (Object.fromEntries(TYPES)[x.type] || x.type) + (x.montant ? ' · ' + eur(x.montant) : ''))), U().icon('chev', 'chev')))))
        : h('p', { class: 'foot muted' }, 'Décisions, blocages et résultats : tout ce qui compte pour ton projet, daté.'));
  }

  // ---------- Comparateur de fournisseurs ----------
  function comparateur(d) {
    const { h, sheet, put, uid, toast, remove } = U();
    const liste = () => U().S.fournisseurs.filter(f => f.projet === (d.p.businessChoisi || 'existant'));
    const qte = h('input', { id: 'cf-q', type: 'number', min: '1', step: '1', value: String((liste()[0] || {}).quantite || 10) });
    const zone = h('div', { class: 'cf-zone' });
    const champs = [['nom', 'Nom du fournisseur', 'text'], ['site', 'Adresse du site', 'url'], ['prixUnitaire', 'Prix unitaire (€)', 'number'], ['livraison', 'Livraison (€)', 'number'], ['autresFrais', 'Autres frais (€)', 'number'], ['delaiJours', 'Délai (jours)', 'number'], ['retours', 'Conditions de retour', 'text']];
    const form = {}; champs.forEach(c => { form[c[0]] = h('input', { id: 'cf-' + c[0], type: c[2], inputmode: c[2] === 'number' ? 'decimal' : null, step: c[2] === 'number' ? '0.01' : null, min: c[2] === 'number' ? '0' : null }); });
    const ident = h('input', { type: 'checkbox', id: 'cf-id' });
    const err = h('div', { class: 'err', role: 'alert' });
    function dessiner() {
      zone.textContent = '';
      const cl = BG().comparerFournisseurs(liste(), Number(qte.value) || 1), b = etat(d);
      if (!cl.length) { zone.appendChild(h('p', { class: 'foot muted' }, 'Ajoute au moins 3 offres réelles trouvées toi-même. Cap ne propose aucun fournisseur.')); return; }
      zone.appendChild(h('ol', { class: 'cf-liste' }, cl.map((f, i) => h('li', { class: 'cf-f' + (i === 0 && f.total !== null ? ' meilleur' : '') },
        h('div', { class: 'cf-l' }, h('b', null, f.nom), f.total === null ? h('span', { class: 'chip warn' }, 'Incomplet : ' + f.manquants.join(', ')) : h('b', { class: 'num' }, eur(f.total))),
        h('small', null, [f.total !== null ? eur(f.parUnite) + ' par unité livrée' : null, f.delaiJours ? f.delaiJours + ' j' : 'délai inconnu', f.retours ? 'retours : ' + f.retours : 'retours non vérifiés', f.identite ? 'identité vérifiée' : 'identité non vérifiée'].filter(Boolean).join(' · ')),
        f.site ? h('a', { href: f.site, target: '_blank', rel: 'noopener', class: 'foot' }, f.site.replace(/^https?:\/\//, '').slice(0, 40)) : null,
        h('div', { class: 'ia-actions' },
          f.total !== null ? h('button', { class: 'btn small' + (BG().tacheFinancable(b, f.total).ok ? '' : ' secondary'), type: 'button', onclick: () => choisir(f) }, BG().tacheFinancable(b, f.total).ok ? 'Choisir' : 'Non finançable (' + eur(BG().tacheFinancable(b, f.total).manque) + ' manquants)') : null,
          h('button', { class: 'btn small text', type: 'button', onclick: async () => { await remove('fournisseurs', f.id); dessiner(); } }, 'Retirer'))))));
      if (cl.length < 3) zone.appendChild(h('p', { class: 'foot muted' }, 'Compare au moins 3 offres avant de décider.'));
    }
    async function choisir(f) {
      const b = etat(d), v = BG().verifier(b, { montant: f.total, statut: 'prevue', categorie: 'achat', date: today() });
      if (!v.ok) { toast(v.raison); return; }
      try {
        await put('depenses', uid(), { montant: f.total, statut: 'prevue', categorie: 'achat', date: today(), note: ('Commande ' + f.nom).slice(0, 80) });
        await put('decisions', uid(), { date: today(), type: 'decision', texte: ('Fournisseur choisi : ' + f.nom + ', ' + f.quantite + ' unités pour ' + eur(f.total) + ' livrées.').slice(0, 400) });
        close(); toast('Fournisseur choisi : dépense prévue et décision notées');
      } catch (e) { toast('Échec, réessaie'); }
    }
    qte.addEventListener('input', dessiner);
    let close;
    close = sheet('Comparer des fournisseurs', [
      h('p', { class: 'sub' }, 'Pour chaque offre réelle : vérifie l’identité (mentions légales, numéro d’entreprise, avis indépendants), le coût total livré, les délais et les retours.'),
      h('label', { class: 'field', for: 'cf-q' }, 'Quantité à commander', qte), zone,
      h('details', { class: 'pg-det', open: liste().length < 3 ? true : null }, h('summary', null, 'Ajouter une offre'),
        champs.map(c => h('label', { class: 'field', for: 'cf-' + c[0] }, c[1], form[c[0]])),
        h('label', { class: 'ph-lien', for: 'cf-id' }, ident, ' J’ai vérifié l’identité de ce fournisseur'), err,
        h('button', { class: 'btn secondary', type: 'button', onclick: async () => {
          const o = { date: today(), projet: d.p.businessChoisi || 'existant', quantite: Number(qte.value) || 1, nom: form.nom.value.trim().slice(0, 60), identite: ident.checked };
          if (!o.nom) { err.textContent = 'Le nom est obligatoire.'; return; }
          if (form.site.value.trim()) { if (!/^https:\/\//.test(form.site.value.trim())) { err.textContent = 'Adresse en https:// uniquement.'; return; } o.site = form.site.value.trim().slice(0, 200); }
          ['prixUnitaire', 'livraison', 'autresFrais', 'delaiJours'].forEach(k => { if (form[k].value !== '') o[k] = Math.max(0, Number(form[k].value)); });
          if (form.retours.value.trim()) o.retours = form.retours.value.trim().slice(0, 80);
          err.textContent = '';
          try { await put('fournisseurs', uid(), o); champs.forEach(c => { form[c[0]].value = ''; }); ident.checked = false; dessiner(); } catch (e) { err.textContent = 'Échec, réessaie.'; }
        } }, 'Ajouter l’offre'))], { focus: false });
    dessiner();
  }

  // ---------- Activité existante ----------
  function existant(d) {
    const { h, fmtD } = U(), S = U().S, a = d.p.activiteExistante, b = etat(d);
    const mois = BG().parMois(S.depenses, S.ventes), dern = mois[mois.length - 1];
    const derniereVente = S.ventes.slice().sort((x, y) => y.date.localeCompare(x.date))[0];
    const pistes = [];
    if (!derniereVente) pistes.push('Aucune vente enregistrée : commence par saisir tes ventes du mois pour que Cap mesure ton activité.');
    else if ((Date.parse(today()) - Date.parse(derniereVente.date)) / 864e5 > 30) pistes.push('Pas de vente depuis plus de 30 jours : relance tes anciens clients avant toute nouvelle dépense.');
    if (dern && dern.resultat < 0) pistes.push('Résultat négatif en ' + dern.mois + ' : regarde la catégorie de dépense la plus lourde.');
    if (b.recurrentMois && dern && b.recurrentMois > dern.ventes / 2) pistes.push('Tes abonnements pèsent plus de la moitié des ventes du dernier mois : vérifie chacun.');
    return [h('section', { class: 'pj-hero', 'aria-labelledby': 'pj-ex' }, h('p', { class: 'pj-k' }, 'Ton activité'), h('h2', { id: 'pj-ex', class: 'pj-t' }, a.nom),
      h('p', { class: 'pj-x' }, dern ? 'Dernier mois enregistré (' + dern.mois + ') : ventes ' + eur(dern.ventes) + ', dépenses ' + eur(dern.depenses) + ', résultat ' + (dern.resultat >= 0 ? '+' : '−') + eur(Math.abs(dern.resultat)) + '.' : 'Aucun chiffre enregistré pour l’instant.'),
      h('div', { class: 'pg-acts' }, h('button', { class: 'btn pj-go', type: 'button', onclick: () => window.CapProjet.vente() }, 'Enregistrer une vente'), h('button', { class: 'btn text', type: 'button', onclick: () => ajouterDepense(d, { statut: 'confirmee' }) }, 'Enregistrer une dépense'))),
      pistes.length ? h('section', { class: 'td-bloc' }, h('h2', { class: 'td-h' }, 'Pistes d’amélioration'), h('ul', { class: 'td-instr' }, pistes.map(x => h('li', null, x))), h('p', { class: 'foot muted' }, h('span', { class: 'tag calc' }, 'Calculé par Cap'), ' à partir de tes ventes et dépenses enregistrées.')) : null,
      mois.length ? h('details', { class: 'pg-det', open: true }, h('summary', null, 'Résultat par mois'), h('ul', { class: 'td-liste' }, mois.slice(-6).reverse().map(m => h('li', { class: 'pr-jalon' }, h('span', null, m.mois, h('small', { class: 'muted' }, ' · ventes ' + eur(m.ventes) + ' · dépenses ' + eur(m.depenses))), h('b', { class: 'num ' + (m.resultat >= 0 ? 'pos' : 'neg') }, (m.resultat >= 0 ? '+' : '−') + eur(Math.abs(m.resultat))))))) : null,
      panneau(d), journal(d)];
  }
  function declarerExistant(d) {
    const { h, sheet, saveProfil, toast } = U();
    const nom = h('input', { id: 'ex-nom', maxlength: '60', placeholder: 'Ex. : cours de guitare, boutique Vinted' });
    const depuis = h('input', { id: 'ex-dep', type: 'month' });
    const err = h('div', { class: 'err', role: 'alert' });
    let close;
    close = sheet('J’ai déjà une activité', [h('p', { class: 'sub' }, 'Cap suivra tes ventes, tes dépenses et tes décisions réelles, et signalera ce qui mérite ton attention. Aucune donnée bancaire n’est connectée.'),
      h('label', { class: 'field', for: 'ex-nom' }, 'Nom de l’activité', nom), h('label', { class: 'field', for: 'ex-dep' }, 'Depuis (facultatif)', depuis), err,
      h('button', { class: 'btn', type: 'button', onclick: async () => { if (!nom.value.trim()) { err.textContent = 'Donne un nom à ton activité.'; return; } try { await saveProfil({ activiteExistante: { nom: nom.value.trim().slice(0, 60), depuis: depuis.value || null } }); close(); toast('Activité enregistrée'); } catch (e) { err.textContent = 'Échec, réessaie.'; } } }, 'Suivre cette activité')]);
  }
  window.CapProjetBudget = { panneau, detailTache, journal, comparateur, ajouterDepense, noter, analyser, existant, declarerExistant, etat };
})();
