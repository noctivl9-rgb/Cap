/* Cap — journal alimentaire, scan photo, eau, activités, progrès, coach.
 * S'appuie sur CapUI (app.js) pour l'interface commune et sur CapEngine pour chaque chiffre. */
(function () {
  'use strict';
  const E = window.CapEngine, F = window.CapFoods, AI = window.CapAI;
  let U = null, jour = null, assets = null, coachHist = [], plageProgres = 90;
  const J = {};

  J.init = async () => {
    U = window.CapUI; jour = U.dayId();
    if (window.claude && window.claude.use) { try { assets = await window.claude.use('assets'); } catch (e) { assets = null; } if (assets) U.refresh(); }
  };
  const h = (...a) => U.h(...a), icon = (...a) => U.icon(...a), fr = (...a) => U.fr(...a);
  const S = () => U.S;
  const today = () => U.dayId();
  const shift = (d, n) => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() + n); return U.dayId(x); };
  const longDate = d => new Date(d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  // ================================================================ Données du journal
  function journal(d) {
    const j = S().journaux[d] || {};
    return { date: d, items: (j.items || []).map((it, i) => Object.assign(E.normEntree(it), { id: it.id || ('v' + i) })), eauMl: Number(j.eauMl) || 0, activites: (j.activites || []).slice() };
  }
  async function saveJournal(d, j) {
    const doc = { date: d, items: j.items.map(it => { const o = {}; Object.keys(it).forEach(k => { if (it[k] !== null && it[k] !== undefined) o[k] = it[k]; }); return o; }), eauMl: j.eauMl || 0, activites: j.activites || [] };
    S().journaux[d] = doc;
    await U.put('repas', d, doc);
    U.refresh();
  }
  const poidsActuel = () => { const t = E.tendance(S().pesees).dernier; return t ? t.poids : (S().profil || {}).poids; };
  const regime = () => (S().profil || {}).regime || 'omnivore';
  function tousAliments() {
    const perso = S().perso.map(a => ({ id: a.id, n: a.n, cat: 'Mes aliments', k: a.k, p: a.p, c: a.c, f: a.f, portion: a.portion || 100, portionLabel: a.portionLabel || '1 portion', tags: [], src: 'perso' }));
    const rec = S().recettes.map(r => ({ id: r.id, n: r.n, cat: 'Mes recettes', k: r.k, p: r.p, c: r.c, f: r.f, portion: 1, portionLabel: '1 portion', tags: [], src: 'recette' }));
    return F.BASE.concat(perso, rec);
  }
  const cle = al => (al.src === 'perso' ? 'p:' : al.src === 'recette' ? 'r:' : 'b:') + al.id;
  const estFavori = al => (S().prefs.favoris || []).indexOf(cle(al)) >= 0;
  async function basculerFavori(al) { const f = (S().prefs.favoris || []).slice(); const i = f.indexOf(cle(al)); if (i >= 0) f.splice(i, 1); else f.push(cle(al)); await U.savePrefs({ favoris: f }); }
  function budget(d, dt) {
    if (!d.phys || !d.phys.ok) return null;
    return E.budgetJour({ phys: d.phys, perso: d.p.objectifsPerso, prefs: S().prefs, journal: journal(dt), veille: journal(shift(dt, -1)) });
  }

  // ================================================================ Petits composants
  function ring(ratio, size, stroke, color, label, key) {
    const r = (size - stroke) / 2, C = 2 * Math.PI * r, v = Math.max(0, Math.min(1, ratio || 0));
    if (key) {
      const prev = U.derniers['ring-' + key]; U.derniers['ring-' + key] = v;
      if (prev !== undefined && prev !== v && !U.reduced() && v > 0) {
        const el = ring(prev || 0.0001, size, stroke, color, label);
        requestAnimationFrame(() => requestAnimationFrame(() => { const c = el.querySelectorAll('circle')[1]; if (c) c.setAttribute('stroke-dasharray', (C * v).toFixed(1) + ' ' + C.toFixed(1)); }));
        return el;
      }
    }
    return h('span', { class: 'ringw', style: 'width:' + size + 'px;height:' + size + 'px', html: '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '" role="img" aria-label="' + (label || Math.round(v * 100) + ' %') + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--fill-2)" stroke-width="' + stroke + '"/>' + (v > 0 ? '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + (C * v).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')" style="transition:stroke-dasharray .45s var(--ease)"/>' : '') + '</svg>' });
  }
  function seg(options, value, onPick, label) {
    const wrap = h('div', { class: 'seg seg-simple', role: 'radiogroup', 'aria-label': label || '' });
    options.forEach(([v, t]) => wrap.appendChild(h('button', { type: 'button', role: 'radio', 'aria-checked': String(v === value), class: v === value ? 'on' : '', onclick: e => { wrap.querySelectorAll('button').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-checked', 'false'); }); e.currentTarget.classList.add('on'); e.currentTarget.setAttribute('aria-checked', 'true'); onPick(v); } }, t)));
    return wrap;
  }
  function interrupteur(label, sub, on, onChange) {
    const b = h('button', { class: 'cell', type: 'button', role: 'switch', 'aria-checked': String(!!on), onclick: () => onChange(!on) }, h('span', { class: 'lbl' }, label, sub ? h('small', null, sub) : null), h('span', { class: 'switch' + (on ? ' on' : '') }, h('i')));
    return b;
  }
  const slotSeg = (val, onPick) => seg(E.ORDRE_CRENEAUX.map(k => [k, ({ petitdej: 'Matin', dejeuner: 'Midi', collation: 'Collation', diner: 'Soir' })[k]]), val, onPick, 'Repas');
  function numInput(id, val, ph, onInput, mode) {
    const i = h('input', { id, inputmode: mode || 'decimal', autocomplete: 'off', placeholder: ph || '', value: val === null || val === undefined ? '' : String(val).replace('.', ',') });
    i.addEventListener('input', () => { const v = parseFloat(i.value.replace(/\s/g, '').replace(',', '.')); onInput(isFinite(v) ? v : null); });
    return i;
  }

  // ================================================================ Accueil
  J.viewAccueil = d => {
    const out = [], t = today();
    if (jour > t) jour = t;
    const S0 = S();
    const joursData = Object.keys(S0.journaux).filter(k => (S0.journaux[k].items || []).length);
    const serie = E.serie(joursData, t);
    const right = h('div', { style: 'display:flex;gap:8px;align-items:center' },
      d.corps ? h('span', { class: 'chip ' + (serie ? 'warn' : 'neutral'), title: 'Jours consécutifs avec au moins un repas noté' }, icon('flame'), serie + ' j') : null,
      h('button', { class: 'round glass press', type: 'button', 'aria-label': 'Coach', onclick: () => J.coach(d) }, icon('chat')));
    out.push(U.largeTitle(jour === t ? 'Aujourd’hui' : (jour === shift(t, -1) ? 'Hier' : fr(new Date(jour + 'T12:00').getDate()) + ' ' + new Date(jour + 'T12:00').toLocaleDateString('fr-FR', { month: 'long' })), longDate(jour), right));
    if (d.corps) out.push(bandeSemaine(d));
    if (jour !== t) out.push(h('div', { class: 'note tint', style: 'display:flex;justify-content:space-between;align-items:center;gap:8px' }, h('span', null, 'Tu modifies le journal du ' + longDate(jour) + '.'), h('button', { class: 'link', type: 'button', onclick: () => { jour = t; U.refresh(); } }, 'Revenir')));
    if (d.corps) {
      if (!d.phys || !d.phys.ok) out.push(h('div', { class: 'note' }, d.phys ? d.phys.message : ''), h('button', { class: 'btn', type: 'button', onclick: () => U.startOnboarding(Object.assign({}, S0.profil), { only: U.missingSteps(), fresh: true }) }, 'Compléter mes réponses'));
      else {
        const b = budget(d, jour), j = journal(jour);
        out.push(carteCalories(d, b));
        out.push(cartesMacros(d, b));
        out.push(h('div', { class: 'grid2' }, carteEau(j), carteActivite(d, j)));
        out.push(listeRepas(d, j));
      }
    }
    if (jour === t) { const a = actions(d); if (a) out.push(a); }
    const imp = d.issues.filter(i => i.niveau !== 'info');
    if (imp.length) out.push(U.section('À vérifier', null, imp.map(i => U.issueView(i, champ => U.editStep(U.STEP_BY_FIELD[champ] || champ)))));
    return out;
  };
  function bandeSemaine(d) {
    const t = today();
    const fin = jour < shift(t, -6) ? shift(jour, 3) : t;
    const days = []; for (let i = 6; i >= 0; i--) days.push(shift(fin, -i));
    const cible = d.phys && d.phys.ok ? E.cibleJour(d.phys, d.p.objectifsPerso).kcal : null;
    const strip = h('div', { class: 'week', role: 'group', 'aria-label': 'Choisir un jour' }, days.map(id => {
      const dt = new Date(id + 'T12:00'), j = S().journaux[id], kc = j && (j.items || []).length ? E.totaux(j.items).k : null;
      const fut = id > t;
      return h('button', { class: 'daybtn' + (id === jour ? ' on' : ''), type: 'button', disabled: fut, 'aria-pressed': String(id === jour), 'aria-label': longDate(id) + (kc === null ? ', rien de noté' : ', ' + kc + ' kcal'), onclick: () => { jour = id; U.refresh(); } },
        h('small', null, dt.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').slice(0, 3)),
        kc === null ? h('span', { class: 'ringw empty' }, h('b', null, String(dt.getDate()))) : h('span', { style: 'position:relative;display:grid;place-items:center' }, ring(cible ? kc / cible : 1, 34, 3, kc > (cible || 1e9) * 1.05 ? 'var(--bad)' : 'var(--body)'), h('b', { style: 'position:absolute' }, String(dt.getDate()))));
    }));
    return h('div', { style: 'display:flex;gap:6px;align-items:center' }, strip, h('button', { class: 'round press', type: 'button', style: 'background:var(--fill);flex:none', 'aria-label': 'Calendrier', onclick: () => calendrier() }, icon('today')));
  }
  function carteCalories(d, b) {
    const reste = b.restant;
    const lines = [
      'Objectif du jour : ' + (b.perso ? 'personnalisé, ' : 'calculé, ') + fr(b.base) + ' kcal.',
      b.bonus ? 'Activité hors programme : +' + b.bonus + ' kcal (50 % de ' + b.horsProgKcal + ' kcal estimées, par prudence).' : 'Calories d’activité ajoutées : ' + (S().prefs.bonusActivite ? 'aucune activité hors programme notée.' : 'option désactivée (Réglages).'),
      b.report ? 'Report de la veille : +' + b.report + ' kcal (200 maximum).' : 'Report de la veille : ' + (S().prefs.report ? 'rien à reporter.' : 'option désactivée.'),
      'Noté aujourd’hui : ' + fr(b.mange) + ' kcal. Reste = ' + fr(b.total) + ' − ' + fr(b.mange) + ' = ' + fr(reste) + ' kcal.'
    ].concat(b.perso ? [] : d.phys.calcul);
    return h('section', { class: 'panel' },
      h('div', { class: 'hero' }, h('div', null, h('b', null, U.nombre('kcal-reste-' + jour, Math.abs(reste), v => fr(v))), h('div', { class: 'muted sub' }, reste >= 0 ? 'kcal restantes' : 'kcal au-dessus de l’objectif')), h('span', { style: 'position:relative;display:grid;place-items:center' }, ring(b.mange / b.total, 96, 10, reste < 0 ? 'var(--bad)' : 'var(--ink)', Math.round(b.mange / b.total * 100) + ' % de l’objectif', 'kcal-' + jour), h('span', { style: 'position:absolute;color:var(--body)' }, icon('flame')))),
      h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' }, h('span', { class: 'chip neutral' }, 'Objectif ' + fr(b.base)), b.bonus ? h('span', { class: 'chip info' }, '+' + b.bonus + ' activité') : null, b.report ? h('span', { class: 'chip info' }, '+' + b.report + ' report') : null, h('span', { class: 'chip neutral' }, 'Noté ' + fr(b.mange))),
      U.howBtn('Calories du jour', lines));
  }
  function cartesMacros(d, b) {
    const t = b.totaux, m = b.macros, simple = !!(S().profil || {}).modeSimple;
    const card = (lbl, have, goal, col) => {
      const rest = Math.round(goal - have);
      return h('div', { class: 'stat', style: 'gap:8px' }, h('span', { style: 'position:relative;display:grid;place-items:center;align-self:flex-start' }, ring(have / goal, 44, 5, col, Math.round(have) + ' g sur ' + goal + ' g', lbl + jour)), h('b', null, U.nombre('mac-' + lbl + jour, Math.abs(rest), v => Math.round(v) + ' g')), h('span', null, lbl + (rest >= 0 ? ' restants' : ' en trop')));
    };
    if (simple) return h('div', { class: 'grid2' }, card('Protéines', t.p, m.prot, 'var(--body)'), h('div', { class: 'stat' }, h('b', null, 'Mode simple'), h('span', null, 'Glucides et lipides masqués. Réglages › Nutrition pour les afficher.')));
    return h('div', { class: 'stats' }, card('Protéines', t.p, m.prot, 'var(--body)'), card('Glucides', t.c, m.glu, '#FF9F0A'), card('Lipides', t.f, m.lip, 'var(--accent)'));
  }
  function carteEau(j) {
    const goal = E.objectifEau(poidsActuel());
    const setE = async v => { const jj = journal(jour); const avant = jj.eauMl; jj.eauMl = Math.max(0, v); try { await saveJournal(jour, jj); if (avant < goal && jj.eauMl >= goal && window.CapSon) window.CapSon.jouer('objectif'); } catch (e) { U.toast('Échec, réessaie'); } };
    return h('div', { class: 'stat', style: 'gap:8px' },
      h('div', { style: 'display:flex;align-items:center;gap:6px;color:var(--accent)' }, icon('drop'), h('span', { class: 'foot', style: 'color:var(--muted)' }, 'Eau')),
      h('b', null, U.nombre('eau-' + jour, j.eauMl, v => fr(v) + ' ml')), h('span', null, 'sur ' + fr(goal) + ' ml'),
      h('div', { class: 'bar' }, h('i', { style: 'width:' + Math.min(100, j.eauMl / goal * 100) + '%;background:var(--accent)' })),
      h('div', { style: 'display:flex;gap:8px' }, h('button', { class: 'round press', type: 'button', style: 'width:36px;height:36px;background:var(--fill)', 'aria-label': 'Retirer 250 ml', disabled: !j.eauMl, onclick: () => setE(j.eauMl - 250) }, icon('minus')), h('button', { class: 'round press', type: 'button', style: 'width:36px;height:36px;background:var(--accent-soft);color:var(--accent);flex:1;border-radius:999px', 'aria-label': 'Ajouter 250 ml', onclick: () => setE(j.eauMl + 250) }, icon('plus'), h('span', { class: 'foot', style: 'font-weight:600;margin-left:2px' }, '250 ml'))));
  }
  function carteActivite(d, j) {
    const kc = j.activites.reduce((s, a) => s + (a.kcal || 0), 0), min = j.activites.reduce((s, a) => s + (a.min || 0), 0);
    return h('div', { class: 'stat', style: 'gap:8px' },
      h('div', { style: 'display:flex;align-items:center;gap:6px;color:var(--body)' }, icon('run'), h('span', { class: 'foot', style: 'color:var(--muted)' }, 'Activité')),
      h('b', null, U.nombre('act-' + jour, kc, v => fr(v) + ' kcal')), h('span', null, min ? min + ' min, estimation' : 'Rien de noté'),
      h('div', { style: 'flex:1' }),
      h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px' }, j.activites.length ? h('button', { class: 'btn small secondary', type: 'button', style: 'flex:1 1 60px;min-width:0;min-height:36px;padding:0 10px', onclick: () => listeActivites(d) }, 'Voir') : null, h('button', { class: 'btn small tinted', type: 'button', style: 'flex:1 1 80px;min-width:0;min-height:36px;padding:0 10px', onclick: () => ajouterActivite(d) }, icon('plus'), 'Ajouter')));
  }
  function listeRepas(d, j) {
    const blocs = E.ORDRE_CRENEAUX.map(sl => {
      const items = j.items.filter(it => it.slot === sl);
      const kc = E.totaux(items).k;
      return h('div', { class: 'panel flush' },
        h('div', { class: 'cell slot-h' }, h('span', { class: 'lbl', style: 'font-weight:600' }, E.CRENEAUX[sl], h('small', null, items.length ? fr(kc) + ' kcal' : 'Rien de noté')), h('button', { class: 'round press', type: 'button', style: 'width:34px;height:34px;background:var(--fill)', 'aria-label': 'Ajouter au ' + E.CRENEAUX[sl].toLowerCase(), onclick: () => ajouterAliment(sl) }, icon('plus'))),
        items.map(it => h('button', { class: 'cell', type: 'button', onclick: () => modifierEntree(it) },
          h('span', { class: 'lbl' }, it.n, h('small', null, (it.q ? (it.unit === 'portion' ? fr(it.q, 1) + ' portion' + (it.q > 1 ? 's' : '') : fr(it.q) + ' g') + ' · ' : '') + 'P ' + fr(it.p) + ' · G ' + fr(it.c) + ' · L ' + fr(it.f) + (it.src === 'scan' ? ' · estimé par photo' : ''))),
          h('span', { class: 'val num', style: 'color:var(--ink);font-weight:600' }, fr(it.k)), icon('chev', 'chev'))));
    });
    return U.section('Repas', j.items.length ? null : 'Rien de noté pour ce jour. Cap n’estime rien à ta place.', blocs);
  }
  function actions(d) {
    const acts = [], now = new Date();
    if (d.corps && d.prog && d.prog.ok) {
      const pl = d.prog.planning.find(x => x.jour === now.getDay());
      if (pl) { const se = d.prog.seances.find(s => s.cle === pl.seance); acts.push({ t: 'Séance : ' + se.nom, s: se.duree + ' min · ' + se.objectif, done: S().seances.some(l => l.date === today()), go: () => U.setTab('prog') }); }
      const last = E.tendance(S().pesees).dernier;
      if (!last || (new Date(today()) - new Date(last.date)) / 864e5 >= 7) acts.push({ t: 'Pesée de la semaine', s: 'Le matin, à jeun', done: false, go: () => U.addPesee() });
    }
    if (d.argent && d.fin && d.fin.ok) acts.push({ t: 'Action argent de la semaine', s: d.fin.niveaux.action.texte, done: !!(S().actions.done || {}).argent, toggle: 'argent' });
    if (!acts.length) return null;
    return U.section('Prochaines actions', null, h('div', { class: 'panel flush' }, acts.map(a => h('button', { class: 'cell', type: 'button', role: a.toggle ? 'checkbox' : null, 'aria-checked': a.toggle ? String(a.done) : null,
      onclick: async () => { if (a.toggle) { const done = Object.assign({}, S().actions.done || {}); done[a.toggle] = !done[a.toggle]; try { await U.put('actions', U.weekKey(), { done }); S().actions = { done }; U.refresh(); } catch (e) { U.toast('Échec, réessaie'); } } else a.go(); } },
      h('span', { class: 'ico', style: 'background:' + (a.done ? 'var(--good)' : 'var(--fill-2)') + ';color:' + (a.done ? '#fff' : 'var(--ink-2)') }, icon(a.done ? 'check' : 'chev')), h('span', { class: 'lbl' }, a.t, h('small', null, a.s))))));
  }

  // ================================================================ Menu d'ajout (bouton flottant)
  J.menuAjout = d => {
    let close;
    const go = fn => () => { close(); setTimeout(fn, 60); };
    const photo = AI.photoDispo();
    let ti = 0;
    const tile = (ic, t, s, fn, dis) => h('button', { class: 'tile press', type: 'button', disabled: !!dis, onclick: fn, style: 'animation-delay:' + (ti++ * 35) + 'ms' }, h('span', { class: 'tile-i' }, icon(ic)), h('b', null, t), s ? h('small', null, s) : null);
    close = U.sheet('Ajouter', [h('div', { class: 'tiles' },
      tile('camera', 'Scanner un repas', photo ? 'Photo analysée par l’IA' : 'Indisponible ici', go(() => scanner())),
      tile('search', 'Rechercher', 'Base d’aliments, favoris', go(() => ajouterAliment())),
      tile('edit', 'Ajout rapide', 'Calories et macros', go(() => ajoutRapide())),
      tile('drop', 'Eau', '+250 ml', go(async () => { const j = journal(jour); j.eauMl += 250; try { await saveJournal(jour, j); U.toast('+250 ml'); } catch (e) { U.toast('Échec, réessaie'); } })),
      tile('run', 'Activité', 'Sport, marche', go(() => ajouterActivite(d))),
      tile('scale', 'Pesée', 'Poids, tour de taille', go(() => U.addPesee()))),
      !photo ? h('p', { class: 'foot muted' }, 'L’analyse photo utilise Claude. Elle fonctionne quand Cap est ouvert dans l’appli Claude, connecté, et que tu l’autorises.') : null], { focus: false });
  };

  // ================================================================ Recherche d'aliments
  function ajouterAliment(slot, pick) {
    const q = h('input', { id: 'q-food', type: 'search', placeholder: 'Rechercher un aliment', autocomplete: 'off', 'aria-label': 'Rechercher un aliment' });
    const list = h('div', { style: 'display:flex;flex-direction:column;gap:12px' });
    let close;
    const row = al => h('button', { class: 'cell', type: 'button', onclick: () => { close(); detailAliment(al, { slot, pick }); } },
      h('span', { class: 'lbl' }, al.n, h('small', null, al.src === 'recette' ? fr(al.k) + ' kcal par portion' : fr(al.k * al.portion / 100) + ' kcal · ' + al.portionLabel + ' (' + al.portion + ' g)')), estFavori(al) ? h('span', { style: 'color:#FF9F0A' }, icon('star')) : null, icon('chev', 'chev'));
    const grp = (titre, arr) => arr.length ? h('div', { class: 'sec' }, h('div', { class: 'cap' }, titre), h('div', { class: 'panel flush' }, arr.map(row))) : null;
    function draw() {
      list.textContent = '';
      const all = tousAliments(), rg = regime();
      if (q.value.trim()) {
        const r = F.chercher(q.value, all, rg).slice(0, 40);
        U.add(list, r.length ? h('div', { class: 'panel flush' }, r.map(row)) : h('p', { class: 'muted sub' }, 'Aucun résultat. Crée cet aliment ou utilise l’ajout rapide.'));
        return;
      }
      const fav = all.filter(estFavori).filter(a => F.compatible(a, rg));
      const recents = [], vus = {};
      Object.keys(S().journaux).sort().reverse().slice(0, 30).forEach(k => (S().journaux[k].items || []).slice().reverse().forEach(it => { const e = E.normEntree(it); if (!vus[e.n] && recents.length < 8) { vus[e.n] = 1; recents.push(e); } }));
      if (!pick && recents.length) U.add(list, h('div', { class: 'sec' }, h('div', { class: 'cap' }, 'Récents'), h('div', { class: 'panel flush' }, recents.map(e => h('button', { class: 'cell', type: 'button', onclick: async () => { close(); await ajouterEntree(jour, slot || E.creneauParHeure(new Date()), Object.assign({}, e, { id: null, slot: null, ts: null })); } }, h('span', { class: 'lbl' }, e.n, h('small', null, (e.q ? fr(e.q) + (e.unit === 'portion' ? ' portion · ' : ' g · ') : '') + fr(e.k) + ' kcal')), icon('plus'))))));
      U.add(list, grp('Favoris', fav), grp('Mes recettes', all.filter(a => a.src === 'recette')), grp('Mes aliments', all.filter(a => a.src === 'perso')), grp('Tous les aliments', F.chercher('', F.BASE, rg)));
    }
    q.addEventListener('input', draw);
    const btns = pick ? null : h('div', { class: 'row-btns' }, h('button', { class: 'btn small secondary', type: 'button', onclick: () => { close(); ajoutRapide(slot); } }, 'Ajout rapide'), h('button', { class: 'btn small secondary', type: 'button', onclick: () => { close(); creerAliment(); } }, 'Créer un aliment'), h('button', { class: 'btn small secondary', type: 'button', onclick: () => { close(); creerRecette(); } }, 'Recette'));
    close = U.sheet(pick ? 'Choisir un aliment' : 'Ajouter' + (slot ? ' · ' + E.CRENEAUX[slot] : ''), [h('div', { class: 'searchbox' }, icon('search'), q), btns, list, h('p', { class: 'foot muted' }, 'Valeurs moyennes des tables publiques (Ciqual, USDA), à ±10-15 %. « est. » = plat estimé.')], { focus: false });
    draw();
  }
  const CUISABLE = ['Viandes', 'Poissons', 'Œufs', 'Légumes', 'Féculents', 'Végétal', 'Légumineuses', 'Mes aliments'];
  function detailAliment(al, o) {
    o = o || {};
    const rec = al.src === 'recette';
    const st = { q: rec ? 1 : al.portion, cuisson: 'aucune', slot: o.slot || E.creneauParHeure(new Date()) };
    const calc = () => rec ? { n: al.n, q: st.q, unit: 'portion', k: Math.round(al.k * st.q), p: Math.round(al.p * st.q * 10) / 10, c: Math.round(al.c * st.q * 10) / 10, f: Math.round(al.f * st.q * 10) / 10 } : E.entreeDepuisAliment(al, st.q, st.cuisson);
    const res = h('div', { class: 'panel' });
    const err = h('div', { class: 'err', role: 'alert' });
    let addBtn;
    const draw = () => {
      res.textContent = '';
      const valid = st.q > 0 && st.q <= (rec ? 20 : 3000);
      err.textContent = valid ? '' : (rec ? 'Entre 0,1 et 20 portions.' : 'Entre 1 et 3 000 g.');
      if (addBtn) addBtn.disabled = !valid;
      if (!valid) return;
      const e = calc();
      U.add(res, h('div', { class: 'hero' }, h('div', null, h('b', { class: 'num' }, fr(e.k)), h('span', null, ' kcal'))), h('div', { class: 'stats' }, h('div', { class: 'stat' }, h('b', null, fr(e.p, 1) + ' g'), h('span', null, 'Protéines')), h('div', { class: 'stat' }, h('b', null, fr(e.c, 1) + ' g'), h('span', null, 'Glucides')), h('div', { class: 'stat' }, h('b', null, fr(e.f, 1) + ' g'), h('span', null, 'Lipides'))),
        st.cuisson !== 'aucune' ? h('p', { class: 'foot muted' }, 'Cuisson : +' + fr(E.CUISSON[st.cuisson][1] * st.q / 100, 1) + ' g de matière grasse estimés (' + E.CUISSON[st.cuisson][1] + ' g pour 100 g, hypothèse).') : null);
    };
    const qIn = numInput('q-qte', st.q, rec ? '1' : '100', v => { st.q = v; draw(); });
    const chips = (rec ? [[0.5, '½ portion'], [1, '1 portion'], [2, '2 portions']] : [[al.portion, al.portionLabel + ' (' + al.portion + ' g)'], [Math.round(al.portion / 2), '½'], [al.portion * 2, '×2'], [100, '100 g']])
      .map(([v, t]) => h('button', { class: 'chip neutral press', type: 'button', onclick: () => { st.q = v; qIn.value = String(v).replace('.', ','); draw(); } }, t));
    const fav = h('button', { class: 'round press', type: 'button', style: 'background:var(--fill);color:' + (estFavori(al) ? '#FF9F0A' : 'var(--ink-2)'), 'aria-label': estFavori(al) ? 'Retirer des favoris' : 'Ajouter aux favoris', 'aria-pressed': String(estFavori(al)), onclick: async e => { const b = e.currentTarget; try { await basculerFavori(al); const on = estFavori(al); b.style.color = on ? '#FF9F0A' : 'var(--ink-2)'; b.setAttribute('aria-pressed', String(on)); U.toast(on ? 'Ajouté aux favoris' : 'Retiré des favoris'); } catch (x) { U.toast('Échec, réessaie'); } } }, icon('star'));
    let close;
    addBtn = h('button', { class: 'btn', type: 'button', onclick: async () => {
      const e = calc(); e.src = al.src; e.ref = cle(al);
      if (o.pick) { close(); o.pick(e, al, st.q, st.cuisson); return; }
      close(); await ajouterEntree(o.date || jour, st.slot, e);
    } }, o.pick ? 'Ajouter' : 'Ajouter au journal');
    close = U.sheet(al.n, [
      h('div', { style: 'display:flex;justify-content:space-between;align-items:center;gap:8px' }, h('p', { class: 'muted sub' }, rec ? 'Par portion : ' + fr(al.k) + ' kcal' : 'Pour 100 g : ' + fr(al.k) + ' kcal · P ' + fr(al.p, 1) + ' · G ' + fr(al.c, 1) + ' · L ' + fr(al.f, 1)), fav),
      h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' }, chips),
      h('label', { class: 'field', for: 'q-qte' }, rec ? 'Nombre de portions' : 'Quantité (g)', qIn), err,
      !rec && (CUISABLE.indexOf(al.cat) >= 0) ? h('div', { class: 'field' }, 'Cuisson', seg(Object.keys(E.CUISSON).map(k => [k, E.CUISSON[k][0]]), st.cuisson, v => { st.cuisson = v; draw(); }, 'Cuisson')) : null,
      o.pick ? null : h('div', { class: 'field' }, 'Repas', slotSeg(st.slot, v => { st.slot = v; })),
      res, addBtn], { focus: false });
    draw();
  }
  async function ajouterEntree(date, slot, e) {
    const j = journal(date);
    const it = Object.assign({}, e, { id: U.uid(), slot, ts: new Date().toISOString() });
    j.items.push(it);
    try { await saveJournal(date, j); U.toast('Ajouté · ' + fr(it.k) + ' kcal'); } catch (x) { U.toast('Échec, réessaie'); }
  }
  function modifierEntree(it) {
    const st = { q: it.q || 1, slot: it.slot, dup: today() };
    const base = Object.assign({}, it);
    const hasQ = !!it.q;
    const res = h('p', { class: 'sub' });
    const scaled = () => { const f = hasQ ? st.q / it.q : st.q; return { k: Math.round(base.k * f), p: Math.round(base.p * f * 10) / 10, c: Math.round(base.c * f * 10) / 10, f: Math.round(base.f * f * 10) / 10 }; };
    const err = h('div', { class: 'err', role: 'alert' });
    let save;
    const draw = () => { const ok = st.q > 0 && st.q <= (hasQ ? 3000 : 20); err.textContent = ok ? '' : 'Quantité invalide.'; if (save) save.disabled = !ok; if (!ok) return; const v = scaled(); res.textContent = fr(v.k) + ' kcal · P ' + fr(v.p, 1) + ' g · G ' + fr(v.c, 1) + ' g · L ' + fr(v.f, 1) + ' g'; };
    const qIn = numInput('e-qte', st.q, '', v => { st.q = v; draw(); });
    const dIn = h('input', { id: 'e-dup', type: 'date', value: today(), max: today() });
    let close;
    save = h('button', { class: 'btn', type: 'button', onclick: async () => {
      const j = journal(jour); const i = j.items.findIndex(x => x.id === it.id); if (i < 0) { close(); return; }
      j.items[i] = Object.assign({}, j.items[i], scaled(), { q: hasQ ? st.q : (it.q || null), slot: st.slot });
      if (!hasQ && st.q !== 1) j.items[i].n = it.n + ' ×' + fr(st.q, 1);
      try { await saveJournal(jour, j); close(); U.toast('Modifié'); } catch (e) { err.textContent = 'Échec, réessaie.'; }
    } }, 'Enregistrer');
    const dup = h('button', { class: 'btn secondary', type: 'button', onclick: async () => { const v = scaled(); close(); await ajouterEntree(dIn.value || today(), st.slot, Object.assign({}, it, v, { q: hasQ ? st.q : it.q, id: null })); } }, icon('copy'), 'Dupliquer');
    const del = h('button', { class: 'btn text', type: 'button', style: 'color:var(--bad)', onclick: async () => { const j = journal(jour); j.items = j.items.filter(x => x.id !== it.id); try { await saveJournal(jour, j); close(); U.toast('Supprimé'); } catch (e) { U.toast('Échec, réessaie'); } } }, icon('trash'), 'Supprimer');
    close = U.sheet(it.n, [
      it.src === 'scan' ? h('p', { class: 'foot muted' }, 'Estimé à partir d’une photo' + (it.conf ? ' (confiance ' + it.conf + ')' : '') + '.') : null,
      h('label', { class: 'field', for: 'e-qte' }, hasQ ? (it.unit === 'portion' ? 'Portions' : 'Quantité (g)') : 'Multiplier par', qIn), err, res,
      h('div', { class: 'field' }, 'Repas', slotSeg(st.slot, v => { st.slot = v; })), save,
      h('div', { class: 'panel', style: 'gap:8px' }, h('label', { class: 'field', for: 'e-dup' }, 'Dupliquer vers le', dIn), dup), del], { focus: false });
    draw();
  }
  function ajoutRapide(slot) {
    const st = { n: '', k: null, p: 0, c: 0, f: 0, slot: slot || E.creneauParHeure(new Date()) };
    const nIn = h('input', { id: 'r-n', placeholder: 'Ex. sandwich maison', autocomplete: 'off' }); nIn.addEventListener('input', () => { st.n = nIn.value; });
    const err = h('div', { class: 'err', role: 'alert' });
    let close;
    close = U.sheet('Ajout rapide', [h('label', { class: 'field', for: 'r-n' }, 'Nom', nIn), h('div', { class: 'grid2' },
      h('label', { class: 'field', for: 'r-k' }, 'Calories (kcal)', numInput('r-k', null, '450', v => { st.k = v; }, 'numeric')), h('label', { class: 'field', for: 'r-p' }, 'Protéines (g)', numInput('r-p', null, '0', v => { st.p = v || 0; })),
      h('label', { class: 'field', for: 'r-c' }, 'Glucides (g)', numInput('r-c', null, '0', v => { st.c = v || 0; })), h('label', { class: 'field', for: 'r-f' }, 'Lipides (g)', numInput('r-f', null, '0', v => { st.f = v || 0; }))),
      h('div', { class: 'field' }, 'Repas', slotSeg(st.slot, v => { st.slot = v; })), err,
      h('button', { class: 'btn', type: 'button', onclick: async () => { if (!st.n.trim()) { err.textContent = 'Donne un nom.'; return; } if (!(st.k > 0 && st.k <= 5000)) { err.textContent = 'Calories entre 1 et 5 000.'; return; } close(); await ajouterEntree(jour, st.slot, { n: st.n.trim().slice(0, 60), k: Math.round(st.k), p: st.p, c: st.c, f: st.f, src: 'manuel' }); } }, 'Ajouter au journal')]);
  }
  function creerAliment(existant) {
    const st = Object.assign({ n: '', k: null, p: null, c: null, f: null, portion: 100, portionLabel: '1 portion' }, existant || {});
    const err = h('div', { class: 'err', role: 'alert' }), warn = h('p', { class: 'foot', style: 'color:var(--warn)' });
    const nIn = h('input', { id: 'c-n', value: st.n, placeholder: 'Ex. Barre protéinée X' }); nIn.addEventListener('input', () => { st.n = nIn.value; check(); });
    const lIn = h('input', { id: 'c-l', value: st.portionLabel }); lIn.addEventListener('input', () => { st.portionLabel = lIn.value; });
    const check = () => {
      warn.textContent = '';
      if (st.k > 0 && st.p >= 0 && st.c >= 0 && st.f >= 0) { const km = st.p * 4 + st.c * 4 + st.f * 9; if (Math.abs(km - st.k) / st.k > 0.25) warn.textContent = 'Les macros donnent ' + Math.round(km) + ' kcal pour 100 g, contre ' + st.k + ' saisies. Vérifie l’étiquette.'; }
    };
    let close;
    close = U.sheet(existant ? 'Modifier l’aliment' : 'Créer un aliment', [h('p', { class: 'muted sub' }, 'Recopie l’étiquette nutritionnelle (valeurs pour 100 g).'),
      h('label', { class: 'field', for: 'c-n' }, 'Nom', nIn),
      h('div', { class: 'grid2' }, h('label', { class: 'field', for: 'c-k' }, 'kcal / 100 g', numInput('c-k', st.k, '', v => { st.k = v; check(); }, 'numeric')), h('label', { class: 'field', for: 'c-p' }, 'Protéines / 100 g', numInput('c-p', st.p, '', v => { st.p = v; check(); })),
        h('label', { class: 'field', for: 'c-c' }, 'Glucides / 100 g', numInput('c-c', st.c, '', v => { st.c = v; check(); })), h('label', { class: 'field', for: 'c-f' }, 'Lipides / 100 g', numInput('c-f', st.f, '', v => { st.f = v; check(); })),
        h('label', { class: 'field', for: 'c-g' }, 'Portion (g)', numInput('c-g', st.portion, '100', v => { st.portion = v; }, 'numeric')), h('label', { class: 'field', for: 'c-l' }, 'Nom de la portion', lIn)),
      err, warn,
      h('button', { class: 'btn', type: 'button', onclick: async () => {
        if (!st.n.trim()) { err.textContent = 'Donne un nom.'; return; }
        if (!(st.k >= 0 && st.k <= 900)) { err.textContent = 'Calories pour 100 g entre 0 et 900.'; return; }
        if ([st.p, st.c, st.f].some(v => !(v >= 0)) || st.p + st.c + st.f > 100) { err.textContent = 'Protéines + glucides + lipides : entre 0 et 100 g pour 100 g.'; return; }
        if (!(st.portion > 0 && st.portion <= 3000)) { err.textContent = 'Portion entre 1 et 3 000 g.'; return; }
        const id = existant ? existant.id : U.uid();
        try { await U.put('aliments', id, { n: st.n.trim().slice(0, 60), k: st.k, p: st.p, c: st.c, f: st.f, portion: Math.round(st.portion), portionLabel: (st.portionLabel || '1 portion').slice(0, 30) }); close(); U.toast('Aliment enregistré'); } catch (e) { err.textContent = 'Échec, réessaie.'; }
      } }, 'Enregistrer')], { focus: false });
  }
  function creerRecette(existant) {
    const st = { n: existant ? existant.n : '', portions: existant ? existant.portions : 1, ing: existant ? (existant.ingredients || []).slice() : [] };
    const list = h('div'), tot = h('div', { class: 'note' }), err = h('div', { class: 'err', role: 'alert' });
    const nIn = h('input', { id: 'rc-n', value: st.n, placeholder: 'Ex. Bowl poulet riz' }); nIn.addEventListener('input', () => { st.n = nIn.value; });
    const draw = () => {
      list.textContent = '';
      U.add(list, st.ing.length ? h('div', { class: 'panel flush' }, st.ing.map((e, i) => h('div', { class: 'cell' }, h('span', { class: 'lbl' }, e.n, h('small', null, (e.q ? fr(e.q) + (e.unit === 'portion' ? ' portion · ' : ' g · ') : '') + fr(e.k) + ' kcal')), h('button', { class: 'round press', type: 'button', style: 'width:32px;height:32px;background:var(--fill)', 'aria-label': 'Retirer ' + e.n, onclick: () => { st.ing.splice(i, 1); draw(); } }, icon('trash'))))) : h('p', { class: 'muted sub' }, 'Aucun ingrédient.'));
      const t = E.totaux(st.ing), n = st.portions > 0 ? st.portions : 1;
      tot.textContent = 'Recette entière : ' + fr(t.k) + ' kcal. Par portion (÷ ' + fr(n, 1) + ') : ' + fr(t.k / n) + ' kcal · P ' + fr(t.p / n, 1) + ' · G ' + fr(t.c / n, 1) + ' · L ' + fr(t.f / n, 1);
    };
    let close;
    close = U.sheet(existant ? 'Modifier la recette' : 'Créer une recette', [h('label', { class: 'field', for: 'rc-n' }, 'Nom', nIn),
      h('label', { class: 'field', for: 'rc-p' }, 'Nombre de portions', numInput('rc-p', st.portions, '1', v => { st.portions = v; draw(); })),
      h('div', { class: 'cap', style: 'margin:0' }, 'Ingrédients'), list,
      h('button', { class: 'btn tinted small', type: 'button', onclick: () => ajouterAliment(null, e => { st.ing.push(e); draw(); }) }, icon('plus'), 'Ajouter un ingrédient'),
      tot, err,
      h('button', { class: 'btn', type: 'button', onclick: async () => {
        if (!st.n.trim()) { err.textContent = 'Donne un nom.'; return; }
        if (!st.ing.length) { err.textContent = 'Ajoute au moins un ingrédient.'; return; }
        if (!(st.portions > 0 && st.portions <= 50)) { err.textContent = 'Entre 1 et 50 portions.'; return; }
        const t = E.totaux(st.ing), n = st.portions;
        const id = existant ? existant.id : U.uid();
        try { await U.put('recettes', id, { n: st.n.trim().slice(0, 60), portions: n, ingredients: st.ing.map(e => ({ n: e.n, q: e.q || null, unit: e.unit || null, k: e.k, p: e.p, c: e.c, f: e.f })), k: Math.round(t.k / n), p: Math.round(t.p / n * 10) / 10, c: Math.round(t.c / n * 10) / 10, f: Math.round(t.f / n * 10) / 10 }); close(); U.toast('Recette enregistrée'); } catch (e) { err.textContent = 'Échec, réessaie.'; }
      } }, 'Enregistrer la recette')], { focus: false });
    draw();
  }

  // ================================================================ Scan photo
  function scanner(slot) {
    if (!AI.photoDispo()) {
      let close;
      close = U.sheet('Scanner un repas', [h('div', { class: 'note' }, 'L’analyse photo n’est pas disponible dans cette vue. Elle utilise Claude et fonctionne quand Cap est ouvert dans l’appli Claude, connecté.'),
        h('button', { class: 'btn', type: 'button', onclick: () => { close(); ajouterAliment(slot); } }, 'Rechercher un aliment'), h('button', { class: 'btn secondary', type: 'button', onclick: () => { close(); ajoutRapide(slot); } }, 'Ajout rapide')]);
      return;
    }
    const body = h('div', { style: 'display:flex;flex-direction:column;gap:16px' });
    const st = { blob: null, apercu: null, rows: [], remarque: '', notes: [], slot: slot || E.creneauParHeure(new Date()), ctl: null };
    let close;
    const fileBtn = (label, capture, cls) => {
      const inp = h('input', { type: 'file', accept: 'image/*', capture: capture ? 'environment' : null, class: 'sr', id: 'scan-' + (capture ? 'cam' : 'lib') });
      inp.addEventListener('change', async () => { const f = inp.files && inp.files[0]; if (!f) return; try { const r = await AI.preparer(f); st.blob = r.blob; st.apercu = r.apercu; etapeApercu(); } catch (e) { U.toast('Photo illisible, essaie une autre.'); } });
      return h('label', { class: 'btn ' + (cls || ''), for: inp.id, role: 'button', tabindex: '0', onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } } }, icon('camera'), label, inp);
    };
    const etapeChoix = () => { body.textContent = ''; U.add(body, h('p', { class: 'muted sub' }, 'Photographie ton assiette de haut, en entier, avec une bonne lumière. L’IA estime les aliments et les quantités ; tu corriges avant d’enregistrer.'), fileBtn('Prendre une photo', true), fileBtn('Choisir dans la galerie', false, 'secondary')); };
    const etapeApercu = () => { body.textContent = ''; U.add(body, h('img', { src: st.apercu, alt: 'Photo du repas', class: 'scan-img' }), U.sparkle('Découvrir mon analyse', () => { if (window.CapSon) window.CapSon.jouer('ouverture'); analyser(); }).el, h('button', { class: 'btn secondary', type: 'button', onclick: etapeChoix }, 'Changer de photo'), h('p', { class: 'foot muted' }, 'La photo est envoyée à Claude, sur ton compte, uniquement pour cette analyse.')); };
    async function analyser() {
      st.ctl = new AbortController();
      const t0 = Date.now(); const tick = h('span', null, '0 s');
      body.textContent = '';
      U.add(body, h('img', { src: st.apercu, alt: '', class: 'scan-img', style: 'opacity:.6' }), h('div', { class: 'note', role: 'status' }, h('b', null, 'Analyse en cours… '), tick, h('br'), 'Compte 10 à 60 secondes.'), h('button', { class: 'btn secondary', type: 'button', onclick: () => st.ctl.abort() }, 'Arrêter'));
      const iv = setInterval(() => { tick.textContent = Math.round((Date.now() - t0) / 1000) + ' s'; }, 1000);
      try {
        const r = await AI.analyserRepas(st.blob, st.ctl.signal);
        st.remarque = r.remarque; st.notes = r.notes;
        st.rows = r.aliments.map(a => { const b = F.parNom(a.nom); const garder = b && ['Plats', 'Sucré', 'Boissons', 'Laitiers', 'Fruits'].indexOf(b.cat) < 0 && b.id !== 'frites'; return { nom: b ? b.n : a.nom, grammes: a.grammes, cuisson: b ? (garder ? a.cuisson : 'aucune') : a.cuisson, confiance: a.confiance, par100: b || a.par100, base: !!b, coherent: b ? true : a.coherent }; });
        etapeResultat();
      } catch (e) {
        body.textContent = '';
        U.add(body, h('div', { class: 'note' }, AI.erreur(e)), h('button', { class: 'btn', type: 'button', onclick: analyser }, 'Réessayer'), h('button', { class: 'btn secondary', type: 'button', onclick: () => { close(); ajouterAliment(st.slot); } }, 'Ajouter à la main'));
      } finally { clearInterval(iv); }
    }
    function etapeResultat() {
      body.textContent = '';
      const tot = h('div', { class: 'panel' });
      const list = h('div', { style: 'display:flex;flex-direction:column;gap:10px' });
      const save = h('button', { class: 'btn', type: 'button' }, 'Enregistrer le repas');
      const recalc = () => {
        const es = st.rows.map(r => E.entreeDepuisAliment(r.par100, r.grammes, r.cuisson));
        const t = E.totaux(es);
        tot.textContent = '';
        U.add(tot, h('div', { class: 'hero' }, h('div', null, h('b', { class: 'num' }, fr(t.k)), h('span', null, ' kcal estimées')), h('span', { class: 'chip warn' }, 'Estimation')), h('p', { class: 'sub' }, 'P ' + fr(t.p, 1) + ' g · G ' + fr(t.c, 1) + ' g · L ' + fr(t.f, 1) + ' g'),
          h('p', { class: 'foot muted' }, 'Une photo ne permet pas de peser : les quantités peuvent varier de ±20 % ou plus (sauces, huile, aliments cachés). Corrige les grammes si tu les connais.'));
        save.disabled = !st.rows.length || st.rows.some(r => !(r.grammes > 0 && r.grammes <= 3000));
      };
      const draw = () => {
        list.textContent = '';
        if (!st.rows.length) U.add(list, h('p', { class: 'muted sub' }, 'Aucun aliment reconnu. Ajoute-les toi-même.'));
        st.rows.forEach((r, i) => {
          const e = E.entreeDepuisAliment(r.par100, r.grammes, r.cuisson);
          const kc = h('span', { class: 'num', style: 'font-weight:600' }, fr(e.k) + ' kcal');
          const g = numInput('sg-' + i, r.grammes, '', v => { r.grammes = v; const e2 = E.entreeDepuisAliment(r.par100, v || 0, r.cuisson); kc.textContent = fr(e2.k) + ' kcal'; recalc(); }, 'numeric');
          U.add(list, h('div', { class: 'panel', style: 'gap:10px' },
            h('div', { style: 'display:flex;justify-content:space-between;gap:8px;align-items:flex-start' }, h('div', { style: 'min-width:0' }, h('b', null, r.nom), h('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;margin-top:4px' }, h('span', { class: 'chip ' + (r.base ? 'good' : 'warn') }, r.base ? 'Valeurs de la base' : 'Valeurs estimées par l’IA'), h('span', { class: 'chip ' + (r.confiance === 'haute' ? 'neutral' : 'warn') }, 'Confiance ' + r.confiance), !r.coherent ? h('span', { class: 'chip bad' }, 'Valeurs à vérifier') : null)), kc),
            h('div', { class: 'grid2', style: 'align-items:end' }, h('label', { class: 'field', for: 'sg-' + i }, 'Grammes', g), h('div', { class: 'field' }, 'Cuisson', seg(Object.keys(E.CUISSON).map(k => [k, ({ aucune: 'Sans', poele: 'Poêlé', frit: 'Frit' })[k]]), r.cuisson, v => { r.cuisson = v; draw(); recalc(); }, 'Cuisson'))),
            h('div', { style: 'display:flex;gap:16px' }, h('button', { class: 'link', type: 'button', onclick: () => ajouterAliment(null, (en, al) => { r.nom = al.n; r.par100 = al.src === 'recette' ? { n: al.n, k: al.k, p: al.p, c: al.c, f: al.f } : al; r.base = al.src !== 'recette'; r.coherent = true; draw(); recalc(); }) }, 'Remplacer'), h('button', { class: 'link', type: 'button', style: 'color:var(--bad)', onclick: () => { st.rows.splice(i, 1); draw(); recalc(); } }, 'Supprimer'))));
        });
      };
      save.addEventListener('click', async () => {
        const j = journal(jour);
        st.rows.forEach(r => { const e = E.entreeDepuisAliment(r.par100, r.grammes, r.cuisson); j.items.push(Object.assign(e, { id: U.uid(), slot: st.slot, src: 'scan', conf: r.confiance, ts: new Date().toISOString() })); });
        try { await saveJournal(jour, j); close(); U.toast('Repas enregistré'); if (window.CapSon) window.CapSon.jouer('valider'); } catch (e) { U.toast('Échec, réessaie'); }
      });
      U.add(body, h('img', { src: st.apercu, alt: 'Photo analysée', class: 'scan-img', style: 'max-height:160px' }),
        st.remarque ? h('div', { class: 'note' }, h('b', null, 'Remarque de l’IA : '), st.remarque) : null,
        st.notes.length ? h('p', { class: 'foot', style: 'color:var(--warn)' }, st.notes.join(' ')) : null,
        list, h('button', { class: 'btn tinted small', type: 'button', onclick: () => ajouterAliment(null, (en, al, q, cu) => { st.rows.push({ nom: al.n, grammes: al.src === 'recette' ? null : q, cuisson: cu || 'aucune', confiance: 'haute', par100: al, base: true, coherent: true }); if (al.src === 'recette') { st.rows.pop(); U.toast('Ajoute une recette depuis le journal'); } draw(); recalc(); }) }, icon('plus'), 'Ajouter un ingrédient'),
        tot, h('div', { class: 'field' }, 'Repas', slotSeg(st.slot, v => { st.slot = v; })), save);
      draw(); recalc();
    }
    close = U.sheet('Scanner un repas', body, { focus: false, onClose: () => { if (st.ctl) st.ctl.abort(); } });
    etapeChoix();
  }

  // ================================================================ Activités
  function ajouterActivite(d) {
    const st = { type: null, min: 30, hors: true };
    const prog = d.prog && d.prog.ok ? d.prog : null;
    const jsem = new Date(jour + 'T12:00').getDay();
    const defHors = type => !((type === 'muscu' && prog && prog.planning.some(p => p.jour === jsem)) || (type === 'foot' && (d.p.autreSport || 0) > 0));
    const kgv = poidsActuel();
    const res = h('div', { class: 'note' });
    const draw = () => { res.textContent = ''; if (!st.type) { U.add(res, 'Choisis une activité.'); return; } const k = E.kcalActivite(st.type, st.min, kgv); U.add(res, h('b', null, '≈ ' + k + ' kcal'), ' dépensées en plus du repos (MET ' + String(E.ACTIVITES[st.type][1]).replace('.', ',') + ' − 1) × ' + fr(kgv, 1) + ' kg × ' + st.min + ' min. Estimation à ±20 %.'); save.disabled = false; };
    const sw = h('div');
    const drawSw = () => { sw.textContent = ''; U.add(sw, h('div', { class: 'panel flush' }, interrupteur('En plus de mon programme', 'Ton objectif inclut déjà tes séances prévues' + ((d.p.autreSport || 0) > 0 ? ' et ton autre sport' : '') + '. Coche seulement si c’est en plus.', st.hors, v => { st.hors = v; drawSw(); }))); };
    const ctx = { A: st, onChange: [], changed() { draw(); } };
    const types = U.choices(ctx, 'type', Object.keys(E.ACTIVITES).map(k => ({ v: k, t: E.ACTIVITES[k][0] })), { grid: true, onPick: v => { st.hors = defHors(v); drawSw(); } });
    const r = U.Ruler({ min: 5, max: 300, step: 5, unit: 'min', label: 'Durée', value: 30, start: 30, px: 10, onChange: v => { st.min = v; draw(); } });
    let close;
    const save = h('button', { class: 'btn', type: 'button', disabled: true, onclick: async () => {
      const j = journal(jour); j.activites.push({ id: U.uid(), type: st.type, n: E.ACTIVITES[st.type][0], min: st.min, kcal: E.kcalActivite(st.type, st.min, kgv), hors: st.hors });
      try { await saveJournal(jour, j); close(); U.toast('Activité enregistrée'); } catch (e) { U.toast('Échec, réessaie'); }
    } }, 'Enregistrer');
    close = U.sheet('Activité', [types, r.el, sw, res, save, h('p', { class: 'foot muted' }, S().prefs.bonusActivite ? 'Option active : 50 % des activités « en plus » s’ajoutent à ton objectif du jour.' : 'Les calories d’activité ne s’ajoutent pas à ton objectif (option dans Réglages › Nutrition).')], { focus: false });
    drawSw(); draw(); save.disabled = !st.type;
  }
  function listeActivites(d) {
    const j = journal(jour);
    let close;
    close = U.sheet('Activités du jour', [h('div', { class: 'panel flush' }, j.activites.map(a => h('div', { class: 'cell' }, h('span', { class: 'lbl' }, a.n, h('small', null, a.min + ' min · ≈ ' + a.kcal + ' kcal' + (a.hors === false ? ' · déjà dans ton programme' : ''))),
      h('button', { class: 'round press', type: 'button', style: 'width:32px;height:32px;background:var(--fill)', 'aria-label': 'Supprimer ' + a.n, onclick: async () => { const jj = journal(jour); jj.activites = jj.activites.filter(x => x.id !== a.id); try { await saveJournal(jour, jj); close(); U.toast('Supprimé'); } catch (e) { U.toast('Échec, réessaie'); } } }, icon('trash'))))),
      h('button', { class: 'btn tinted', type: 'button', onclick: () => { close(); ajouterActivite(d); } }, icon('plus'), 'Ajouter une activité')]);
  }

  // ================================================================ Calendrier
  function calendrier() {
    let m = new Date(jour + 'T12:00'); m.setDate(1);
    const box = h('div');
    let close;
    const draw = () => {
      box.textContent = '';
      const y = m.getFullYear(), mo = m.getMonth(), t = today();
      const first = (new Date(y, mo, 1).getDay() + 6) % 7, n = new Date(y, mo + 1, 0).getDate();
      const cells = [];
      for (let i = 0; i < first; i++) cells.push(h('span'));
      for (let dd = 1; dd <= n; dd++) {
        const id = y + '-' + String(mo + 1).padStart(2, '0') + '-' + String(dd).padStart(2, '0');
        const j = S().journaux[id], has = j && (j.items || []).length;
        cells.push(h('button', { class: 'calday' + (id === jour ? ' on' : '') + (has ? ' has' : ''), type: 'button', disabled: id > t, 'aria-label': longDate(id) + (has ? ', données' : ''), onclick: () => { jour = id; close(); U.refresh(); } }, String(dd), h('i')));
      }
      const nextOk = new Date(y, mo + 1, 1) <= new Date();
      U.add(box, h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px' }, h('button', { class: 'round press', type: 'button', style: 'background:var(--fill)', 'aria-label': 'Mois précédent', onclick: () => { m = new Date(y, mo - 1, 1); draw(); } }, icon('back')), h('b', null, m.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })), h('button', { class: 'round press', type: 'button', style: 'background:var(--fill)', disabled: !nextOk, 'aria-label': 'Mois suivant', onclick: () => { m = new Date(y, mo + 1, 1); draw(); } }, icon('chev'))),
        h('div', { class: 'calgrid' }, ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => h('small', null, x)), cells),
        h('p', { class: 'foot muted', style: 'margin-top:8px' }, 'Point : au moins un aliment noté ce jour-là.'));
    };
    close = U.sheet('Historique', box, { focus: false });
    draw();
  }

  // ================================================================ Progrès
  J.viewProgres = d => {
    const p = d.p, ph = d.phys, out = [];
    out.push(U.largeTitle('Progrès', null, h('button', { class: 'btn small', type: 'button', onclick: () => U.addPesee() }, icon('plus'), 'Pesée')));
    if (!ph || !ph.ok) { out.push(h('div', { class: 'note' }, ph ? ph.message : 'Données manquantes.')); return out; }
    const tr = E.tendance(S().pesees), last = tr.dernier;
    // Trois niveaux
    const action = !last || (new Date(today()) - new Date(last.date)) / 864e5 >= 7 ? 'Pèse-toi lundi matin, à jeun.' : (E.bilanSemaine(S().journaux, null, [], today()).renseignes < 4 ? 'Note tes repas au moins 4 jours cette semaine.' : 'Garde ton rythme : séances prévues et repas notés.');
    out.push(h('div', { class: 'panel flush tiers' },
      h('div', { class: 'tier' }, h('span', { class: 'dot', style: 'background:var(--ink)' }, icon('star')), h('div', null, h('h3', null, 'L’objectif'), h('p', null, p.objectif === 'maintenir' ? 'Maintenir ton poids en améliorant ta forme.' : (ph.planPossible ? U.wfmt(ph.cible) + (ph.semaines ? ' · ≈ ' + ph.semaines + ' semaines (estimation)' : '') : 'Objectif à revoir avec un médecin.')))),
      ph.intermediaire ? h('div', { class: 'tier' }, h('span', { class: 'dot', style: 'background:var(--body)' }, icon('target')), h('div', null, h('h3', null, 'L’étape en cours'), h('p', null, ph.intermediaire.texte.replace(/[\d,]+ kg/, U.wfmt(ph.intermediaire.poids))))) : null,
      h('div', { class: 'tier' }, h('span', { class: 'dot', style: 'background:var(--accent)' }, icon('bolt')), h('div', null, h('h3', null, 'Prochaine action'), h('p', null, action)))));
    out.push(h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', null, last ? U.wfmt(last.poids) : '—'), h('span', null, last ? 'Mesuré le ' + U.fmtD(last.date) : 'Aucune pesée')),
      h('div', { class: 'stat' }, h('b', null, tr.rythme === null ? '—' : (tr.rythme > 0 ? '+' : '') + fr(U.unite() === 'lb' ? tr.rythme * U.LB : tr.rythme, 2)), h('span', null, tr.rythme === null ? 'Tendance : 2 pesées à 1 semaine d’écart' : U.unite() + '/sem, mesuré')),
      h('div', { class: 'stat' }, h('b', null, fr(ph.imc, 1)), h('span', null, 'IMC'))));
    if (tr.rythme !== null && ph.planPossible && p.objectif !== 'maintenir') {
      const r = tr.rythme, target = ph.rythmeEffectif; let txt, cls;
      if (p.objectif === 'perdre') { if (r < -ph.max - 0.1) { txt = 'Plus rapide que le maximum prudent : ajoute environ 200 kcal par jour.'; cls = 'bad'; } else if (r <= target * 0.5) { txt = 'Tu suis ton rythme.'; cls = 'good'; } else { txt = 'Plus lent que prévu. Si ça dure 3 semaines, retire environ 150 kcal par jour.'; cls = 'warn'; } }
      else { if (r > ph.max + 0.1) { txt = 'Prise plus rapide que prévu : retire environ 150 kcal par jour.'; cls = 'warn'; } else if (r >= target * 0.5) { txt = 'Tu suis ton rythme.'; cls = 'good'; } else { txt = 'Prise plus lente que prévu : ajoute environ 150 kcal par jour.'; cls = 'warn'; } }
      out.push(h('div', null, h('span', { class: 'chip ' + cls }, txt)));
    }
    const range = seg([[30, '1 mois'], [90, '3 mois'], [3650, 'Tout']], plageProgres, v => { plageProgres = v; U.refresh(); }, 'Période');
    out.push(U.section('Poids', 'Trait plein : tes pesées. Pointillés : projection du plan, jamais un résultat.', range, h('div', { class: 'panel chart' }, courbePoids(d), h('div', { class: 'legend' }, h('span', null, h('i', { style: 'border-color:var(--ink)' }), 'Mesuré'), ph.planPossible && p.objectif !== 'maintenir' ? h('span', null, h('i', { class: 'dash', style: 'border-color:var(--body)' }), 'Projection') : null))));
    // Calories des 7 derniers jours
    const cj = E.cibleJour(ph, p.objectifsPerso);
    const bs = E.bilanSemaine(S().journaux, cj.kcal, S().pesees, today());
    out.push(U.section('Calories, 7 derniers jours', 'Barres : jours notés. Pointillés gris : jour sans données, rien n’est estimé.', h('div', { class: 'panel chart' }, barres(bs, cj.kcal), h('p', { class: 'sub' }, bs.message))));
    // Série et jalons
    const joursData = Object.keys(S().journaux).filter(k => (S().journaux[k].items || []).length);
    const serie = E.serie(joursData, today());
    const jl = E.jalons(S().pesees, p.poids, ph.cible, serie);
    out.push(U.section('Jalons', null, h('div', { class: 'panel flush' }, U.cellKV('Série actuelle', serie + ' jour' + (serie > 1 ? 's' : '')), jl.length ? jl.map(x => U.cellKV(x.t, x.date ? U.fmtD(x.date) : '✓')) : h('div', { class: 'cell muted' }, 'Tes premiers jalons apparaîtront avec tes pesées.'))));
    // Mesures
    const tours = S().pesees.filter(r => r.tour).sort((a, b) => b.date.localeCompare(a.date));
    if (tours.length) out.push(U.section('Tour de taille', null, h('div', { class: 'panel flush' }, tours.slice(0, 8).map(r => U.cellKV(U.fmtD(r.date), fr(r.tour, 1) + ' cm')))));
    // Situation
    out.push(U.section('Ton plan', null, h('div', { class: 'panel flush' }, U.cellKV('Dépense estimée', fr(ph.tdee) + ' kcal/j'), U.cellKV('Objectif calorique', fr(cj.kcal) + ' kcal/j' + (cj.perso ? ' (perso)' : '')), U.cellKV('Protéines · glucides · lipides', cj.macros.prot + ' · ' + cj.macros.glu + ' · ' + cj.macros.lip + ' g')), h('p', { class: 'foot muted', style: 'margin:0 4px' }, ph.imcNote), h('div', { style: 'margin:0 4px' }, U.howBtn('Objectif calorique', ph.calcul))));
    if (ph.etapes.length && ph.planPossible) out.push(U.section('Étapes prévues', 'Estimations au rythme du plan, recalculées avec tes vraies pesées.', h('div', { class: 'panel flush' }, ph.etapes.slice(0, 6).map(e => U.cellKV('Semaine ' + e.semaine, '≈ ' + U.wfmt(e.poids))))));
    out.push(photos());
    const rows = S().pesees.slice().sort((a, b) => b.date.localeCompare(a.date));
    out.push(U.section('Pesées', null, rows.length ? h('div', { class: 'panel flush' }, rows.map(r => h('div', { class: 'cell' }, h('span', { class: 'lbl' }, U.fmtD(r.date), r.tour ? h('small', null, 'Tour de taille ' + fr(r.tour, 1) + ' cm') : null), h('span', { class: 'val num', style: 'color:var(--ink)' }, U.wfmt(r.poids)), h('button', { class: 'round press', type: 'button', style: 'width:32px;height:32px;background:var(--fill)', 'aria-label': 'Supprimer la pesée du ' + U.fmtD(r.date), onclick: () => U.confirmDel(() => U.remove('pesees', r.id)) }, icon('trash'))))) : h('p', { class: 'foot muted', style: 'margin:0 4px' }, 'Aucune pesée enregistrée.')));
    return out;
  };
  function courbePoids(d) {
    const ph = d.phys, p = d.p, lb = U.unite() === 'lb', k = lb ? U.LB : 1;
    const all = S().pesees.filter(r => typeof r.poids === 'number').slice().sort((a, b) => a.date.localeCompare(b.date));
    if (!all.length) return h('p', { class: 'foot muted' }, 'Ta courbe apparaîtra après ta première pesée.');
    const from = U.dayId(new Date(Date.now() - plageProgres * 864e5));
    const rows = all.filter(r => r.date >= from); if (!rows.length) return h('p', { class: 'foot muted' }, 'Aucune pesée sur cette période.');
    const first = all[0];
    const W = 340, H = 190, pl = 36, pr = 10, pt = 12, pb = 24;
    const t0 = new Date(rows[0].date + 'T12:00').getTime();
    const proj = ph.planPossible && p.objectif !== 'maintenir' && ph.semaines;
    const tProjEnd = new Date(first.date + 'T12:00').getTime() + (proj ? Math.min(ph.semaines, 52) : 0) * 7 * 864e5;
    const tEnd = Math.max(new Date(rows[rows.length - 1].date + 'T12:00').getTime(), Math.min(tProjEnd, t0 + plageProgres * 864e5), t0 + 14 * 864e5);
    const projAt = t => first.poids + ph.rythmeEffectif * Math.min(ph.semaines, 52, Math.max(0, (t - new Date(first.date + 'T12:00').getTime()) / (7 * 864e5)));
    const vals = rows.map(r => r.poids).concat(proj ? [projAt(t0), projAt(tEnd)] : []).map(v => v * k);
    const lo = Math.floor(Math.min.apply(null, vals) - 1), hi = Math.ceil(Math.max.apply(null, vals) + 1);
    const x = t => pl + (t - t0) / (tEnd - t0 || 1) * (W - pl - pr), y = v => pt + (hi - v * k) / (hi - lo) * (H - pt - pb);
    const stepV = Math.max(1, Math.ceil((hi - lo) / 5));
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Poids mesuré et projection">';
    for (let v = lo; v <= hi; v += stepV) s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(v / k) + '" y2="' + y(v / k) + '" stroke="var(--line)"/><text x="' + (pl - 6) + '" y="' + (y(v / k) + 3.5) + '" text-anchor="end">' + v + '</text>';
    if (proj) s += '<line x1="' + x(t0) + '" y1="' + y(projAt(t0)) + '" x2="' + x(tEnd) + '" y2="' + y(projAt(tEnd)) + '" stroke="var(--body)" stroke-width="2" stroke-dasharray="5 5" opacity=".8"/>';
    const pts = rows.map(r => [x(new Date(r.date + 'T12:00').getTime()), y(r.poids)]);
    if (pts.length > 1) s += '<polyline points="' + pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ') + '" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
    pts.forEach((q, i) => { s += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + (i === pts.length - 1 ? 4.5 : 3) + '" fill="var(--ink)" stroke="var(--surface)" stroke-width="1.5"/>'; });
    s += '<text x="' + pl + '" y="' + (H - 6) + '">' + U.fmtD(rows[0].date) + '</text><text x="' + (W - pr) + '" y="' + (H - 6) + '" text-anchor="end">' + U.fmtD(U.dayId(new Date(tEnd))) + '</text></svg>';
    return h('div', { html: s });
  }
  function barres(bs, cible) {
    const W = 340, H = 170, pl = 8, pr = 8, pt = 16, pb = 26;
    const max = Math.max(cible * 1.2, ...bs.jours.map(j => j.kcal || 0));
    const bw = (W - pl - pr) / 7;
    const y = v => pt + (1 - v / max) * (H - pt - pb);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Calories des 7 derniers jours">';
    s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(cible) + '" y2="' + y(cible) + '" stroke="var(--ink)" stroke-dasharray="3 4" opacity=".5"/><text x="' + (W - pr) + '" y="' + (y(cible) - 4) + '" text-anchor="end">objectif ' + fr(cible) + '</text>';
    bs.jours.forEach((j, i) => {
      const cx = pl + bw * i + bw / 2, w = bw * 0.56;
      if (j.renseigne) s += '<rect x="' + (cx - w / 2) + '" y="' + y(j.kcal) + '" width="' + w + '" height="' + (H - pb - y(j.kcal)) + '" rx="6" fill="' + (j.kcal > cible * 1.05 ? 'var(--bad)' : 'var(--body)') + '"/>';
      else s += '<rect x="' + (cx - w / 2) + '" y="' + (H - pb - 34) + '" width="' + w + '" height="34" rx="6" fill="none" stroke="var(--faint)" stroke-dasharray="3 3"/><text x="' + cx + '" y="' + (H - pb - 13) + '" text-anchor="middle">—</text>';
      s += '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + new Date(j.date + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3) + '</text>';
    });
    return h('div', { html: s + '</svg>' });
  }
  function photos() {
    const ph = S().photos.slice().sort((a, b) => b.date.localeCompare(a.date));
    if (!assets) return U.section('Photos de progression', null, h('p', { class: 'foot muted', style: 'margin:0 4px' }, 'Disponible quand Cap est ouvert dans l’appli Claude, connecté.'));
    const inp = h('input', { type: 'file', accept: 'image/*', class: 'sr', id: 'ph-up' });
    inp.addEventListener('change', async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      try {
        U.toast('Envoi de la photo…');
        const r = await AI.preparer(f).catch(() => ({ blob: f }));
        const res = await assets.upload(r.blob);
        await U.put('photos', U.uid(), { date: today(), assetId: res.id, url: res.url });
        U.toast('Photo ajoutée');
      } catch (e) { U.toast('Échec de l’envoi de la photo.'); }
    });
    return U.section('Photos de progression', 'Privées : visibles seulement par toi.', h('label', { class: 'btn small tinted', for: 'ph-up', role: 'button', tabindex: '0', style: 'align-self:flex-start;margin:0 4px' }, icon('camera'), 'Ajouter une photo', inp),
      ph.length ? h('div', { class: 'photos' }, ph.map(x => h('figure', null, h('img', { src: x.url || ('/_blob/' + x.assetId), alt: 'Photo du ' + U.fmtD(x.date), loading: 'lazy' }), h('figcaption', null, U.fmtD(x.date), h('button', { class: 'link', type: 'button', style: 'color:var(--bad);padding:0', onclick: () => U.confirmDel(async () => { await J.supprimerAsset(x.assetId); await U.remove('photos', x.id); }) }, 'Supprimer'))))) : null);
  }
  J.supprimerAsset = async id => { if (assets && id) { try { await assets.delete(id); } catch (e) { /* déjà supprimé */ } } };

  // ================================================================ Réglages nutrition
  J.reglagesNutrition = d => {
    const p = d.p, prefs = S().prefs, ph = d.phys;
    const row = (t, val, fn) => h('button', { class: 'cell', type: 'button', onclick: fn }, h('span', { class: 'lbl' }, t), h('span', { class: 'val' }, val), icon('chev', 'chev'));
    const cj = ph && ph.ok ? E.cibleJour(ph, p.objectifsPerso) : null;
    return [h('section', { class: 'sec' }, h('div', { class: 'cap' }, 'Nutrition'), h('div', { class: 'panel flush' },
      cj ? row('Objectifs quotidiens', fr(cj.kcal) + ' kcal' + (cj.perso ? ' · perso' : ''), () => U.editerObjectifs(p, ph, null, v => U.saveProfil({ objectifsPerso: v }))) : null,
      row('Alimentation', (F.REGIMES[p.regime || 'omnivore'] || F.REGIMES.omnivore)[0], () => U.editStep('regime')),
      interrupteur('Mode simple', 'Accueil : calories et protéines seulement', !!p.modeSimple, v => U.saveProfil({ modeSimple: v })),
      interrupteur('Poids en livres (lb)', 'Les données restent enregistrées en kg', p.unites === 'lb', v => U.saveProfil({ unites: v ? 'lb' : 'kg' })),
      interrupteur('Ajouter les calories d’activité', 'Seulement les activités en plus de ton programme, et 50 % de l’estimation, car elle peut être surestimée', !!prefs.bonusActivite, v => U.savePrefs({ bonusActivite: v })),
      interrupteur('Reporter les calories non mangées', 'Jusqu’à 200 kcal de la veille, seulement si la veille est notée', !!prefs.report, v => U.savePrefs({ report: v })),
      U.cellKV('Objectif d’eau', fr(E.objectifEau(poidsActuel())) + ' ml (30 ml par kg)'),
      row('Mes aliments et recettes', (S().perso.length + S().recettes.length) + '', () => mesAliments()))),
    h('section', { class: 'sec' }, h('div', { class: 'cap' }, 'Coach'), h('div', { class: 'panel flush' },
      interrupteur('Partager mes données corps', 'Poids, objectifs, repas notés', !!prefs.coachCorps, v => U.savePrefs({ coachCorps: v })),
      d.argent ? interrupteur('Partager mes données argent', 'Budget, épargne, projet', !!prefs.coachArgent, v => U.savePrefs({ coachArgent: v })) : null),
      h('p', { class: 'foot muted', style: 'margin:0 16px' }, 'Le coach ne voit que ce que tu partages ici, et seulement quand tu lui poses une question.'))];
  };
  function mesAliments() {
    let close;
    const body = () => [
      S().perso.length ? h('div', { class: 'sec' }, h('div', { class: 'cap' }, 'Mes aliments'), h('div', { class: 'panel flush' }, S().perso.map(a => h('div', { class: 'cell' }, h('button', { class: 'lbl', type: 'button', style: 'background:none;border:0;text-align:left;padding:0', onclick: () => { close(); creerAliment(a); } }, a.n, h('small', null, fr(a.k) + ' kcal / 100 g')), h('button', { class: 'round press', type: 'button', style: 'width:32px;height:32px;background:var(--fill)', 'aria-label': 'Supprimer ' + a.n, onclick: () => { close(); U.confirmDel(() => U.remove('aliments', a.id)); } }, icon('trash')))))) : null,
      S().recettes.length ? h('div', { class: 'sec' }, h('div', { class: 'cap' }, 'Mes recettes'), h('div', { class: 'panel flush' }, S().recettes.map(r => h('div', { class: 'cell' }, h('button', { class: 'lbl', type: 'button', style: 'background:none;border:0;text-align:left;padding:0', onclick: () => { close(); creerRecette(r); } }, r.n, h('small', null, fr(r.k) + ' kcal / portion · ' + r.portions + ' portions')), h('button', { class: 'round press', type: 'button', style: 'width:32px;height:32px;background:var(--fill)', 'aria-label': 'Supprimer ' + r.n, onclick: () => { close(); U.confirmDel(() => U.remove('recettes', r.id)); } }, icon('trash')))))) : null,
      !S().perso.length && !S().recettes.length ? h('p', { class: 'muted sub' }, 'Aucun aliment ni recette créés.') : null,
      h('div', { class: 'row-btns' }, h('button', { class: 'btn small secondary', type: 'button', onclick: () => { close(); creerAliment(); } }, 'Créer un aliment'), h('button', { class: 'btn small secondary', type: 'button', onclick: () => { close(); creerRecette(); } }, 'Créer une recette'))];
    close = U.sheet('Mes aliments et recettes', body(), { focus: false });
  }

  // ================================================================ Coach IA
  J.coach = d => {
    if (!AI.texteDispo()) { U.sheet('Coach', [h('div', { class: 'note' }, 'Le coach utilise Claude. Il fonctionne quand Cap est ouvert dans l’appli Claude, connecté.')]); return; }
    const prefs = S().prefs;
    const msgs = h('div', { class: 'chat', 'aria-live': 'polite' });
    const q = h('textarea', { id: 'coach-q', rows: '2', placeholder: 'Ex. D’où vient mon objectif de calories ?' });
    const err = h('div', { class: 'err', role: 'alert' });
    let ctl = null;
    const bubble = (role, text) => { const b = h('div', { class: 'bubble ' + role }, text); msgs.appendChild(b); return b; };
    coachHist.forEach(m => bubble(m.role === 'user' ? 'me' : 'ai', m.content));
    const send = h('button', { class: 'btn', type: 'button' }, 'Envoyer');
    const stop = h('button', { class: 'btn secondary', type: 'button', hidden: true, onclick: () => ctl && ctl.abort() }, 'Arrêter');
    send.addEventListener('click', async () => {
      const question = q.value.trim(); if (!question) return;
      q.value = ''; err.textContent = '';
      bubble('me', question);
      const out = bubble('ai', 'Réflexion…');
      ctl = new AbortController(); send.disabled = true; stop.hidden = false;
      try {
        const r = await AI.coach(question, coachHist.slice(-8), contexteCoach(d), { signal: ctl.signal, onText: ({ text }) => { out.textContent = text; } });
        out.textContent = r.text;
        coachHist.push({ role: 'user', content: question }, { role: 'assistant', content: r.text });
      } catch (e) { out.textContent = e.text || ''; if (!e.text) out.remove(); err.textContent = AI.erreur(e); }
      finally { send.disabled = false; stop.hidden = true; }
    });
    const partage = [];
    if (d.corps) partage.push(interrupteur('Partager mes données corps', null, !!prefs.coachCorps, v => { U.savePrefs({ coachCorps: v }); refreshConsent(); }));
    if (d.argent) partage.push(interrupteur('Partager mes données argent', null, !!prefs.coachArgent, v => { U.savePrefs({ coachArgent: v }); refreshConsent(); }));
    const consent = h('div', { class: 'panel flush' }, partage);
    function refreshConsent() { consent.textContent = ''; const p2 = S().prefs; if (d.corps) consent.appendChild(interrupteur('Partager mes données corps', null, !!p2.coachCorps, v => { U.savePrefs({ coachCorps: v }).then(refreshConsent); })); if (d.argent) consent.appendChild(interrupteur('Partager mes données argent', null, !!p2.coachArgent, v => { U.savePrefs({ coachArgent: v }).then(refreshConsent); })); }
    refreshConsent();
    U.sheet('Coach', [h('p', { class: 'foot muted' }, 'Le coach explique tes chiffres ; il ne les calcule pas. Il n’est ni médecin ni conseiller financier.'), consent, msgs, h('label', { class: 'field', for: 'coach-q' }, 'Ta question', q), err, send, stop], { focus: false });
  };
  function contexteCoach(d) {
    const prefs = S().prefs, p = d.p;
    const c = { date: today(), age: p.age, modules: p.domaines };
    if (d.corps && prefs.coachCorps && d.phys && d.phys.ok) {
      const cj = E.cibleJour(d.phys, p.objectifsPerso), b = budget(d, today());
      const tr = E.tendance(S().pesees);
      c.corps = { objectif: p.objectif, poids_depart_kg: p.poids, poids_actuel_kg: tr.dernier ? tr.dernier.poids : null, poids_cible_kg: d.phys.cible, tendance_mesuree_kg_par_semaine: tr.rythme, depense_estimee_kcal: d.phys.tdee, objectif_kcal: cj.kcal, objectif_personnalise: cj.perso, macros_g: cj.macros, rythme_plan_kg_sem: d.phys.rythme, semaines_estimees: d.phys.semaines, statut_faisabilite: d.phys.statut, aujourd_hui: b ? { mange_kcal: b.mange, restant_kcal: b.restant, proteines_g: b.totaux.p } : null, bilan_7_jours: E.bilanSemaine(S().journaux, cj.kcal, S().pesees, today()).message, seances_par_semaine: d.prog && d.prog.ok ? d.prog.seances.length : 0, regles_mineur: d.phys.mineur, methode: d.phys.calcul };
    }
    if (d.argent && prefs.coachArgent && d.fin && d.fin.ok) {
      const f = d.fin;
      c.argent = { revenus_nets_mois: p.revenus, depenses_mois: f.depenses, capacite_epargne_mois: f.capacite, epargne_actuelle: f.actuelle, projet: f.reve.label, cout_projet: Math.round(f.reve.total), echeance: p.reveAnnee, mensualite_requise: Math.round(f.requisMensuel), mois_au_rythme_actuel: f.moisAuRythme ? Math.ceil(f.moisAuRythme) : null, faisabilite: f.faisabilite, etape: f.niveaux.intermediaire.titre, action: f.niveaux.action.texte, revenu_vise_hypothese: f.hypothese ? f.hypothese.revenu : null, methode: f.calcul };
    }
    if (!c.corps && !c.argent) c.note = 'L’utilisateur n’a partagé aucune donnée chiffrée.';
    return c;
  }

  window.CapJournal = J;
})();
