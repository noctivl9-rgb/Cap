/* Cap — coach contextuel.
 * Outils internes (lisent les données enregistrées, dans la limite des accords donnés dans Profil) :
 *   getUserProfile, getActiveGoals, getNutritionSummary, getTrainingPlan, getProgressHistory,
 *   getBusinessProject, getBusinessBudget, getBusinessTasks, calculateBusinessCosts, getFinanceSummary,
 *   searchVerifiedSources, proposePlanAdjustment.
 * - Avec Claude (capacité sample avec outils) : questions libres, l'IA appelle ces outils ; aucune donnée n'est inventée.
 * - Sans IA : « Questions rapides » répondues par Cap à partir des mêmes outils (étiquetées « Calculé par Cap »).
 * - proposePlanAdjustment ne modifie RIEN : la proposition s'affiche, l'utilisateur accepte ou refuse.
 * - La conversation est gardée (collection « conversations », 40 derniers messages), effaçable dans le coach. */
(function () {
  'use strict';
  const U = () => window.CapUI;
  const E = () => window.CapEngine;
  const r1 = v => Math.round(v * 10) / 10;

  function outils(d) {
    const S = U().S, p = d.p, prefs = S.prefs || {}, t = U().dayId();
    const refus = quoi => ({ refus: 'L’utilisateur n’a pas autorisé le coach à lire ses données ' + quoi + ' (Profil › Confidentialité et IA).' });
    const corpsOk = () => d.corps && prefs.coachCorps, argentOk = () => d.argent && prefs.coachArgent, projetOk = () => d.entreprise && prefs.coachProjet;
    const propositions = [];
    const T = {
      getUserProfile: { description: 'Profil de base : âge, modules actifs, prénom éventuel.', run: () => ({ age: p.age || null, modules: p.domaines || [], prenom: p.prenom || null }) },
      getActiveGoals: { description: 'Objectifs actifs de chaque module (sans données chiffrées si non autorisé).', run: () => ({ corps: d.corps ? { objectif: p.objectif, poids_cible_kg: corpsOk() ? p.cible : 'non partagé' } : null, argent: d.argent ? { projet: d.fin && d.fin.ok ? d.fin.reve.label : null, annee: p.reveAnnee || null } : null, business: d.entreprise ? { activite: d.bplan ? d.bplan.nom : (p.activiteExistante ? p.activiteExistante.nom : 'non choisie') } : null }) },
      getNutritionSummary: { description: 'Résumé nutrition du jour : objectif, noté, restant (kcal et protéines, glucides, lipides en g).', run: () => {
        if (!corpsOk()) return refus('corps'); if (!d.phys || !d.phys.ok) return { erreur: 'Profil corps incomplet.' };
        const b = window.CapJournal.budgetDuJour(d), j = S.journaux[t] || { items: [] }, tot = E().totaux(j.items || []);
        return { date: t, objectif_kcal: b.total, note_kcal: Math.round(b.mange), restant_kcal: Math.round(b.restant), proteines_g: { note: r1(tot.p), objectif: b.macros.prot, restant: r1(b.macros.prot - tot.p) }, glucides_g: { note: r1(tot.c), objectif: b.macros.glu }, lipides_g: { note: r1(tot.f), objectif: b.macros.lip }, repas_notes: (j.items || []).length, eau_ml: j.eauMl || 0 };
      } },
      getTrainingPlan: { description: 'Programme sportif : séances, exercices, séance du jour, gênes récentes.', run: () => {
        if (!corpsOk()) return refus('corps'); const pr = d.prog; if (!pr || !pr.ok) return { erreur: 'Pas de programme.' };
        const x = U().seanceDuJour(t);
        return { origine: pr.origine === 'ia_validee' ? 'IA validée par Cap' : 'règles de Cap', semaine: pr.planning.map(pl => ({ jour: pl.jourNom, seance: (pr.seances.find(s => s.cle === pl.seance) || {}).nom })), seance_du_jour: x && x.se ? { nom: x.se.nom, exercices: x.se.exercices.map(e => ({ nom: e.nom, series: e.series, reps: e.reps, repos_s: e.repos, raison: e.raison || null, alternative: e.alternative || null })) } : null, genes_14j: S.seances.filter(l => l.gene && (Date.parse(t) - Date.parse(l.date)) / 864e5 <= 14).map(l => ({ date: l.date, detail: (l.signalements || []).map(s => s.exercice + (s.note ? ' (' + s.note + ')' : '')).join(', ') })) };
      } },
      getProgressHistory: { description: 'Historique mesuré : pesées, tour de taille, séances faites (30 dernières).', run: () => {
        if (!corpsOk()) return refus('corps');
        const pes = S.pesees.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(-30).map(r => ({ date: r.date, poids_kg: r.poids, tour_cm: r.tour || null }));
        const tr = E().tendance(S.pesees);
        return { pesees: pes, tendance_kg_par_semaine: tr.rythme, seances_faites_14j: d.adapt ? d.adapt.faites : null, seances_prevues_14j: d.adapt ? d.adapt.prevues : null, photos: S.photos.length + ' photo(s), jamais analysées' };
      } },
      getBusinessProject: { description: 'Projet business : activité, phase, prochaine tâche, ventes réelles.', run: () => {
        if (!projetOk()) return refus('projet'); const A = d.baction;
        return { activite: d.bplan ? d.bplan.nom : (p.activiteExistante ? p.activiteExistante.nom : null), taches_faites: A && A.ok ? A.faites + '/' + A.total : null, prochaine_tache: A && A.ok ? ((A.taches.find(x => !x.fait) || {}).titre || null) : null, ventes: (S.ventes || []).map(v => ({ date: v.date, montant: v.montant })).slice(-20), journal: S.decisions.slice(-8).map(x => ({ date: x.date, type: x.type, texte: x.texte })) };
      } },
      getBusinessBudget: { description: 'Budget du projet : total, réserve, payé, prévu, trésorerie, engageable, résultat.', run: () => {
        if (!projetOk()) return refus('projet'); const b = window.CapProjetBudget.etat(d);
        return { total: b.total, reserve: b.reserveDefinie ? b.reserve : 'non définie', paye: b.confirme, prevu: b.prevu, abonnements_mois: b.recurrentMois, ventes: b.revenus, tresorerie: b.tresorerie, encore_engageable: b.disponible, resultat_reel: b.resultat };
      } },
      getBusinessTasks: { description: 'Tâches du plan avec coût, statut, critère de réussite.', run: () => {
        if (!projetOk()) return refus('projet'); const A = d.baction; if (!A || !A.ok) return { erreur: 'Aucun plan.' };
        return A.taches.slice(0, 16).map(x => ({ titre: x.titre, fait: x.fait, cout: x.cout === undefined ? 0 : x.cout, critere: x.critere, jours: x.fait ? null : x.jourDebut + '-' + x.jourFin }));
      } },
      calculateBusinessCosts: { description: 'Calcule le coût total réel et la marge d’une offre : quantite, prixUnitaire, livraison, commissionPct, prixVente (tous nombres).', schema: { type: 'object', properties: { quantite: { type: 'number' }, prixUnitaire: { type: 'number' }, livraison: { type: 'number' }, commissionPct: { type: 'number' }, prixVente: { type: 'number' } }, required: ['quantite', 'prixUnitaire'] }, run: x => {
        const q = Math.max(1, Math.round(+x.quantite || 1)), pu = +x.prixUnitaire || 0, liv = +x.livraison || 0, pv = +x.prixVente || 0, com = Math.min(100, Math.max(0, +x.commissionPct || 0));
        const cout = Math.round((q * pu + liv) * 100) / 100, ca = q * pv, commission = Math.round(ca * com) / 100;
        return { cout_total: cout, cout_par_unite: Math.round(cout / q * 100) / 100, chiffre_affaires_si_tout_vendu: pv ? ca : null, commission: pv ? commission : null, marge_brute_si_tout_vendu: pv ? Math.round((ca - commission - cout) * 100) / 100 : null, note: 'Marge avant cotisations sociales et impôt ; suppose que tout est vendu, ce qui n’est pas garanti.' };
      } },
      getFinanceSummary: { description: 'Finances personnelles : budget déclaré, capacité d’épargne, épargne réelle, dépenses réelles du mois par catégorie.', run: () => {
        if (!argentOk()) return refus('d’argent'); const f = d.fin; if (!f || !f.ok) return { erreur: 'Budget incomplet.' };
        const m = window.CapFinances.mois(S.operations, t.slice(0, 7), (+p.fixes || 0) + (+p.variables || 0));
        return { revenus_declares: p.revenus, capacite_epargne_mois: f.capacite, epargne_reelle: f.actuelle, mois: m.mois, depenses_saisies: m.depenses, revenus_saisis: m.revenus, par_categorie: m.classement.map(c => ({ categorie: c.nom, montant: c.montant })), operations_saisies: m.nb };
      } },
      searchVerifiedSources: { description: 'Sources officielles vérifiées par Cap (pas de recherche web) sur : micro-entreprise, étude de marché, cotisations, nutrition, activité physique.', schema: { type: 'object', properties: { sujet: { type: 'string' } } }, run: x => {
        const L = [
          { sujet: 'micro-entreprise', nom: 'Micro-entrepreneur (Service-Public.fr)', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/N31901', verifie: '2026-11-10' },
          { sujet: 'immatriculation', nom: 'Guichet des formalités (Service-Public.fr)', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/R61572', verifie: '2026-11-10' },
          { sujet: 'étude de marché', nom: 'Étude de marché (Service-Public.fr)', url: 'https://entreprendre.service-public.gouv.fr/vosdroits/F35958', verifie: '2026-11-10' },
          { sujet: 'étude de marché', nom: 'Bpifrance Création', url: 'https://bpifrance-creation.fr/moment-de-vie/4-etapes-bien-realiser-votre-etude-marche', verifie: '2026-11-10' },
          { sujet: 'cotisations', nom: 'Taux micro-entrepreneur utilisés par Cap', url: null, verifie: E().REF ? E().REF.date : null }
        ];
        const q = String(x && x.sujet || '').toLowerCase();
        const r = L.filter(s => !q || q.split(/\s+/).some(w => w.length > 3 && s.sujet.indexOf(w) >= 0));
        return { sources: r.length ? r : L, note: 'Liste fermée vérifiée par Cap. Aucune recherche web : si l’information n’y est pas, dis-le.' };
      } },
      proposePlanAdjustment: { description: 'Propose un ajustement que l’utilisateur devra confirmer. type : « reporter_seance » ou « objectif_kcal » (valeur en kcal). Ne modifie rien.', schema: { type: 'object', properties: { type: { type: 'string', enum: ['reporter_seance', 'objectif_kcal'] }, valeur: { type: 'number' }, raison: { type: 'string' } }, required: ['type', 'raison'] }, run: x => {
        if (!corpsOk()) return refus('corps');
        if (x.type === 'objectif_kcal') {
          const v = Math.round(+x.valeur || 0), pl = d.phys && d.phys.plancher, base = d.phys && d.phys.cible ? E().cibleJour(d.phys).kcal : null;
          if (!pl || v < pl) return { refuse: 'Sous le minimum de sécurité (' + pl + ' kcal) : proposition refusée par Cap.' };
          if (base && Math.abs(v - base) > 500) return { refuse: 'Écart de plus de 500 kcal avec l’objectif calculé : proposition refusée par Cap.' };
        } else if (x.type !== 'reporter_seance') return { refuse: 'Type non pris en charge.' };
        propositions.push({ type: x.type, valeur: x.valeur, raison: String(x.raison || '').slice(0, 200) });
        return { statut: 'en_attente_de_confirmation', message: 'Proposition affichée : l’utilisateur doit l’accepter.' };
      } }
    };
    return { T, propositions };
  }

  // Questions rapides sans IA : réponses calculées par Cap avec les mêmes outils
  const RAPIDES = [
    { q: 'Combien de protéines me reste-t-il ?', mod: 'corps', rep: o => { const r = o.T.getNutritionSummary.run(); const fr = v => U().fr(v, v % 1 ? 1 : 0); return r.refus || r.erreur || ('Il te reste ' + fr(Math.max(0, r.proteines_g.restant)) + ' g de protéines sur ' + fr(r.proteines_g.objectif) + ' g aujourd’hui (' + fr(r.proteines_g.note) + ' g notés), et ' + fr(r.restant_kcal) + ' kcal.'); } },
    { q: 'Pourquoi cet exercice ?', mod: 'corps', rep: o => { const r = o.T.getTrainingPlan.run(); if (r.refus || r.erreur) return r.refus || r.erreur; if (!r.seance_du_jour) return 'Pas de séance aujourd’hui : la récupération fait partie du programme.'; return r.seance_du_jour.exercices.map(e => e.nom + ' : ' + (e.raison || 'exercice de base du programme') + (e.alternative ? ' (alternative : ' + e.alternative + ')' : '')).join('\n'); } },
    { q: 'Quelles mesures ont changé ?', mod: 'corps', rep: o => { const r = o.T.getProgressHistory.run(); if (r.refus) return r.refus; const l = r.pesees; if (l.length < 2) return 'Il faut au moins deux pesées pour parler d’un changement. ' + (l.length ? 'Une seule est enregistrée.' : 'Aucune n’est enregistrée.'); const a = l[0], b = l[l.length - 1]; const tours = l.filter(x => x.tour_cm); return 'Poids : ' + a.poids_kg + ' kg le ' + a.date + ' → ' + b.poids_kg + ' kg le ' + b.date + ' (' + (b.poids_kg - a.poids_kg > 0 ? '+' : '') + r1(b.poids_kg - a.poids_kg) + ' kg).' + (tours.length >= 2 ? ' Tour de taille : ' + tours[0].tour_cm + ' → ' + tours[tours.length - 1].tour_cm + ' cm.' : '') + (r.tendance_kg_par_semaine !== null ? ' Tendance mesurée : ' + r.tendance_kg_par_semaine + ' kg par semaine.' : ''); } },
    { q: 'Quelle est ma prochaine action business ?', mod: 'entreprise', rep: o => { const r = o.T.getBusinessProject.run(); if (r.refus) return r.refus; const b = o.T.getBusinessBudget.run(); return (r.prochaine_tache ? 'Prochaine tâche : ' + r.prochaine_tache + '.' : 'Choisis d’abord une activité dans Avenir › Business.') + (b && b.encore_engageable !== undefined ? ' Encore engageable : ' + b.encore_engageable + ' €.' : ''); } },
    { q: 'Où ai-je le plus dépensé ?', mod: 'argent', rep: o => { const r = o.T.getFinanceSummary.run(); if (r.refus || r.erreur) return r.refus || r.erreur; if (!r.operations_saisies) return 'Aucune dépense saisie ce mois-ci : ajoute tes opérations dans Avenir › Finances pour que Cap puisse répondre.'; const c = r.par_categorie[0]; return c.categorie + ' : ' + c.montant + ' € sur ' + r.depenses_saisies + ' € dépensés ce mois-ci (' + Math.round(c.montant / r.depenses_saisies * 100) + ' %).'; } }
  ];

  let conv = null;
  async function sauver(msgs) { try { await U().put('conversations', 'principal', { date: U().dayId(), messages: msgs.slice(-40) }); } catch (e) { /* conversation non sauvée : pas bloquant */ } }
  function ouvrir(d) {
    const { h, sheet, savePrefs } = U(), S = U().S, prefs = S.prefs || {};
    const AI = window.CapAI;
    const doc = (S.conversations || []).find(x => x.id === 'principal');
    conv = doc && Array.isArray(doc.messages) ? doc.messages.slice() : [];
    const msgs = h('div', { class: 'chat', 'aria-live': 'polite' });
    const bulle = (role, text, origine) => { const b = h('div', { class: 'bubble ' + (role === 'user' ? 'me' : 'ai') }, origine ? h('span', { class: 'tag ' + (origine === 'cap' ? 'calc' : 'ia') }, origine === 'cap' ? 'Calculé par Cap' : 'Claude') : null, h('p', null, text)); msgs.appendChild(b); b.scrollIntoView({ block: 'end' }); return b; };
    conv.forEach(m => bulle(m.role, m.content, m.origine));
    const accords = [];
    const sw = (k, label) => h('button', { class: 'pf-sw coach-sw', type: 'button', role: 'switch', 'aria-checked': String(!!prefs[k]), onclick: async e => { const v = !(U().S.prefs || {})[k]; try { await savePrefs({ [k]: v }); e.currentTarget.setAttribute('aria-checked', String(v)); e.currentTarget.querySelector('.switch').classList.toggle('on', v); } catch (x) { /* rien */ } } }, h('span', { class: 'switch' + (prefs[k] ? ' on' : '') }, h('i')), h('span', null, label));
    if (d.corps) accords.push(sw('coachCorps', 'Corps'));
    if (d.argent) accords.push(sw('coachArgent', 'Finances'));
    if (d.entreprise) accords.push(sw('coachProjet', 'Business'));
    const rapides = RAPIDES.filter(r => (r.mod === 'corps' && d.corps) || (r.mod === 'argent' && d.argent) || (r.mod === 'entreprise' && d.entreprise));
    const propZone = h('div', { class: 'coach-props' });
    const iaOk = !!(AI && AI.texteDispo());
    const toolsOk = () => !!(AI && AI.outilsDispo && AI.outilsDispo());
    const q = h('textarea', { id: 'coach-q', rows: '2', placeholder: 'Ex. : il me reste 120 € et mon fournisseur demande 180 €' });
    const err = h('div', { class: 'err', role: 'alert' });
    let ctl = null;
    const send = h('button', { class: 'btn', type: 'button', disabled: !iaOk }, 'Envoyer');
    const stop = h('button', { class: 'btn secondary', type: 'button', hidden: true, onclick: () => ctl && ctl.abort() }, 'Arrêter');
    function afficherPropositions(o) {
      propZone.textContent = '';
      o.propositions.forEach(pr => propZone.appendChild(h('div', { class: 'coach-prop' }, h('b', null, pr.type === 'reporter_seance' ? 'Proposition : reporter la séance du jour à demain' : 'Proposition : objectif de ' + pr.valeur + ' kcal par jour'), h('p', null, pr.raison),
        h('div', { class: 'ia-actions' }, h('button', { class: 'btn small', type: 'button', onclick: async () => { await appliquer(pr, d); propZone.textContent = ''; } }, 'Accepter'), h('button', { class: 'btn small text', type: 'button', onclick: () => { propZone.textContent = ''; } }, 'Refuser')))));
    }
    send.addEventListener('click', async () => {
      const question = q.value.trim(); if (!question || send.disabled) return;
      q.value = ''; err.textContent = '';
      bulle('user', question); conv.push({ role: 'user', content: question });
      const out = bulle('assistant', 'Réflexion…', 'ia');
      const pOut = out.querySelector('p');
      ctl = new AbortController(); send.disabled = true; stop.hidden = false;
      const o = outils(d);
      try {
        let r;
        if (toolsOk()) r = await AI.coachOutils(question, conv.slice(-10, -1), o.T, { signal: ctl.signal, onText: ({ text }) => { pOut.textContent = text; }, onOutil: n => { pOut.textContent = 'Lecture : ' + n + '…'; } });
        else r = await AI.coach(question, conv.slice(-10, -1), window.CapJournal.contexte ? window.CapJournal.contexte(d) : {}, { signal: ctl.signal, onText: ({ text }) => { pOut.textContent = text; } });
        pOut.textContent = r.text; conv.push({ role: 'assistant', content: r.text, origine: 'ia' });
        if (o.propositions.length) afficherPropositions(o);
        sauver(conv);
      } catch (e) { pOut.textContent = e.text || ''; if (!e.text) out.remove(); err.textContent = AI.erreur(e); conv.pop(); }
      finally { send.disabled = false; stop.hidden = true; }
    });
    sheet('Coach', [
      h('p', { class: 'foot muted' }, 'Le coach lit seulement les données que tu autorises, et ne les modifie jamais sans ton accord. Il n’est ni médecin ni conseiller financier.'),
      accords.length ? h('div', { class: 'coach-acc', role: 'group', 'aria-label': 'Données que le coach peut lire' }, h('span', { class: 'foot muted' }, 'Données lisibles :'), accords) : null,
      rapides.length ? h('div', { class: 'coach-rap' }, h('p', { class: 'foot muted' }, 'Questions rapides (répondues par Cap, sans IA) :'), rapides.map(r => h('button', { class: 'chip-btn', type: 'button', onclick: () => { const o = outils(d); const rep = r.rep(o); bulle('user', r.q); bulle('assistant', rep, 'cap'); conv.push({ role: 'user', content: r.q }, { role: 'assistant', content: rep, origine: 'cap' }); sauver(conv); } }, r.q))) : null,
      msgs, propZone,
      iaOk ? null : h('div', { class: 'note', role: 'status' }, 'Questions libres indisponibles ici : l’IA fonctionne quand Cap est ouvert dans l’appli Claude. Les questions rapides ci-dessus restent disponibles.'),
      h('label', { class: 'field', for: 'coach-q' }, 'Ta question', q), err, h('div', { class: 'ia-actions' }, send, stop),
      conv.length ? h('button', { class: 'btn text', type: 'button', onclick: async () => { conv = []; msgs.textContent = ''; try { await U().remove('conversations', 'principal'); } catch (e) { /* déjà vide */ } } }, 'Effacer la conversation') : null], { focus: false });
  }
  async function appliquer(pr, d) {
    const { savePrefs, toast } = U();
    if (pr.type === 'reporter_seance') { const x = U().seanceDuJour(); if (x && x.se) { await U().reporter(x.se); } else toast('Pas de séance à reporter aujourd’hui.'); return; }
    if (pr.type === 'objectif_kcal') {
      const k = Math.round(pr.valeur), m = d.phys.macros, perso = { kcal: k, p: m.prot, f: m.lip, c: Math.round((k - m.prot * 4 - m.lip * 9) / 4) };
      if (!E().validerObjectifsPerso(perso, d.phys).ok) { toast('Proposition refusée par les règles de sécurité de Cap.'); return; }
      try { await U().saveProfil({ objectifsPerso: perso }); toast('Objectif modifié (ancienne version gardée dans l’historique)'); } catch (e) { toast('Échec, réessaie'); }
    }
  }
  window.CapCoach = { ouvrir, outils, RAPIDES };
})();
