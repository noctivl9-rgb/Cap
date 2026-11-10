/* Cap — interface. Tous les chiffres viennent de CapEngine (engine.js). */
(function () {
  'use strict';
  if (!document.documentElement.lang) document.documentElement.lang = 'fr';
  const E = window.CapEngine;
  const $app = document.getElementById('app');

  // ================================================================ Utilitaires
  function h(tag, attrs) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v === false || v === null || v === undefined) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (let i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, ...cs) { cs.forEach(c => { if (c === null || c === undefined || c === false) return; if (Array.isArray(c)) c.forEach(x => add(el, x)); else el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c))); }); }
  const PATHS = {
    back: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>', check: '<path d="M5 12.5l4.5 4.5L19 7"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
    today: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>', body: '<circle cx="12" cy="5" r="2"/><path d="M6 9h12M12 9v5M9 21l3-7 3 7"/>',
    dumbbell: '<path d="M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12"/>', wallet: '<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V7z"/><path d="M4 7l11-3v3M16 13.5h.01"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    scale: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 9.5a4 4 0 0 1 6 0M12 9.5l1.5-1.5"/>', flame: '<path d="M12 21c4 0 6-2.7 6-6 0-4-3-6-4-9-1 2-2 3-3.5 3.5C9 8 9 6.5 9.5 5 7 7 6 10 6 15c0 3.3 2 6 6 6z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>', target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', home: '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z"/>', walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6 3 3v3M9 12l2-4 4 1 2 3M11 8l-2 5"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>', bolt: '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>', chart: '<path d="M4 19h16M7 16v-5M12 16V7M17 16v-8"/>',
    cal: '<path d="M7 4h10M6 8h12l-1 12H7z"/>', trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>', car: '<path d="M4 15l2-6h12l2 6v3H4z"/><circle cx="7.5" cy="15.5" r=".5"/><circle cx="16.5" cy="15.5" r=".5"/>', building: '<rect x="6" y="3" width="12" height="18" rx="1"/><path d="M10 7h.01M14 7h.01M10 11h.01M14 11h.01M10 15h.01M14 15h.01"/>', plane: '<path d="M3 13l18-7-5 14-4-6z"/>', star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>', code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4"/>', people: '<circle cx="9" cy="8" r="3"/><path d="M3 20c.5-3.5 3-5 6-5s5.5 1.5 6 5M16 5a3 3 0 0 1 0 6M18 15c2 .5 3 2 3.5 5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>', drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>', run: '<circle cx="15" cy="4.5" r="1.8"/><path d="M5 20l4-5 3 2 1-4M8 11l3-3 4 1 2 3 3 1M12 13l-1 4"/>',
    pause: '<path d="M9 6v12M15 6v12"/>', compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>', person: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>', book: '<path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h9"/>', image: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M5 18l5-5 3 3 2-2 4 4"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'
  };
  const icon = (n, cls) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'i' + (cls ? ' ' + cls : '')); s.setAttribute('aria-hidden', 'true'); s.innerHTML = PATHS[n] || ''; return s; };
  const fr = (v, d = 0) => (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const eur = v => fr(Math.round(v)) + ' €';
  const kg = v => fr(v, 1) + ' kg';
  const pad2 = n => String(n).padStart(2, '0');
  const dayId = (d = new Date()) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  const fmtD = s => { const d = new Date(s + 'T12:00'); return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); };
  const weekKey = (d = new Date()) => { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return dayId(x); };
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const vib = () => { try { if (navigator.vibrate) navigator.vibrate(4); } catch (e) {} };
  const reduced = () => !!(store && store.get && store.get('cap-anim-reduites')) || !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function appliquerAnim() { document.documentElement.classList.toggle('anim-reduites', !!store.get('cap-anim-reduites')); }
  function toast(msg) { if (/^Échec/.test(msg)) { if (window.CapSon) window.CapSon.jouer('erreur'); } const t = h('div', { class: 'toast glass', role: 'status' }, msg); document.body.appendChild(t); setTimeout(() => t.remove(), 1900); }
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };

  // ================================================================ Données (db ou mémoire)
  let db = null;
  const S = { profil: null, pesees: [], journaux: {}, epargne: [], seances: [], actions: { done: {} }, prefs: { favoris: [] }, perso: [], recettes: [], photos: [], taches: {}, ventes: [], programmes: [], opportunites: [], depenses: [], fournisseurs: [], decisions: [], operations: [], conversations: [] };
  const mem = { profil: {}, pesees: {}, repas: {}, epargne: {}, seances: {}, actions: {}, prefs: {}, aliments: {}, recettes: {}, photos: {}, historique: {}, taches: {}, ventes: {}, programmes: {}, opportunites: {}, depenses: {}, fournisseurs: {}, decisions: {}, operations: {}, conversations: {} };
  async function put(coll, id, data) {
    if (db) return db.collection(coll).doc(id).set(data);
    mem[coll][id] = data; store.set('cap-local', mem); syncMem(); return Promise.resolve();
  }
  async function remove(coll, id) { if (db) return db.collection(coll).doc(id).delete(); delete mem[coll][id]; store.set('cap-local', mem); syncMem(); }
  // Sans compte Claude : les données restent dans ce navigateur (sauvegarde locale)
  function loadLocal() { const saved = store.get('cap-local'); if (saved && typeof saved === 'object') Object.keys(mem).forEach(k => { if (saved[k] && typeof saved[k] === 'object') mem[k] = saved[k]; }); }
  function syncMem() {
    S.profil = mem.profil.main || null;
    S.pesees = Object.keys(mem.pesees).map(id => Object.assign({ id }, mem.pesees[id]));
    S.journaux = Object.assign({}, mem.repas);
    S.epargne = Object.keys(mem.epargne).map(id => Object.assign({ id }, mem.epargne[id]));
    S.seances = Object.keys(mem.seances).map(id => Object.assign({ id }, mem.seances[id]));
    S.actions = mem.actions[weekKey()] || { done: {} };
    S.prefs = Object.assign({ favoris: [] }, mem.prefs.main || {});
    S.perso = Object.keys(mem.aliments).map(id => Object.assign({ id }, mem.aliments[id]));
    S.recettes = Object.keys(mem.recettes).map(id => Object.assign({ id }, mem.recettes[id]));
    S.photos = Object.keys(mem.photos).map(id => Object.assign({ id }, mem.photos[id]));
    S.taches = Object.assign({}, mem.taches);
    S.ventes = Object.keys(mem.ventes).map(id => Object.assign({ id }, mem.ventes[id]));
    S.programmes = Object.keys(mem.programmes).map(id => Object.assign({ id }, mem.programmes[id]));
    S.opportunites = Object.keys(mem.opportunites).map(id => Object.assign({ id }, mem.opportunites[id]));
    ['depenses', 'fournisseurs', 'decisions', 'operations', 'conversations'].forEach(c => { S[c] = Object.keys(mem[c]).map(id => Object.assign({ id }, mem[c][id])); });
    refresh();
  }
  // Adaptation sans perte : chaque version remplacée du profil est gardée dans « historique »
  async function archiverProfil(raison) {
    if (!S.profil) return;
    const quand = new Date().toISOString();
    await put('historique', 'p-' + quand.replace(/[^0-9]/g, ''), { date: quand, raison, profil: S.profil });
  }
  async function saveProfil(patch) {
    const p = Object.assign({}, S.profil || {}, patch, { v: 2, majLe: new Date().toISOString() });
    Object.keys(p).forEach(k => { if (p[k] === undefined) p[k] = null; });
    await archiverProfil('modification');
    await put('profil', 'main', p);
    S.profil = p; refresh();
  }

  async function savePrefs(patch) { const p = Object.assign({}, S.prefs, patch); await put('prefs', 'main', p); S.prefs = p; window._keepScroll = true; refresh(); }
  const uid = () => 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  // Unités de poids : stockage toujours en kg
  const LB = 2.20462;
  const unite = A => ((A || S.profil || {}).unites === 'lb' ? 'lb' : 'kg');
  const wfmt = (vkg, A) => unite(A) === 'lb' ? fr(vkg * LB, 1) + ' lb' : fr(vkg, 1) + ' kg';

  // ================================================================ Calculs dérivés
  function derive(p) {
    p = p || S.profil || {};
    const doms = p.domaines || [];
    const corps = doms.indexOf('corps') >= 0, argent = doms.indexOf('argent') >= 0, entreprise = doms.indexOf('entreprise') >= 0;
    const phys = corps ? E.physique(p) : null;
    const energie = corps ? E.energie(p) : null;
    const progRegles = corps ? (window.CapTraining ? window.CapTraining.generer(p) : E.programme(p)) : null;
    // Programme IA : le plus récent marqué actif, revérifié à chaque affichage contre les contraintes ACTUELLES
    let progIA = null, progIAPropose = null;
    const K = window.CapContrats;
    if (corps && K && progRegles && progRegles.ok && progRegles.parametres) {
      // Revérification complète : sécurité, contraintes actuelles ET objectifs (un poids qui change peut rendre un objectif trop rapide)
      // Programmes enregistrés avant l'analyse individuelle (ancien format) : sécurité seulement, signalés comme tels
      const verifier = doc => doc.brut && !doc.brut.analyse && doc.brut.pret === undefined ? Object.assign(K.validerProgrammeIA(doc.brut, p, progRegles), { ancienFormat: true }) : K.validerPlanIndividuel(doc.brut, Object.assign({}, p, { complements: (doc.entrees || {}).complements || {} }), progRegles, { physique: E.physique(p), registre: [] });
      const doc = (S.programmes || []).filter(x => x.actif).sort((a, b) => b.date.localeCompare(a.date))[0];
      if (doc) {
        const v = verifier(doc);
        const ch = K.changements(doc.entrees, K.entrees(p, K.CHAMPS_PROGRAMME.concat(['complements'])));
        progIA = { doc, valide: v.ok, erreurs: v.erreurs, changements: ch, ancienFormat: !!v.ancienFormat, programme: v.ok ? Object.assign(v.programme, { modele: doc.modele, date: doc.date, idDoc: doc.id }) : null };
      }
      // Adaptation proposée par l'IA, en attente de la décision de l'utilisateur
      const prop = (S.programmes || []).filter(x => x.statut === 'propose' && !x.actif).sort((a, b) => b.date.localeCompare(a.date))[0];
      if (prop) { const v = verifier(prop); progIAPropose = { doc: prop, valide: v.ok, erreurs: v.erreurs, programme: v.ok ? v.programme : null }; }
    }
    const prog = progIA && progIA.valide ? progIA.programme : progRegles;
    const B = window.CapBusiness;
    const business = entreprise && B ? B.recommander(p) : null;
    // Activité choisie : modèle du catalogue, ou activité proposée par l'IA (gardée dans le profil, réévaluée ici)
    const choisi = entreprise && B ? (p.businessChoisi === 'ia' && p.businessIA ? p.businessIA : (p.businessChoisi && B.PAR_ID[p.businessChoisi] ? p.businessChoisi : null)) : null;
    const bplan = choisi ? B.plan(choisi, p, S.ventes) : null;
    const faites = {}; Object.keys(S.taches || {}).forEach(k => { if (S.taches[k] && S.taches[k].fait) faites[k] = S.taches[k]; });
    const baction = choisi ? B.planAction(choisi, p, faites, p.debutProjet || null) : null;
    const fin = argent ? E.finances(p, S.epargne, dayId()) : null;
    const issues = E.coherence(p, phys, prog, fin);
    const adapt = prog ? E.adaptation(prog, S.seances, dayId(), p.creeLe ? p.creeLe.slice(0, 10) : null) : null;
    const opIA = entreprise ? (S.opportunites || []).slice().sort((a, b) => b.date.localeCompare(a.date))[0] || null : null;
    return { p, corps, argent, entreprise, phys, energie, prog, progRegles, progIA, progIAPropose, fin, issues, adapt, business, choisi, bplan, baction, opIA };
  }

  // ================================================================ Règle (valeur en direct, inertie, aimantation)
  function Ruler(o) {
    const step = o.step, dec = o.decimals || 0, PX = o.px || 12;
    let pos = (o.value !== undefined && o.value !== null) ? o.value : o.start;
    let touched = o.value !== undefined && o.value !== null;
    let shown = null, raf = 0, vel = 0, mode = 'idle', lastX = 0, lastT = 0, snapTimer = 0, w = 0, ctx = null, dpr = 1;
    const clamp = v => Math.min(o.max, Math.max(o.min, v));
    const snap = v => clamp(Math.round((v - o.min) / step) * step + o.min);
    const fmt = v => fr(v, dec);
    const numEl = h('span', { class: 'num' }); const unitEl = h('em', null, o.unit);
    const valueBtn = h('button', { class: 'ruler-value', type: 'button', 'aria-label': 'Saisir la valeur au clavier' }, h('small', null, o.label || ''), h('span', { class: 'big' }, numEl, unitEl));
    const cv = h('canvas');
    const track = h('div', { class: 'ruler-track', tabindex: '0', role: 'slider', 'aria-label': o.label || o.unit, 'aria-valuemin': o.min, 'aria-valuemax': o.max }, cv, h('div', { class: 'ruler-needle' }));
    const hint = h('div', { class: 'ruler-meta' }, (touched ? '' : 'Fais glisser la règle · ') + fmt(o.min) + ' à ' + fmt(o.max) + ' ' + o.unit);
    const minus = h('button', { class: 'stepbtn glass press', type: 'button', 'aria-label': 'Diminuer' }, icon('minus'));
    const plusB = h('button', { class: 'stepbtn glass press', type: 'button', 'aria-label': 'Augmenter' }, icon('plus'));
    const head = h('div', { class: 'ruler-head' }, minus, valueBtn, plusB);
    const el = h('div', { class: 'ruler' + (touched ? '' : ' untouched') }, head, track, hint);

    function touch() { if (!touched) { touched = true; el.classList.remove('untouched'); hint.textContent = fmt(o.min) + ' à ' + fmt(o.max) + ' ' + o.unit; shown = snap(pos); o.onChange(Math.round(shown * 1000) / 1000); } }
    function update() {
      const v = snap(pos);
      if (v !== shown) {
        const unitH = dec ? 1 : step; if (shown !== null && Math.floor(v / unitH + 1e-9) !== Math.floor(shown / unitH + 1e-9) && (mode === 'drag' || mode === 'inertia')) vib();
        shown = v; numEl.textContent = fmt(v);
        track.setAttribute('aria-valuenow', v); track.setAttribute('aria-valuetext', fmt(v) + ' ' + o.unit);
        if (touched) o.onChange(Math.round(v * 1000) / 1000);
      }
    }
    function draw() {
      if (!ctx || !w) return;
      const H = 76; ctx.clearRect(0, 0, w, H);
      const cx = w / 2, half = Math.ceil(cx / PX) + 2;
      const base = Math.round((pos - o.min) / step);
      const tick = css('--faint') || '#AEAEB2', label = css('--muted') || '#6E6E73';
      ctx.textAlign = 'center'; ctx.font = '500 11px ' + (css('--f') || 'sans-serif');
      for (let k = base - half; k <= base + half; k++) {
        const v = o.min + k * step; if (v < o.min - 1e-9 || v > o.max + 1e-9) continue;
        const x = cx + (v - pos) / step * PX;
        const major = k % 10 === 0, mid = k % 5 === 0;
        ctx.fillStyle = major ? label : tick;
        const hh = major ? 34 : mid ? 24 : 15;
        ctx.fillRect(Math.round(x) - (major ? 1 : 0.5), 6, major ? 2 : 1, hh);
        if (major) { ctx.fillStyle = label; ctx.fillText(fr(v, o.labelDecimals || 0), x, 62); }
      }
    }
    function frame(t) {
      raf = 0;
      if (mode === 'inertia') {
        const dt = Math.min(32, t - (lastT || t)); lastT = t;
        pos += vel * dt; vel *= Math.pow(0.9955, dt);
        if (pos <= o.min || pos >= o.max) { pos = clamp(pos); vel = 0; }
        if (Math.abs(vel) < step * 0.0008) mode = 'snap';
      }
      if (mode === 'snap') {
        const target = snap(pos); pos += (target - pos) * 0.28;
        if (Math.abs(target - pos) < step * 0.01) { pos = target; mode = 'idle'; }
      }
      update(); draw();
      if (mode === 'inertia' || mode === 'snap') schedule();
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const settle = () => { mode = reduced() ? 'idle' : 'snap'; if (mode === 'idle') pos = snap(pos); lastT = 0; schedule(); };
    function nudge(n) { touch(); mode = 'idle'; pos = snap(clamp(snap(pos) + n * step)); update(); draw(); }

    // Glisser
    const samples = [];
    track.addEventListener('pointerdown', e => {
      track.setPointerCapture(e.pointerId); touch(); mode = 'drag'; vel = 0; lastX = e.clientX; samples.length = 0; samples.push([e.timeStamp, pos]);
    });
    track.addEventListener('pointermove', e => {
      if (mode !== 'drag') return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      pos = clamp(pos - dx / PX * step);
      samples.push([e.timeStamp, pos]); if (samples.length > 6) samples.shift();
      update(); draw();
    });
    const end = e => {
      if (mode !== 'drag') return;
      const a = samples[0], b = samples[samples.length - 1];
      vel = a && b && b[0] - a[0] > 0 && e.timeStamp - b[0] < 80 ? (b[1] - a[1]) / (b[0] - a[0]) : 0;
      if (reduced()) vel = 0;
      mode = Math.abs(vel) > step * 0.002 ? 'inertia' : 'snap'; lastT = 0; schedule();
    };
    track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
    track.addEventListener('wheel', e => { e.preventDefault(); touch(); mode = 'idle'; const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; pos = clamp(pos + d / PX * step); update(); draw(); clearTimeout(snapTimer); snapTimer = setTimeout(settle, 120); }, { passive: false });
    track.addEventListener('keydown', e => {
      const m = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
      if (m) { e.preventDefault(); nudge(e.shiftKey ? m * 10 : m); }
      else if (e.key === 'Home') { e.preventDefault(); touch(); pos = o.min; update(); draw(); }
      else if (e.key === 'End') { e.preventDefault(); touch(); pos = o.max; update(); draw(); }
    });
    // + / − avec appui long accéléré
    function holdBtn(btn, dir) {
      let t1 = 0, t2 = 0, n = 0;
      const stop = () => { clearTimeout(t1); clearInterval(t2); };
      btn.addEventListener('pointerdown', e => { e.preventDefault(); n = 0; nudge(dir); t1 = setTimeout(() => { t2 = setInterval(() => { n++; nudge(dir * (n > 25 ? 10 : 1)); }, 70); }, 380); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, stop));
      btn.addEventListener('click', e => { if (e.detail === 0) nudge(dir); });
    }
    holdBtn(minus, -1); holdBtn(plusB, 1);
    // Saisie directe
    valueBtn.addEventListener('click', () => {
      const inp = h('input', { class: 'ruler-input', inputmode: dec ? 'decimal' : 'numeric', 'aria-label': (o.label || '') + ' en ' + o.unit, value: touched ? fmt(snap(pos)).replace(/\s/g, '') : '' });
      const err = h('div', { class: 'err', role: 'alert' });
      const box = h('div', { style: 'display:flex;flex-direction:column;align-items:center;gap:4px;flex:1' }, inp, err);
      head.replaceChild(box, valueBtn); inp.focus(); inp.select();
      let done = false;
      const commit = () => {
        if (done) return;
        const v = parseFloat(inp.value.replace(/\s/g, '').replace(',', '.'));
        if (!isFinite(v)) { if (!inp.value.trim()) { done = true; head.replaceChild(valueBtn, box); return; } err.textContent = 'Entre un nombre.'; return; }
        if (v < o.min || v > o.max) { err.textContent = 'Entre ' + fmt(o.min) + ' et ' + fmt(o.max) + ' ' + o.unit + '.'; return; }
        done = true; head.replaceChild(valueBtn, box); touch(); mode = 'idle'; pos = snap(v); shown = null; update(); draw();
      };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { done = true; head.replaceChild(valueBtn, box); } });
      inp.addEventListener('blur', () => setTimeout(commit, 0));
    });
    function resize() {
      const r = track.getBoundingClientRect(); w = Math.round(r.width); if (!w) return;
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      cv.width = w * dpr; cv.height = 76 * dpr; ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(track); else setTimeout(resize, 50);
    requestAnimationFrame(resize);
    shown = null; numEl.textContent = fmt(snap(pos)); track.setAttribute('aria-valuenow', snap(pos));
    if (touched) shown = snap(pos);
    return { el, isTouched: () => touched, value: () => snap(pos) };
  }

  // ================================================================ Sparkle (d'après « Sparkle Button » de JkHuger, Uiverse.io)
  // Classes préfixées sk- (isolées). Actif au survol (souris), au focus clavier, au toucher et pendant un chargement.
  const SK_ICON = '<svg class="sk-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.187 8.096L15 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L21.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09L15 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L8.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09z"/><path d="M6 14.25l-.259 1.035a3.375 3.375 0 0 1-2.456 2.456L2.25 18l1.035.259a3.375 3.375 0 0 1 2.456 2.456L6 21.75l.259-1.035a3.375 3.375 0 0 1 2.455-2.456L9.75 18l-1.036-.259a3.375 3.375 0 0 1-2.455-2.456z"/><path d="M6.5 4l-.197.592a1.125 1.125 0 0 1-.712.711L5 5.5l.591.197a1.125 1.125 0 0 1 .712.712L6.5 7l.197-.591a1.125 1.125 0 0 1 .712-.712L8 5.5l-.591-.197a1.125 1.125 0 0 1-.712-.711z"/></svg>';
  function sparkle(label, onClick, opts) {
    opts = opts || {};
    const btn = h('button', { class: 'sk-btn', type: 'button', disabled: !!opts.disabled },
      h('span', { class: 'sk-spark', 'aria-hidden': 'true' }), h('span', { class: 'sk-backdrop', 'aria-hidden': 'true' }),
      h('span', { class: 'sk-iconw', html: SK_ICON }), h('span', { class: 'sk-text' }, label));
    const pen = h('span', { class: 'sk-pen', 'aria-hidden': 'true' });
    for (let i = 0; i < 18; i++) {
      const r = (a, b) => a + Math.random() * (b - a);
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      p.setAttribute('viewBox', '0 0 15 15'); p.setAttribute('class', 'sk-p');
      p.style.cssText = '--x:' + r(10, 90).toFixed(1) + ';--y:' + r(25, 75).toFixed(1) + ';--duration:' + r(6, 18).toFixed(1) + ';--delay:' + r(1, 10).toFixed(1) + ';--alpha:' + r(.4, .9).toFixed(2) + ';--origin-x:' + (Math.random() > .5 ? r(300, 800) : r(-800, -300)).toFixed(0) + '%;--origin-y:' + (Math.random() > .5 ? r(300, 800) : r(-800, -300)).toFixed(0) + '%;--size:' + r(.4, .9).toFixed(2);
      p.innerHTML = '<path d="M7.5 0L9.08 5.92L15 7.5L9.08 9.08L7.5 15L5.92 9.08L0 7.5L5.92 5.92L7.5 0Z"/>';
      pen.appendChild(p);
    }
    const el = h('div', { class: 'sk' }, btn, pen);
    let t = 0;
    btn.addEventListener('pointerdown', () => { clearTimeout(t); el.classList.add('on'); vib(); });
    const off = () => { clearTimeout(t); t = setTimeout(() => el.classList.remove('on'), 650); };
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => btn.addEventListener(ev, off));
    btn.addEventListener('click', e => { if (!btn.disabled && !el.classList.contains('loading')) onClick(e); });
    return {
      el, btn,
      loading(on, txt) { el.classList.toggle('loading', !!on); btn.setAttribute('aria-busy', String(!!on)); if (txt) btn.querySelector('.sk-text').textContent = txt; },
      label(txt) { btn.querySelector('.sk-text').textContent = txt; }
    };
  }
  // Nombres et anneaux animés depuis leur dernière valeur réelle (jamais depuis une valeur inventée)
  const derniers = {};
  function nombre(cle, valeur, format) {
    const el = h('span', { class: 'num', 'data-nk': cle, 'data-nv': String(valeur) }, format(valeur));
    el._fmt = format; return el;
  }
  function animerNombres(root) {
    (root || document).querySelectorAll('[data-nk]').forEach(el => {
      const k = el.getAttribute('data-nk'), to = parseFloat(el.getAttribute('data-nv'));
      const from = derniers[k]; derniers[k] = to;
      if (from === undefined || from === to || reduced() || !isFinite(from)) return;
      const t0 = performance.now(), D = 480;
      const step = now => { const x = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - x, 3); el.textContent = el._fmt(from + (to - from) * e); if (x < 1) requestAnimationFrame(step); else el.textContent = el._fmt(to); };
      el.textContent = el._fmt(from); requestAnimationFrame(step);
    });
  }

  // ================================================================ Composants de saisie
  function choices(ctx, field, opts, cfg) {
    cfg = cfg || {};
    const multi = !!cfg.multi;
    const wrap = h('div', { class: cfg.grid ? 'grid2' : 'content', role: multi ? 'group' : 'radiogroup', style: cfg.grid ? '' : 'padding-top:0' });
    const isOn = v => multi ? (ctx.A[field] || []).indexOf(v) >= 0 : ctx.A[field] === v;
    const btns = opts.map(o => {
      const b = h('button', { class: 'choice' + (multi ? ' multi' : ''), type: 'button', role: multi ? 'checkbox' : 'radio', 'aria-checked': String(isOn(o.v)) },
        o.i ? h('span', { class: 'ci' }, icon(o.i)) : null,
        h('span', { class: 'ct' }, o.t, o.s ? h('small', null, o.s) : null),
        h('span', { class: 'ck' }, icon('check')));
      b.addEventListener('click', () => {
        if (multi) {
          let cur = (ctx.A[field] || []).slice();
          if (o.exclusive) cur = isOn(o.v) ? [] : [o.v];
          else { cur = cur.filter(x => !opts.some(q => q.exclusive && q.v === x)); const i = cur.indexOf(o.v); if (i >= 0) cur.splice(i, 1); else cur.push(o.v); }
          ctx.A[field] = cur;
        } else ctx.A[field] = o.v;
        btns.forEach((x, i) => x.setAttribute('aria-checked', String(isOn(opts[i].v))));
        vib(); if (window.CapSon) window.CapSon.jouer('selection'); if (cfg.onPick) cfg.onPick(o.v); ctx.changed();
      });
      return b;
    });
    add(wrap, btns);
    return wrap;
  }
  function ruler(ctx, field, cfg) {
    const r = Ruler(Object.assign({}, cfg, { value: ctx.A[field], onChange: v => { ctx.A[field] = v; ctx.changed(); } }));
    ctx.touch = () => r.isTouched();
    return r.el;
  }
  function money(ctx, field, cfg) {
    cfg = cfg || {};
    const inp = h('input', { id: 'm-' + field, type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: cfg.ph || '0', 'aria-label': cfg.label || 'Montant en euros' });
    if (ctx.A[field] !== undefined && ctx.A[field] !== null) inp.value = String(ctx.A[field]).replace('.', ',');
    const echo = h('div', { class: 'muted sub num' });
    const showEcho = () => { echo.textContent = (ctx.A[field] !== undefined && ctx.A[field] !== null) ? '= ' + eur(ctx.A[field]) + (cfg.per ? ' ' + cfg.per : '') : (cfg.empty || ''); };
    inp.addEventListener('input', () => {
      const raw = inp.value.replace(/\s/g, '').replace(',', '.');
      const v = raw === '' ? null : parseFloat(raw);
      ctx.A[field] = raw === '' || !isFinite(v) ? null : Math.round(v * 100) / 100; showEcho(); ctx.changed();
    });
    showEcho();
    return h('div', { class: 'money' }, h('div', { class: 'box' }, inp, h('span', { class: 'eur' }, '€')), echo);
  }
  function uniteSeg(ctx) {
    const u = unite(ctx.A);
    const b = (v, t) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(u === v), class: u === v ? 'on' : '', onclick: () => { if (unite(ctx.A) !== v) { ctx.A.unites = v; if (ctx.rerender) ctx.rerender(); } } }, t);
    return h('div', { class: 'seg seg-simple', role: 'radiogroup', 'aria-label': 'Unité de poids', style: 'max-width:200px;margin:0 auto' }, b('kg', 'kg'), b('lb', 'lb'));
  }
  function weightRuler(ctx, field, label, startKg) {
    const lb = unite(ctx.A) === 'lb';
    const k = lb ? LB : 1;
    const v = has(ctx.A[field]) ? Math.round(ctx.A[field] * k * 10) / 10 : undefined;
    const r = Ruler({ min: lb ? 66 : 30, max: lb ? 660 : 300, step: 0.1, decimals: 1, unit: lb ? 'lb' : 'kg', label, start: Math.round(startKg * k * 10) / 10, px: 12, value: v,
      onChange: x => { ctx.A[field] = Math.round(x / k * 100) / 100; ctx.changed(); } });
    ctx.touch = () => r.isTouched();
    return r.el;
  }
  function liveCapacite(ctx) {
    const a = ctx.A; const box = h('div', { class: 'note tint' });
    const upd = () => {
      box.textContent = '';
      if ([a.revenus, a.fixes, a.variables].some(v => v === undefined || v === null)) { add(box, 'Ta capacité d’épargne s’affichera ici.'); return; }
      const c = a.revenus - a.fixes - a.variables - (a.remboursements || 0);
      add(box, h('b', null, 'Capacité d’épargne : ' + eur(c) + ' / mois'), h('br'), c < 0 ? 'Tes dépenses dépassent tes revenus.' : c === 0 ? 'Rien ne reste à la fin du mois pour l’instant.' : 'C’est ce qui reste après tes dépenses.');
    };
    ctx.onChange.push(upd); upd(); return box;
  }

  // ================================================================ Étapes du questionnaire
  const has = v => v !== undefined && v !== null && v !== '';
  const C = A => (A.domaines || []).indexOf('corps') >= 0;
  const M = A => (A.domaines || []).indexOf('argent') >= 0;
  const E_ = A => (A.domaines || []).indexOf('entreprise') >= 0;
  const ME = A => M(A) || E_(A);
  const DELAIS = [[4, '1 mois'], [9, '2 mois'], [13, '3 mois'], [26, '6 mois'], [52, '1 an'], [0, 'Pas de date précise']];
  const REVES = [
    { v: 'appart', t: 'Appartement à Dubaï', s: '1 chambre, Dubai Marina', i: 'building' },
    { v: 'vivre', t: 'Vivre à Dubaï', s: 'S’installer et y payer un loyer', i: 'plane' },
    { v: 'urus', t: 'Lamborghini Urus', s: 'Achat et coût d’usage', i: 'car' },
    { v: 'appart_urus', t: 'Appartement + Urus', s: 'Les deux projets', i: 'star' },
    { v: 'autre', t: 'Autre projet', s: 'Tu fixes le montant', i: 'target' }
  ];
  const STEPS = [
    { id: 'domaines', sec: 'Départ', f: ['domaines'], q: 'Sur quoi veux-tu avancer ?', lead: 'Choisis un ou plusieurs modules. Cap ne te posera que les questions utiles à ces choix.', ok: A => (A.domaines || []).length > 0,
      body: ctx => choices(ctx, 'domaines', [{ v: 'corps', t: 'Mon corps', s: 'Santé, nutrition, sport', i: 'body' }, { v: 'argent', t: 'Mon argent', s: 'Budget, épargne, projet de vie', i: 'wallet' }, { v: 'entreprise', t: 'Créer une entreprise', s: 'Trois activités adaptées à toi, plan chiffré, plan 30/60/90 jours', i: 'building' }], { multi: true }) },
    { id: 'age', sec: 'Départ', f: ['age'], q: 'Quel âge as-tu ?', lead: 'Avant 18 ans, les règles de calcul changent pour protéger ta croissance et respecter le droit du travail.', ok: A => has(A.age), touch: true,
      check: A => A.age < 13 ? 'Cap est prévu à partir de 13 ans. Pour un objectif de santé, parles-en avec ton médecin.' : null,
      body: ctx => ruler(ctx, 'age', { min: 10, max: 100, step: 1, unit: 'ans', label: 'Âge', start: 18, px: 16 }) },
    { id: 'tempsLibre', sec: 'Départ', f: ['tempsLibre'], q: 'Combien d’heures libres as-tu par semaine ?', lead: 'Hors cours ou travail, trajets, repas et sommeil. Sert à vérifier que ton programme tient dans ta semaine.', ok: A => has(A.tempsLibre), touch: true,
      body: ctx => ruler(ctx, 'tempsLibre', { min: 0, max: 100, step: 1, unit: 'h', label: 'Par semaine', start: 15, px: 14 }) },
    // Corps
    { id: 'sexe', sec: 'Corps', when: C, f: ['sexe'], q: 'Quelle formule de métabolisme utiliser ?', lead: 'Les équations scientifiques diffèrent selon le sexe biologique. Ce choix sert uniquement à ce calcul, jamais ailleurs. Sans réponse, Cap prend la moyenne des deux formules et élargit la marge d’erreur.', ok: A => has(A.sexe),
      body: ctx => choices(ctx, 'sexe', [{ v: 'H', t: 'Formule masculine' }, { v: 'F', t: 'Formule féminine' }, { v: 'nr', t: 'Je préfère ne pas répondre', s: 'Moyenne des deux, estimation moins précise' }]) },
    { id: 'taille', sec: 'Corps', when: C, f: ['taille'], q: 'Quelle est ta taille ?', lead: 'Pour l’IMC et la dépense de base.', ok: A => has(A.taille), touch: true, body: ctx => ruler(ctx, 'taille', { min: 120, max: 230, step: 1, unit: 'cm', label: 'Taille', start: 170, px: 14 }) },
    { id: 'poids', sec: 'Corps', when: C, f: ['poids'], q: 'Quel est ton poids ?', lead: 'Le matin, à jeun, si possible. Touche le chiffre pour le saisir au clavier.', ok: A => has(A.poids), touch: true, body: ctx => [uniteSeg(ctx), weightRuler(ctx, 'poids', 'Poids actuel', 70)] },
    { id: 'tour', sec: 'Corps', when: C, f: ['tour'], optional: true, q: 'Ton tour de taille ?', lead: 'Facultatif. Mesuré au niveau du nombril, il montre la perte de gras mieux que la balance.', ok: A => has(A.tour), touch: true, body: ctx => ruler(ctx, 'tour', { min: 40, max: 200, step: 0.5, decimals: 1, unit: 'cm', label: 'Tour de taille', start: 80, px: 12, labelDecimals: 0 }) },
    { id: 'objectif', sec: 'Corps', when: C, f: ['objectif'], q: 'Quel est ton objectif ?', ok: A => has(A.objectif),
      body: ctx => choices(ctx, 'objectif', [{ v: 'perdre', t: 'Perdre du gras', s: 'Léger déficit calorique', i: 'flame' }, { v: 'maintenir', t: 'Maintenir mon poids', s: 'Améliorer la forme sans changer de poids', i: 'heart' }, { v: 'prendre', t: 'Prendre du muscle', s: 'Léger surplus calorique', i: 'dumbbell' }]) },
    { id: 'cible', sec: 'Corps', when: A => C(A) && A.objectif !== 'maintenir', f: ['cible'], q: 'Quel poids vises-tu ?', lead: 'Tu verras tout de suite l’écart et ce qu’il représente.', ok: A => has(A.cible), touch: true,
      body: ctx => {
        const box = h('div', { class: 'note' });
        const upd = () => {
          box.textContent = ''; const A = ctx.A;
          if (!has(A.cible) || !has(A.poids) || !has(A.taille)) { add(box, 'Fais glisser la règle.'); return; }
          const d = A.cible - A.poids, imc = A.cible / Math.pow(A.taille / 100, 2), pct = Math.abs(d) / A.poids * 100;
          add(box, h('b', null, (d > 0 ? '+' : '') + (unite(A) === 'lb' ? fr(d * LB, 1) + ' lb' : fr(d, 1) + ' kg')), ' (' + fr(pct, 0) + ' % de ton poids) · IMC visé ' + fr(imc, 1));
          if (A.objectif === 'perdre' && d >= 0) add(box, h('br'), 'Pour perdre du gras, choisis un poids plus bas que ton poids actuel.');
          if (A.objectif === 'prendre' && d <= 0) add(box, h('br'), 'Pour prendre du muscle, choisis un poids plus haut que ton poids actuel.');
          if (A.objectif === 'perdre' && d < 0 && (imc < 18.5 || pct >= 40 || A.cible < 35)) add(box, h('br'), 'Ce poids demande un avis médical. Cap ne calculera pas de plan vers cette cible.');
        };
        ctx.onChange.push(upd);
        const r = weightRuler(ctx, 'cible', 'Poids visé', has(ctx.A.poids) ? Math.round((ctx.A.poids + (ctx.A.objectif === 'perdre' ? -3 : 3)) * 10) / 10 : 70);
        upd(); return [r, box];
      } },
    { id: 'delai', sec: 'Corps', when: A => C(A) && A.objectif !== 'maintenir', f: ['delaiSem'], q: 'En combien de temps ?', lead: 'Sois honnête : Cap te dira si ce délai est réaliste, sans changer ton choix sans te le dire.', ok: A => A.delaiSem !== undefined && A.delaiSem !== null,
      body: ctx => choices(ctx, 'delaiSem', DELAIS.map(d => ({ v: d[0], t: d[1] })), { grid: true }) },
    { id: 'activite', sec: 'Activité', when: C, f: ['activite'], q: 'En dehors du sport, ta journée est plutôt…', ok: A => has(A.activite),
      body: ctx => choices(ctx, 'activite', [{ v: 'assis', t: 'Assise', s: 'Cours, bureau, écrans', i: 'clock' }, { v: 'mixte', t: 'Mixte', s: 'Souvent debout, je marche', i: 'walk' }, { v: 'physique', t: 'Physique', s: 'Métier ou journées très actives', i: 'bolt' }]) },
    { id: 'autreSport', sec: 'Activité', when: C, f: ['autreSport'], q: 'Pratiques-tu un autre sport ?', lead: 'Football, basket, course… Nombre de séances par semaine.', ok: A => has(A.autreSport),
      body: ctx => choices(ctx, 'autreSport', [[0, 'Aucun'], [1, '1 séance'], [2, '2 séances'], [3, '3 séances'], [4, '4 séances'], [5, '5 et plus']].map(x => ({ v: x[0], t: x[1] })), { grid: true }) },
    { id: 'niveau', sec: 'Programme', when: C, f: ['niveau'], q: 'Ton niveau en musculation ?', ok: A => has(A.niveau),
      body: ctx => choices(ctx, 'niveau', [{ v: 'debutant', t: 'Débutant', s: 'Moins de 6 mois de pratique régulière' }, { v: 'intermediaire', t: 'Intermédiaire', s: '6 mois à 2 ans' }, { v: 'avance', t: 'Avancé', s: 'Plus de 2 ans' }]) },
    { id: 'jours', sec: 'Programme', when: C, f: ['jours'], q: 'Combien de séances de musculation par semaine ?', lead: 'Ce que tu peux tenir sur la durée, pas ce que tu ferais une bonne semaine.', ok: A => has(A.jours),
      body: ctx => choices(ctx, 'jours', [0, 1, 2, 3, 4, 5, 6].map(n => ({ v: n, t: n === 0 ? 'Aucune' : String(n) }))), },
    { id: 'minutes', sec: 'Programme', when: A => C(A) && A.jours > 0, f: ['minutes'], q: 'Combien de temps par séance ?', ok: A => has(A.minutes), body: ctx => choices(ctx, 'minutes', [20, 30, 45, 60, 90].map(n => ({ v: n, t: n + ' min' })), { grid: true }) },
    { id: 'lieu', sec: 'Programme', when: A => C(A) && A.jours > 0, f: ['lieu'], q: 'Où t’entraînes-tu ?', ok: A => has(A.lieu), body: ctx => choices(ctx, 'lieu', [{ v: 'salle', t: 'En salle', i: 'dumbbell' }, { v: 'maison', t: 'À la maison', s: 'Sans matériel ou presque', i: 'home' }]) },
    { id: 'materielSport', sec: 'Programme', when: A => C(A) && A.jours > 0 && A.lieu === 'maison', f: ['materielSport'], q: 'Quel matériel as-tu chez toi ?', lead: 'Décide quels exercices sont possibles. Rien n’est acheté pour toi.', ok: A => (A.materielSport || []).length > 0,
      body: ctx => choices(ctx, 'materielSport', [{ v: 'elastique', t: 'Élastiques' }, { v: 'halteres', t: 'Haltères' }, { v: 'traction', t: 'Barre de traction' }, { v: 'banc', t: 'Banc ou chaise solide' }, { v: 'aucun', t: 'Rien', s: 'Poids du corps uniquement', exclusive: true }], { multi: true }) },
    { id: 'prioriteSport', sec: 'Programme', when: A => C(A) && A.jours > 0, f: ['prioriteSport'], q: 'Ta priorité à l’entraînement ?', lead: 'Change les séries, les répétitions et les temps de repos.', ok: A => has(A.prioriteSport),
      body: ctx => choices(ctx, 'prioriteSport', [{ v: 'forme', t: 'Forme générale', s: 'Plus de répétitions, repos courts' }, { v: 'muscle', t: 'Prendre du muscle', s: '6 à 15 répétitions' }, { v: 'force', t: 'Gagner en force', s: 'Charges lourdes. Réservé aux adultes non débutants' }, { v: 'auto', t: 'Laisser Cap choisir', s: 'Déduit de ton objectif de poids' }]) },
    { id: 'contraintes', sec: 'Programme', when: C, f: ['contraintes'], q: 'Quelque chose à prendre en compte ?', lead: 'Cap ne remplace pas un avis médical, mais adapte ses conseils.', ok: A => (A.contraintes || []).length > 0,
      body: ctx => choices(ctx, 'contraintes', [{ v: 'douleur', t: 'Douleur ou blessure', i: 'alert' }, { v: 'sante', t: 'Problème de santé suivi par un médecin', i: 'heart' }, { v: 'aucune', t: 'Rien de particulier', exclusive: true, i: 'check' }], { multi: true }) },
    { id: 'zonesDouleur', sec: 'Programme', when: A => C(A) && (A.contraintes || []).indexOf('douleur') >= 0, f: ['zonesDouleur'], q: 'Où as-tu mal ?', lead: 'Cap retire les exercices qui sollicitent fortement cette zone. Ce n’est pas un avis médical.', ok: A => (A.zonesDouleur || []).length > 0,
      body: ctx => choices(ctx, 'zonesDouleur', [{ v: 'genou', t: 'Genou' }, { v: 'dos', t: 'Bas du dos' }, { v: 'epaule', t: 'Épaule' }, { v: 'poignet', t: 'Poignet' }, { v: 'autre', t: 'Ailleurs', s: 'Cap retire seulement les sauts' }], { multi: true }) },
    { id: 'regime', sec: 'Nutrition', when: C, f: ['regime'], q: 'Ton alimentation', lead: 'Filtre la base d’aliments et les suggestions. Halal : Cap retire le porc, mais ne peut pas vérifier l’abattage.', ok: A => has(A.regime),
      body: ctx => choices(ctx, 'regime', Object.keys(window.CapFoods.REGIMES).map(k => ({ v: k, t: window.CapFoods.REGIMES[k][0] }))) },
    { id: 'suivi', sec: 'Nutrition', when: C, f: ['modeSimple'], q: 'As-tu déjà compté tes calories ?', lead: 'Pour choisir ce que l’accueil affiche au début.', ok: A => A.modeSimple === true || A.modeSimple === false,
      body: ctx => choices(ctx, 'modeSimple', [{ v: false, t: 'Oui', s: 'Afficher calories, protéines, glucides et lipides' }, { v: true, t: 'Non, c’est nouveau', s: 'Commencer simple : calories et protéines. Les autres macros restent dans Réglages.' }]) },
    { id: 'faisabilite', sec: 'Corps', when: A => C(A) && A.objectif !== 'maintenir', f: ['rythme'], q: 'Ton rythme', ok: A => { const r = E.physique(A); return !r.ok ? false : (!r.planPossible || has(A.rythme)); },
      body: ctx => faisabilite(ctx) },
    { id: 'obstacle', sec: 'Corps', when: C, f: ['obstacle'], optional: true, q: 'Qu’est-ce qui t’a le plus freiné jusqu’ici ?', lead: 'Facultatif. Sert à choisir les conseils du quotidien.', ok: A => has(A.obstacle),
      body: ctx => choices(ctx, 'obstacle', [{ v: 'regularite', t: 'La régularité' }, { v: 'alim', t: 'Mes habitudes alimentaires' }, { v: 'temps', t: 'Le manque de temps' }, { v: 'motivation', t: 'La motivation' }]) },
    // Argent
    { id: 'revenus', sec: 'Argent', when: M, f: ['revenus'], q: 'Combien reçois-tu par mois ?', lead: 'Net, ce qui arrive vraiment : salaire, job, argent de poche. 0 si rien.', ok: A => has(A.revenus), body: ctx => money(ctx, 'revenus', { per: 'par mois' }) },
    { id: 'fixes', sec: 'Argent', when: M, f: ['fixes'], q: 'Tes dépenses fixes par mois ?', lead: 'Loyer, abonnements, téléphone, transport, assurance. 0 si tes parents paient tout.', ok: A => has(A.fixes), body: ctx => [money(ctx, 'fixes', { per: 'par mois' })] },
    { id: 'variables', sec: 'Argent', when: M, f: ['variables'], q: 'Tes dépenses variables par mois ?', lead: 'Sorties, nourriture à l’extérieur, vêtements, jeux, achats en ligne.', ok: A => has(A.variables), body: ctx => [money(ctx, 'variables', { per: 'par mois' }), liveCapacite(ctx)] },
    { id: 'remboursements', sec: 'Argent', when: M, f: ['remboursements'], q: 'Rembourses-tu un crédit ou une dette ?', lead: 'Montant mensuel. 0 si aucun.', ok: A => has(A.remboursements), body: ctx => [money(ctx, 'remboursements', { per: 'par mois' }), liveCapacite(ctx)] },
    { id: 'epargne', sec: 'Argent', when: M, f: ['epargne'], q: 'Combien as-tu de côté aujourd’hui ?', lead: 'Ton point de départ. 0, c’est un vrai départ.', ok: A => has(A.epargne), body: ctx => money(ctx, 'epargne') },
    { id: 'reve', sec: 'Argent', when: M, f: ['reve', 'reveMontant'], q: 'Quel est ton grand projet ?', lead: 'Coûts estimés avec des sources datées du ' + E.REF.date + '.', ok: A => has(A.reve) && (A.reve !== 'autre' || (A.reveMontant > 0)),
      body: ctx => { const extra = h('div', { hidden: ctx.A.reve !== 'autre' }, money(ctx, 'reveMontant', { ph: '20000', label: 'Montant du projet' })); return [choices(ctx, 'reve', REVES, { onPick: v => { extra.hidden = v !== 'autre'; } }), extra]; } },
    { id: 'reveAnnee', sec: 'Argent', when: M, f: ['reveAnnee'], q: 'Pour quand ?', ok: A => has(A.reveAnnee),
      body: ctx => {
        const box = h('div', { class: 'note' });
        const upd = () => {
          box.textContent = ''; const A = ctx.A;
          if (!has(A.reveAnnee) || !has(A.reve)) { add(box, 'Choisis une année.'); return; }
          const f = E.finances(Object.assign({ remboursements: 0 }, A), [], dayId());
          if (!f.ok) return;
          add(box, h('b', null, eur(f.requisMensuel) + ' par mois'), ' à mettre de côté pendant ' + f.mois + ' mois pour réunir ' + eur(f.reste) + '.', h('br'), 'Ta capacité actuelle : ' + eur(f.capacite) + ' par mois.');
        };
        ctx.onChange.push(upd); upd();
        const y = new Date().getFullYear();
        return [choices(ctx, 'reveAnnee', [2, 5, 10, 15].map(n => ({ v: y + n, t: String(y + n), s: n + ' ans' })), { grid: true }), box];
      } },
    { id: 'competences', sec: 'Projet', when: ME, f: ['competences'], q: 'Qu’est-ce que tu sais déjà faire ?', lead: 'Décide quelles activités tu peux livrer tout de suite et lesquelles demandent d’apprendre d’abord.', ok: A => (A.competences || []).length > 0,
      body: ctx => choices(ctx, 'competences', [{ v: 'code', t: 'Code (sites, applis)', i: 'code' }, { v: 'design', t: 'Design, graphisme' }, { v: 'video', t: 'Vidéo, montage' }, { v: 'photo', t: 'Photo' }, { v: 'reseaux', t: 'Réseaux sociaux' }, { v: 'ecriture', t: 'Écriture' }, { v: 'langues', t: 'Langues étrangères' }, { v: 'cours', t: 'Bon dans une matière scolaire', s: 'Pour donner des cours' }, { v: 'bricolage', t: 'Bricolage' }, { v: 'sport', t: 'Sport' }, { v: 'vente', t: 'Vente, relation client', i: 'people' }, { v: 'aucune', t: 'Rien encore', exclusive: true }], { multi: true }) },
    { id: 'heuresProjet', sec: 'Projet', when: ME, f: ['heuresProjet'], q: 'Combien d’heures par semaine pour ton projet ?', lead: 'Apprendre, créer, chercher des clients.', ok: A => has(A.heuresProjet), touch: true,
      body: ctx => ruler(ctx, 'heuresProjet', { min: 0, max: 100, step: 1, unit: 'h', label: 'Par semaine', start: 7, px: 14 }) },
    { id: 'revenuVise', sec: 'Projet', when: ME, f: ['revenuVise'], optional: true, q: 'Un revenu mensuel que tu vises ?', lead: 'Facultatif. Il restera une hypothèse affichée à part, jamais comptée comme acquise.', ok: A => has(A.revenuVise), body: ctx => money(ctx, 'revenuVise', { per: 'par mois (hypothèse)' }) },
    // Entreprise
    { id: 'pays', sec: 'Entreprise', when: E_, f: ['pays'], q: 'Dans quel pays veux-tu lancer ton activité ?', lead: 'Les statuts, les taxes et les âges légaux en dépendent. Cap connaît les règles françaises.', ok: A => has(A.pays),
      body: ctx => choices(ctx, 'pays', [{ v: 'france', t: 'France' }, { v: 'emirats', t: 'Émirats arabes unis', s: 'Règles non couvertes par Cap pour l’instant' }, { v: 'autre', t: 'Autre pays', s: 'Règles non couvertes par Cap pour l’instant' }]) },
    { id: 'capital', sec: 'Entreprise', when: E_, f: ['capital'], q: 'Combien peux-tu investir pour démarrer ?', lead: 'Argent que tu acceptes de dépenser pour lancer l’activité, à part de ton épargne. Décide quelles activités sont finançables.', ok: A => has(A.capital), body: ctx => money(ctx, 'capital') },
    { id: 'materielPro', sec: 'Entreprise', when: E_, f: ['materielPro'], q: 'Quel matériel as-tu déjà ?', lead: 'Ce que tu possèdes n’est pas compté dans le budget de départ.', ok: A => (A.materielPro || []).length > 0,
      body: ctx => choices(ctx, 'materielPro', [{ v: 'ordinateur', t: 'Ordinateur' }, { v: 'smartphone', t: 'Smartphone récent' }, { v: 'appareil_photo', t: 'Appareil photo' }, { v: 'outils', t: 'Outils de bricolage' }, { v: 'micro', t: 'Micro et éclairage' }, { v: 'aucun', t: 'Rien de tout ça', exclusive: true }], { multi: true }) },
    { id: 'experience', sec: 'Entreprise', when: E_, f: ['experience'], q: 'As-tu déjà travaillé pour quelqu’un ?', lead: 'Les activités difficiles sont pénalisées si tu débutes.', ok: A => has(A.experience),
      body: ctx => choices(ctx, 'experience', [{ v: 'aucune', t: 'Jamais' }, { v: 'projets', t: 'Des projets perso', s: 'Pour moi ou des proches' }, { v: 'clients', t: 'Oui, des clients payants' }]) },
    { id: 'aisanceVente', sec: 'Entreprise', when: E_, f: ['aisanceVente'], q: 'Contacter des inconnus pour leur proposer ton offre ?', lead: 'Certaines activités demandent beaucoup de démarchage. Cap en tient compte.', ok: A => has(A.aisanceVente),
      body: ctx => choices(ctx, 'aisanceVente', [{ v: 1, t: 'Ça me bloque' }, { v: 2, t: 'Ça va' }, { v: 3, t: 'J’aime ça' }]) },
    { id: 'risque', sec: 'Entreprise', when: E_, f: ['risque'], q: 'Quel risque acceptes-tu ?', lead: 'Risque faible : revenu modeste mais rapide. Risque élevé : plus long, plus incertain.', ok: A => has(A.risque),
      body: ctx => choices(ctx, 'risque', [{ v: 'faible', t: 'Faible' }, { v: 'moyen', t: 'Moyen' }, { v: 'eleve', t: 'Élevé' }]) },
    { id: 'formatPref', sec: 'Entreprise', when: E_, f: ['formatPref'], q: 'Plutôt en ligne ou près de chez toi ?', ok: A => has(A.formatPref),
      body: ctx => choices(ctx, 'formatPref', [{ v: 'en_ligne', t: 'En ligne' }, { v: 'local', t: 'Près de chez moi' }, { v: 'les_deux', t: 'Les deux me vont' }]) },
    // Bilan
    { id: 'bilan', sec: 'Bilan', f: [], q: 'Vérification de tes réponses', ok: () => true, cta: 'Créer mon plan', body: ctx => bilan(ctx) },
    { id: 'plan', sec: 'Bilan', f: ['objectifsPerso'], q: 'Ton plan', lead: 'Calculé à partir de tes réponses. Tu peux tout modifier, maintenant ou plus tard.', ok: () => true, cta: 'Commencer mon plan', body: ctx => planApercu(ctx) }
  ];
  const LIB_CHAMPS = { tempsLibre: 'temps libre', jours: 'séances voulues', minutes: 'durée', heuresProjet: 'heures projet', autreSport: 'autre sport', niveau: 'niveau', age: 'âge', materielSport: 'matériel', zonesDouleur: 'zones douloureuses', objectif: 'objectif', prioriteSport: 'priorité', obstacle: 'frein principal', lieu: 'lieu' };
  const STEP_BY_FIELD = {}; STEPS.forEach(s => s.f.forEach(f => { STEP_BY_FIELD[f] = s.id; })); STEP_BY_FIELD.cible = 'cible'; STEP_BY_FIELD.rythme = 'faisabilite';

  function faisabilite(ctx) {
    const A = ctx.A; const r = E.physique(A);
    if (!r.ok) return h('div', { class: 'note' }, r.message);
    const out = [];
    const st = { libre: ['Sans date précise', 'neutral'], realiste: ['Délai réaliste', 'good'], ambitieux: ['Délai ambitieux', 'warn'], trop_court: ['Délai trop court', 'warn'], medical: ['Avis médical nécessaire', 'bad'], dangereux: ['Objectif dangereux', 'bad'] }[r.statut] || ['', 'neutral'];
    out.push(h('div', null, h('span', { class: 'chip ' + st[1] }, st[0])));
    if (!r.planPossible) {
      out.push(h('div', { class: 'note' }, r.statut === 'dangereux'
        ? 'Passer de ' + kg(A.poids) + ' à ' + kg(A.cible) + ' représente ' + fr(r.ecartPct * 100, 0) + ' % de ton poids' + (r.imcCible < 18.5 ? ' et un IMC final de ' + fr(r.imcCible, 1) : '') + '. Ce n’est pas un objectif sûr. Cap ne calcule pas de programme pour cette cible : un médecin peut t’orienter vers une prise en charge adaptée.'
        : 'Ton poids cible donnerait un IMC de ' + fr(r.imcCible, 1) + ', sous 18,5. Un avis médical est nécessaire pour fixer une cible. Cap ne propose pas de chiffre à la place.'));
      out.push(h('div', { class: 'row-btns' }, h('button', { class: 'btn secondary small', type: 'button', onclick: () => ctx.goto('cible') }, 'Modifier mon objectif'), h('button', { class: 'btn tinted small', type: 'button', onclick: () => { A.objectif = 'maintenir'; A.cible = null; A.rythme = null; ctx.next(); } }, 'Passer en maintien')));
      return out;
    }
    const facts = h('div', { class: 'panel flush' },
      cellKV('Écart', (r.ecart > 0 ? '+' : '') + fr(r.ecart, 1) + ' kg'),
      r.requis !== null ? cellKV('Rythme demandé par ton délai', fr(r.requis, 2) + ' kg/sem') : null,
      cellKV('Rythme recommandé pour toi', fr(r.rec, 2) + ' kg/sem'),
      cellKV('Maximum prudent', fr(r.max, 2) + ' kg/sem'));
    out.push(facts);
    if (r.statut === 'trop_court') out.push(h('div', { class: 'note' }, 'Le délai choisi semble trop court pour cet objectif. Tu gardes ton ambition, mais le plan suivra un rythme plus progressif. Choisis-le :'));
    const opts = [];
    const sem = rate => { const x = E.physique(Object.assign({}, A, { rythme: rate })); return x.semaines; };
    opts.push({ v: r.rec, t: 'Recommandé · ' + fr(r.rec, 2) + ' kg/sem', s: '≈ ' + sem(r.rec) + ' semaines. Le plus facile à tenir.' });
    if (r.requis !== null && r.requis > r.rec + 0.01 && r.requis <= r.max) opts.push({ v: Math.round(r.requis * 100) / 100, t: 'Ton délai · ' + fr(r.requis, 2) + ' kg/sem', s: '≈ ' + sem(r.requis) + ' semaines. Plus exigeant.' });
    if (r.max > r.rec + 0.01) opts.push({ v: r.max, t: 'Soutenu · ' + fr(r.max, 2) + ' kg/sem', s: '≈ ' + sem(r.max) + ' semaines. Le maximum prudent.' });
    if (!opts.some(o => Math.abs(o.v - (A.rythme || -1)) < 1e-6)) A.rythme = null;
    out.push(choices(ctx, 'rythme', opts));
    if (r.mineur) out.push(h('p', { class: 'foot muted' }, 'Moins de 18 ans : rythme et écart calorique plafonnés pour protéger ta croissance.'));
    return out;
  }
  function cellKV(k, v) { return h('div', { class: 'cell' }, h('span', { class: 'lbl' }, k), h('span', { class: 'val num', style: 'color:var(--ink);font-weight:600' }, v)); }

  function issueView(i, onFix) {
    return h('div', { class: 'alert ' + i.niveau },
      icon(i.niveau === 'info' ? 'info' : 'alert'),
      h('div', { style: 'flex:1;min-width:0' }, h('h3', null, i.titre), h('p', null, i.texte),
        onFix && i.fixes.length ? h('div', { class: 'acts' }, i.fixes.map(f => h('button', { class: 'link', type: 'button', onclick: () => onFix(f.champ) }, f.label))) : null));
  }
  function bilan(ctx) {
    const A = ctx.A; const d = derive(A); const out = [];
    const list = d.issues;
    const bloq = list.filter(i => i.niveau === 'bloquant').length, att = list.filter(i => i.niveau === 'attention').length;
    out.push(h('div', { class: 'note' + (bloq ? '' : ' tint') }, bloq ? h('b', null, bloq + ' point' + (bloq > 1 ? 's' : '') + ' bloquant' + (bloq > 1 ? 's' : '') + '. ') : h('b', null, 'Tes réponses sont cohérentes. '), att ? att + ' point' + (att > 1 ? 's' : '') + ' à surveiller.' : (bloq ? '' : 'Rien à corriger.')));
    list.forEach(i => out.push(issueView(i, champ => ctx.goto(STEP_BY_FIELD[champ] || champ, true))));
    const rows = [];
    if (d.corps && d.phys && d.phys.ok) rows.push(cellKV('Calories par jour', d.phys.planPossible ? fr(d.phys.kcal) + ' kcal' : 'Maintien : ' + fr(d.phys.kcal) + ' kcal'));
    if (d.corps && d.prog && d.prog.ok) rows.push(cellKV('Séances par semaine', String(d.prog.seances.length)));
    if (d.argent && d.fin && d.fin.ok) rows.push(cellKV('Capacité d’épargne', eur(d.fin.capacite) + ' / mois'));
    if (rows.length) out.push(h('div', { class: 'sec' }, h('div', { class: 'cap' }, 'Aperçu'), h('div', { class: 'panel flush' }, rows)));
    return out;
  }
  function planApercu(ctx) {
    const d = derive(ctx.A); const out = [];
    if (d.corps && d.phys && d.phys.ok) {
      const cj = E.cibleJour(d.phys, ctx.A.objectifsPerso);
      const how = h('button', { class: 'link', type: 'button', onclick: () => sheet('Objectif calorique', h('ol', { class: 'calc' }, d.phys.calcul.map(l => h('li', null, l)))) }, 'Comment est-ce calculé ?');
      out.push(h('div', { class: 'sec' }, h('div', { class: 'cap' }, 'Nutrition'), h('div', { class: 'panel' },
        h('div', { class: 'hero' }, h('div', null, h('b', null, fr(cj.kcal)), h('span', null, ' kcal / jour')), h('span', { class: 'chip ' + (cj.perso ? 'info' : 'neutral') }, cj.perso ? 'Personnalisé' : 'Calculé')),
        h('div', { class: 'stats' }, h('div', { class: 'stat' }, h('b', null, cj.macros.prot + ' g'), h('span', null, 'Protéines')), h('div', { class: 'stat' }, h('b', null, cj.macros.glu + ' g'), h('span', null, 'Glucides')), h('div', { class: 'stat' }, h('b', null, cj.macros.lip + ' g'), h('span', null, 'Lipides'))),
        h('p', { class: 'foot muted' }, 'Eau : ' + fr(E.objectifEau(ctx.A.poids)) + ' ml par jour (repère : 30 ml par kg).' + (d.phys.planPossible && d.phys.semaines ? ' Objectif de poids : ≈ ' + d.phys.semaines + ' semaines au rythme choisi.' : '')),
        h('div', { class: 'row-btns' }, h('button', { class: 'btn small secondary', type: 'button', onclick: () => editerObjectifs(ctx.A, d.phys, () => ctx.rerender && ctx.rerender()) }, 'Modifier mes objectifs')), how)));
    }
    if (d.corps && d.prog && d.prog.ok) out.push(h('div', { class: 'sec' }, h('div', { class: 'cap' }, 'Entraînement'), h('div', { class: 'panel flush' }, d.prog.seances.length ? d.prog.planning.map(pl => { const se = d.prog.seances.find(x => x.cle === pl.seance); return cellKV(pl.jourNom + ' · ' + se.nom, se.duree + ' min'); }) : h('div', { class: 'cell' }, d.prog.note))));
    if (d.argent && d.fin && d.fin.ok) out.push(h('div', { class: 'sec' }, h('div', { class: 'cap' }, 'Argent'), h('div', { class: 'panel flush' },
      cellKV('Capacité d’épargne', eur(d.fin.capacite) + ' / mois'), cellKV('Étape en cours', d.fin.niveaux.intermediaire.titre), cellKV('Coût du projet', eur(d.fin.reve.total))),
      h('p', { class: 'foot muted', style: 'margin:0 4px' }, d.fin.niveaux.action.texte)));
    out.push(h('p', { class: 'foot muted' }, 'Ce sont des estimations, pas des garanties. Ton suivi réel les corrigera.'));
    return out;
  }
  // Objectifs quotidiens personnalisés, avec garde-fous du moteur
  function editerObjectifs(A, phys, apres, enregistrer) {
    const base = E.cibleJour(phys, A.objectifsPerso);
    const o = { kcal: base.kcal, p: base.macros.prot, c: base.macros.glu, f: base.macros.lip };
    const fld = (k, lbl) => { const i = h('input', { id: 'obj-' + k, inputmode: 'numeric', value: String(o[k]) }); i.addEventListener('input', () => { o[k] = parseFloat(i.value.replace(',', '.')); check(); }); return h('label', { class: 'field', for: 'obj-' + k }, lbl, i); };
    const msg = h('div', { class: 'err', role: 'alert' }), warn = h('p', { class: 'foot', style: 'color:var(--warn)' });
    const save = h('button', { class: 'btn', type: 'button' }, 'Utiliser ces objectifs');
    const check = () => { const v = E.validerObjectifsPerso(o, phys); msg.textContent = v.err.join(' '); warn.textContent = v.warn.join(' '); save.disabled = !v.ok; };
    let close;
    save.addEventListener('click', async () => { const val = { kcal: Math.round(o.kcal), p: Math.round(o.p), c: Math.round(o.c), f: Math.round(o.f) }; if (enregistrer) { try { await enregistrer(val); } catch (e) { msg.textContent = 'Échec, réessaie.'; return; } } else A.objectifsPerso = val; close(); if (apres) apres(); });
    const reset = h('button', { class: 'btn secondary', type: 'button', onclick: async () => { if (enregistrer) { try { await enregistrer(null); } catch (e) { return; } } else A.objectifsPerso = null; close(); if (apres) apres(); } }, 'Revenir aux valeurs calculées (' + fr(phys.kcal) + ' kcal)');
    close = sheet('Objectifs quotidiens', [h('p', { class: 'muted sub' }, 'Calculé pour toi : ' + fr(phys.kcal) + ' kcal, ' + phys.macros.prot + ' g de protéines, ' + phys.macros.glu + ' g de glucides, ' + phys.macros.lip + ' g de lipides. Minimum de sécurité : ' + phys.plancher + ' kcal.'), fld('kcal', 'Calories (kcal)'), h('div', { class: 'grid2' }, fld('p', 'Protéines (g)'), fld('c', 'Glucides (g)'), fld('f', 'Lipides (g)')), msg, warn, save, reset], { focus: false });
    check();
  }

  // ================================================================ Moteur du questionnaire
  let OB = null; // { A, idx, dir, returnTo, only }
  function visibleSteps(A, only) { return STEPS.filter(s => (!s.when || s.when(A)) && (!only || only.indexOf(s.id) >= 0 || s.id === 'bilan' || s.id === 'plan')); }
  function startOnboarding(A, opts) {
    opts = opts || {};
    const draft = !opts.fresh && store.get('cap-draft');
    OB = { A: Object.assign({}, A || {}, draft && !A ? draft.A : {}), idx: draft && !A ? draft.idx || 0 : 0, dir: 1, returnTo: null, only: opts.only || null, intro: opts.intro || null };
    OB.welcome = !A && !opts.only && OB.idx === 0;
    STEPS.forEach(s => s.init && s.init(OB.A));
    renderStep();
  }
  // Accueil cinématographique : scène d'obsidienne, le logo révélé par la lumière, une promesse, un seul geste.
  // Aucune liste de fonctions : la page dit ce que Cap fait pour la personne, le reste se découvre en avançant.
  function reflet(sheen) { if (reduced() || !sheen) return; sheen.classList.remove('run'); void sheen.offsetWidth; sheen.classList.add('run'); }
  function sheenPour(L) { const s = h('span', { class: 'lg-sheen', 'aria-hidden': 'true' }); const m = L.masque(); s.style.webkitMaskImage = m; s.style.maskImage = m; return s; }
  function scene(on) { document.body.classList.toggle('scene', !!on); }
  function renderWelcome() {
    const L = window.CapLogo;
    scene(true);
    const hero = h('button', { class: 'wl-hero-mark', type: 'button', 'aria-label': 'Cap', html: L.mark({ size: 168, mode: 'dark', cls: 'wl-big' }) });
    const sheen = sheenPour(L); hero.appendChild(sheen);
    hero.addEventListener('click', () => { reflet(sheen); if (window.CapSon) window.CapSon.jouer('selection'); });
    const sk = sparkle('Commencer', () => { if (window.CapSon) window.CapSon.jouer('ouverture'); OB.welcome = false; OB.dir = 1; renderStep(); });
    $app.textContent = '';
    $app.append(h('div', { class: 'ob wl' },
      h('div', { class: 'wl-brand', html: L.wordmark({ markSize: 22, mode: 'dark', color: 'var(--ink)' }) }),
      h('div', { class: 'wl-stage' }, h('span', { class: 'wl-halo', 'aria-hidden': 'true' }), hero),
      h('h1', { class: 'wl-title' }, 'Ta prochaine version commence ici.'),
      h('p', { class: 'wl-sub' }, 'Un plan construit autour de toi. Pour ton corps, ton argent et tes ambitions.'),
      h('div', { class: 'ob-bar' }, h('div', { class: 'in wl-cta' }, sk.el, h('p', { class: 'foot wl-foot' }, 'Environ 3 minutes. Tes réponses restent privées.')))));
    window.scrollTo(0, 0);
    setTimeout(() => reflet(sheen), 650);
  }
  // Introduction : sur fond d'obsidienne, le logo est d'abord invisible (noir sur noir) ; une lumière le balaie,
  // la matière apparaît (céramique et aluminium), le mot se pose, puis l'appli. Au plus toutes les 12 h, ~1,5 s,
  // un toucher la passe, absente si « Réduire les animations ».
  function intro() {
    if (reduced()) return;
    const last = Number(store.get('cap-intro') || 0);
    if (Date.now() - last < 12 * 3600e3) return;
    store.set('cap-intro', Date.now());
    const L = window.CapLogo;
    const sh = sheenPour(L); sh.classList.add('run');
    const ov = h('div', { class: 'intro', role: 'presentation', 'aria-hidden': 'true' },
      h('div', { class: 'intro-mark' }, h('span', { class: 'intro-metal', html: L.mark({ size: 132, mode: 'dark' }) }), sh),
      h('div', { class: 'intro-word' }, 'Cap'));
    let done = false;
    const fin = () => { if (done) return; done = true; ov.classList.add('out'); setTimeout(() => ov.remove(), 360); };
    ov.addEventListener('click', fin);
    document.body.appendChild(ov);
    setTimeout(fin, 1550);
  }
  function renderStep() {
    if (OB.welcome) { renderWelcome(); return; }
    scene(false);
    const vs = visibleSteps(OB.A, OB.only);
    OB.idx = Math.max(0, Math.min(OB.idx, vs.length - 1));
    const s = vs[OB.idx];
    if (s.init) s.init(OB.A);
    if (OB.lastSec && OB.lastSec !== s.sec && OB.dir > 0) if (window.CapSon) window.CapSon.jouer('etape');
    OB.lastSec = s.sec;
    store.set('cap-draft', { A: OB.A, idx: OB.idx });
    const ctx = makeCtx(s);
    const sk = s.id === 'plan' && !OB.returnTo ? sparkle(s.cta, () => ctx.next()) : null;
    const nextBtn = sk ? sk.btn : h('button', { class: 'btn', type: 'button', onclick: () => ctx.next() }, OB.returnTo ? 'Revenir au bilan' : (s.cta || 'Continuer'));
    const skipBtn = s.optional ? h('button', { class: 'btn text', type: 'button', onclick: () => { s.f.forEach(f => { OB.A[f] = null; }); ctx.next(true); } }, 'Passer') : null;
    const err = h('div', { class: 'err', role: 'alert', style: 'text-align:center' });
    ctx.refreshCta = () => {
      const msg = s.check ? s.check(OB.A) : null;
      const vErr = s.f.map(f => E.valider(f, OB.A[f])).filter(Boolean)[0];
      const okTouch = !s.touch || ctx.touch === undefined || ctx.touch() || has(OB.A[s.f[0]]);
      err.textContent = msg || vErr || '';
      nextBtn.disabled = !s.ok(OB.A) || !!msg || !!vErr || !okTouch;
    };
    const content = h('div', { class: 'content' }, s.body(ctx));
    const back = h('button', { class: 'round glass press', type: 'button', 'aria-label': 'Question précédente', onclick: () => ctx.prev() }, icon('back'));
    back.hidden = (OB.idx === 0 && !OB.returnTo) || s.auto;
    const shownSteps = vs.filter(x => !x.auto).length;
    const top = h('div', { class: 'ob-top' }, back, h('div', { class: 'prog' }, h('div', { class: 'track', role: 'progressbar', 'aria-valuemin': 1, 'aria-valuemax': shownSteps, 'aria-valuenow': Math.min(OB.idx + 1, shownSteps) }, h('i', { style: 'width:' + Math.round(Math.min(OB.idx + 1, shownSteps) / shownSteps * 100) + '%' })), h('small', null, s.auto ? '' : s.sec + ' · ' + Math.min(OB.idx + 1, shownSteps) + ' sur ' + shownSteps)));
    const stage = h('div', { class: 'stage ' + (OB.dir > 0 ? 'in-r' : 'in-l') },
      OB.intro && OB.idx === 0 ? h('div', { class: 'note tint' }, OB.intro) : null,
      s.q && !s.auto ? h('h1', null, s.q) : null, s.lead ? h('p', { class: 'lead' }, s.lead) : null, pourquoiQuestion(s), content);
    const bar = h('div', { class: 'ob-bar' }, h('div', { class: 'in glass' }, err, sk ? sk.el : nextBtn, skipBtn));
    bar.hidden = !!s.auto;
    $app.textContent = '';
    $app.append(h('div', { class: 'ob' }, top, stage), bar);
    ctx.refreshCta();
    window.scrollTo(0, 0);
  }
  // « Pourquoi cette question ? » : l'utilité déclarée dans le registre des questions (matrice.js), vérifiée par les tests.
  function pourquoiQuestion(s) {
    const M = window.CapMatrice; if (!M || s.auto || s.id === 'bilan' || s.id === 'plan') return null;
    const q = M.REGISTRE.find(x => x.id === s.id) || M.REGISTRE.find(x => (s.f || []).indexOf(x.variable) >= 0);
    if (!q || !q.utilite) return null;
    return h('details', { class: 'ob-pq' }, h('summary', null, 'Pourquoi cette question ?'), h('p', null, q.utilite), s.optional ? h('p', { class: 'foot muted' }, 'Facultatif : tu peux passer, Cap utilisera une hypothèse prudente et te le dira.') : null);
  }
  function makeCtx(s) {
    const ctx = {
      A: OB.A, onChange: [],
      changed() { ctx.onChange.forEach(f => f()); if (ctx.refreshCta) ctx.refreshCta(); store.set('cap-draft', { A: OB.A, idx: OB.idx }); },
      next(skipped) {
        if (s.id === 'plan') { finishOnboarding(); return; }
        if (OB.returnTo) { const vs = visibleSteps(OB.A, OB.only); const i = vs.findIndex(x => x.id === OB.returnTo); OB.returnTo = null; OB.idx = i >= 0 ? i : OB.idx + 1; OB.dir = 1; renderStep(); return; }
        if (s.id === 'bilan' && !OB.only) { revelation(OB.A, () => { OB.idx++; OB.dir = 1; renderStep(); }); return; }
        OB.idx++; OB.dir = 1; renderStep();
      },
      prev() { if (OB.returnTo) { const vs = visibleSteps(OB.A, OB.only); OB.idx = vs.findIndex(x => x.id === OB.returnTo); OB.returnTo = null; } else OB.idx--; OB.dir = -1; renderStep(); },
      goto(id, fromBilan) { const vs = visibleSteps(OB.A, OB.only); const i = vs.findIndex(x => x.id === id); if (i < 0) return; if (fromBilan || s.id === 'faisabilite') OB.returnTo = s.id; OB.idx = i; OB.dir = -1; renderStep(); },
      finish: () => finishOnboarding(),
      rerender: () => renderStep()
    };
    return ctx;
  }
  // Révélation du programme : chaque ligne correspond à un calcul réellement exécuté à cet instant par le moteur Cap
  // (aucune barre de progression simulée). Les résultats sont posés un par un pour être lus (≈ 0,35 s chacun),
  // un toucher affiche tout, « Réduire les animations » affiche tout d'un coup.
  function etapesRevelation(A) {
    const d = derive(A), et = [];
    const champs = Object.keys(A).filter(k => k[0] !== '_' && has(A[k]) && A[k] !== '').length;
    et.push({ t: 'Comprendre', r: champs + ' réponses lues' + (d.corps && d.argent ? ', corps et argent' : d.corps ? ', côté corps' : d.argent ? ', côté argent' : '') + '.' });
    const calc = [];
    if (d.corps && d.phys && d.phys.ok) calc.push(fr(E.cibleJour(d.phys, A.objectifsPerso).kcal) + ' kcal par jour');
    if (d.argent && d.fin && d.fin.ok) calc.push(eur(d.fin.capacite) + ' d’épargne possible par mois');
    if (calc.length) et.push({ t: 'Calculer', r: calc.join(', ') + '.' });
    const cons = [];
    if (d.corps && d.prog && d.prog.ok) cons.push(d.prog.seances.length ? d.prog.planning.length + ' séances par semaine' : 'repos et mobilité');
    if (d.argent && d.fin && d.fin.ok && d.fin.reve) cons.push('un projet chiffré à ' + eur(d.fin.reve.total));
    if (cons.length) et.push({ t: 'Construire', r: cons.join(', ') + '.' });
    const err = STEPS.reduce((n, st) => n + (st.f || []).filter(f => E.valider(f, A[f])).length, 0);
    const garde = d.corps && d.phys && d.phys.ok && d.phys.plancher ? ' Plancher de sécurité : ' + fr(d.phys.plancher) + ' kcal par jour.' : '';
    et.push({ t: 'Vérifier', r: (err ? err + ' réponse' + (err > 1 ? 's' : '') + ' à revoir.' : 'Réponses cohérentes.') + garde, alerte: err > 0 });
    et.push({ t: 'Révéler', r: 'Ouvre ton plan pour le découvrir.' });
    return et;
  }
  function revelation(A, suite) {
    const et = etapesRevelation(A);
    scene(true);
    const L = window.CapLogo;
    const liste = h('ol', { class: 'rv-list' });
    let i = 0, fini = false, timer = null;
    const poser = () => {
      if (i >= et.length) { termine(); return; }
      const e = et[i++];
      liste.append(h('li', { class: 'rv-item' + (e.alerte ? ' alerte' : '') }, h('b', null, e.t), h('span', null, e.r)));
      timer = setTimeout(poser, 380);
    };
    const titre = h('h1', { class: 'rv-title', 'aria-live': 'polite' }, 'Ton plan se construit.');
    const btn = h('button', { class: 'btn rv-go', type: 'button', disabled: true, onclick: () => { scene(false); suite(); } }, 'Voir mon plan');
    const termine = () => { if (fini) return; fini = true; clearTimeout(timer); while (i < et.length) { const e = et[i++]; liste.append(h('li', { class: 'rv-item' + (e.alerte ? ' alerte' : '') }, h('b', null, e.t), h('span', null, e.r))); } btn.disabled = false; titre.textContent = 'Ton plan est prêt.'; if (window.CapSon) window.CapSon.jouer('programme'); };
    $app.textContent = '';
    const page = h('div', { class: 'ob rv', onclick: e => { if (e.target !== btn) termine(); } },
      h('div', { class: 'rv-mark', 'aria-hidden': 'true', html: L.mark({ size: 56, mode: 'dark' }) }),
      titre,
      h('p', { class: 'rv-sub' }, 'Ce que Cap vient de calculer à partir de tes réponses :'),
      liste,
      h('div', { class: 'ob-bar' }, h('div', { class: 'in wl-cta' }, btn)));
    $app.append(page);
    window.scrollTo(0, 0);
    if (reduced()) termine(); else poser();
  }
  async function finishOnboarding() {
    const A = Object.assign({}, OB.A); delete A._dom;
    const now = new Date().toISOString();
    const data = Object.assign({}, S.profil && S.profil.v === 2 ? S.profil : {}, A, { v: 2, creeLe: (S.profil && S.profil.v === 2 && S.profil.creeLe) || now, majLe: now });
    try {
      await archiverProfil('questionnaire');
      await put('profil', 'main', data);
      if (C(A) && has(A.poids) && !S.pesees.some(p => p.date === dayId())) await put('pesees', dayId(), Object.assign({ date: dayId(), poids: A.poids }, has(A.tour) ? { tour: A.tour } : {}));
      S.profil = data; store.del('cap-draft'); OB = null; tab = 'today'; refresh(); toast('Plan enregistré'); if (window.CapSon) window.CapSon.jouer('programme');
    } catch (e) { toast('Échec de l’enregistrement. Vérifie ta connexion et réessaie.'); }
  }

  // ================================================================ Panneaux
  function sheet(title, body, opts) {
    opts = opts || {};
    let closed = false;
    const close = () => { if (closed) return; closed = true; document.removeEventListener('keydown', esc); if (opts.onClose) opts.onClose(); if (reduced()) { scrim.remove(); return; } scrim.classList.add('closing'); setTimeout(() => scrim.remove(), 220); };
    const esc = e => { if (e.key === 'Escape') close(); };
    const closeBtn = h('button', { class: 'round glass press', type: 'button', 'aria-label': 'Fermer', onclick: close, style: 'width:34px;height:34px' }, icon('close'));
    const sh = h('div', { class: 'sheet glass', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'sheet-h' }, h('div', { class: 'grab' }), h('span', { style: 'width:34px' }), h('h2', null, title), closeBtn),
      h('div', { class: 'sheet-b' }, body));
    const scrim = h('div', { class: 'scrim', onclick: e => { if (e.target === scrim) close(); } }, sh);
    document.body.appendChild(scrim); document.addEventListener('keydown', esc);
    setTimeout(() => { const f = sh.querySelector('input,button.choice,.ruler-track'); if (f && opts.focus !== false) f.focus({ preventScroll: true }); }, 50);
    return close;
  }
  // Modifier une réponse depuis les Réglages : même écran que le questionnaire, recalcul immédiat
  function editStep(id, draft) {
    const s = STEPS.find(x => x.id === id); if (!s) return;
    const A = Object.assign({}, S.profil, draft || {}); if (s.init) s.init(A);
    const ctx = { A, onChange: [], changed() { ctx.onChange.forEach(f => f()); refreshBtn(); }, goto(other) { close(); editStep(other); }, next() { save(); }, rerender() { const keep = Object.assign({}, A); close(); editStep(id, keep); } };
    const err = h('div', { class: 'err', role: 'alert' });
    const saveBtn = h('button', { class: 'btn', type: 'button' }, 'Enregistrer');
    const refreshBtn = () => { const msg = (s.check && s.check(A)) || s.f.map(f => E.valider(f, A[f])).filter(Boolean)[0]; err.textContent = msg || ''; saveBtn.disabled = !s.ok(A) || !!msg; };
    let close;
    const save = async () => {
      const patch = {};
      Object.keys(A).forEach(k => { if (k[0] !== '_' && JSON.stringify(A[k]) !== JSON.stringify(S.profil[k])) patch[k] = A[k] === undefined ? null : A[k]; });
      s.f.forEach(f => { if (A[f] === undefined) patch[f] = null; });
      if ((id === 'objectif' || id === 'cible' || id === 'delai') && Object.keys(patch).length) patch.rythme = null;
      try { await saveProfil(patch); close(); toast('Enregistré · plan recalculé'); const missing = missingSteps(); if (missing.length) startOnboarding(Object.assign({}, S.profil), { only: missing, fresh: true, intro: 'Quelques réponses manquent pour recalculer ton plan.' }); }
      catch (e) { err.textContent = 'Échec de l’enregistrement, réessaie.'; }
    };
    saveBtn.addEventListener('click', save);
    const body = [s.lead ? h('p', { class: 'muted sub' }, s.lead) : null, h('div', { class: 'content', style: 'padding-top:0' }, s.body(ctx)), err, saveBtn];
    close = sheet(s.q || 'Modifier', body);
    refreshBtn();
  }
  function missingSteps() {
    const A = S.profil || {};
    return STEPS.filter(s => (!s.when || s.when(A)) && !s.optional && !s.auto && s.id !== 'bilan' && !s.ok(A)).map(s => s.id);
  }

  // ================================================================ Tableau de bord
  let tab = 'today', lastTab = null;
  function refresh() {
    if (OB) return;
    if (!S.profil) { startOnboarding(null); return; }
    if (S.profil.v !== 2) { startOnboarding(migrate(S.profil), { fresh: true, intro: 'Nouvelle version de Cap. Tes réponses précédentes sont pré-remplies : vérifie-les, surtout ton âge.' }); return; }
    renderMain();
  }
  function migrate(v1) {
    const map = { appart: 'appart', urus: 'appart_urus', villa: 'autre', autre: 'autre' };
    const A = { domaines: ['corps', 'argent'], sexe: v1.sexe, taille: v1.taille, poids: v1.poids, objectif: v1.objectif, cible: v1.objectif === 'maintenir' ? null : v1.cible,
      revenus: v1.revenu, epargne: v1.epargne, reve: map[v1.but], reveMontant: v1.but === 'villa' ? 2500000 : v1.butMontant, reveAnnee: v1.annee, heuresProjet: v1.heures ? Number(v1.heures) * 7 : undefined };
    Object.keys(A).forEach(k => { if (A[k] === undefined || A[k] === null) delete A[k]; });
    return A;
  }
  // ================================================================ Navigation : 5 destinations au plus
  // Aujourd'hui · Parcours (Corps, Argent, Projet) · ＋ (action centrale) · Journal (si Corps) · Profil.
  // Les anciens onglets (prog, corps, argent, projet, reglages, today) sont redirigés : aucun lien interne ne casse.
  // Destinations (5 au plus) : Aujourd'hui · Corps (Programme, Journal, Évolution) · ＋ · Avenir (Business, Finances) · Profil.
  // Le coach est accessible depuis l'en-tête de chaque écran. Anciennes destinations redirigées.
  const ANCIENS = { prog: ['corps', 'programme'], seance: ['corps', 'programme'], progression: ['corps', 'evolution'], photos: ['corps', 'evolution'], journal: ['corps', 'journal'], argent: ['avenir', 'finances'], finances: ['avenir', 'finances'], projet: ['avenir', 'business'], business: ['avenir', 'business'], reglages: ['profil'], parcours: ['corps'] };
  let parcours = Object.assign({ corps: 'programme', avenir: null, evo: 'mesures' }, store.get('cap-parcours') || {});
  function aller(dest, mod, sous) {
    // compatibilité : aller('parcours', 'corps'|'argent'|'projet', sous)
    if (dest === 'parcours') { if (mod === 'argent') { dest = 'avenir'; sous = 'finances'; } else if (mod === 'projet') { dest = 'avenir'; sous = 'business'; } else { dest = 'corps'; sous = sous === 'seance' ? 'programme' : sous === 'progression' ? 'evolution' : sous === 'photos' ? (parcours.evo = 'photos', 'evolution') : sous; } }
    else if (ANCIENS[dest]) { const a = ANCIENS[dest]; if (dest === 'photos') parcours.evo = 'photos'; if (dest === 'progression') parcours.evo = 'mesures'; dest = a[0]; sous = sous || a[1]; }
    tab = dest;
    if (sous && dest === 'corps') parcours.corps = sous;
    if (sous && dest === 'avenir') parcours.avenir = sous;
    store.set('cap-parcours', parcours);
    renderMain(); window.scrollTo(0, 0);
  }
  function modulesActifs(d) { return [d.corps ? ['corps', 'Corps'] : null, d.argent ? ['argent', 'Argent'] : null, d.entreprise && window.CapProjet ? ['projet', 'Projet'] : null].filter(Boolean); }
  // Sélecteur segmenté accessible (radiogroupe) : flèches gauche/droite, état annoncé
  function segments(items, actif, onPick, label, cls) {
    const g = h('div', { class: 'segs ' + (cls || ''), role: 'tablist', 'aria-label': label });
    items.forEach((it, i) => g.appendChild(h('button', { type: 'button', role: 'tab', 'aria-selected': String(it[0] === actif), tabindex: it[0] === actif ? '0' : '-1', class: it[0] === actif ? 'on' : '',
      onclick: () => { if (it[0] !== actif) onPick(it[0]); },
      onkeydown: e => { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; e.preventDefault(); const n = items[(i + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length]; onPick(n[0]); setTimeout(() => { const b = document.querySelector('.segs.' + (cls || 'x') + ' [aria-selected="true"]'); if (b) b.focus(); }, 0); } }, it[1])));
    return g;
  }
  // Retire l'en-tête d'une vue de module (le titre est porté par Parcours) et garde son action contextuelle
  function sansTitre(arr) {
    const out = [].concat(arr || []); let act = null;
    if (out[0] && out[0].classList && out[0].classList.contains('lt')) { const hd = out.shift(); act = hd.children[1] || null; }
    return { corps: out, action: act };
  }
  function enTete(titre, mod, action, sous, d) {
    const coach = h('button', { class: 'round press pc-coach', type: 'button', 'aria-label': 'Ouvrir le coach', onclick: () => ouvrirCoach(d) }, icon('chat'));
    return h('header', { class: 'pc-head mod-' + mod }, h('div', { class: 'pc-row' }, h('h1', null, titre), h('div', { class: 'pc-acts' }, action, coach)), sous || null);
  }
  function ouvrirCoach(d) { if (window.CapCoach) window.CapCoach.ouvrir(d || derive()); else if (window.CapJournal) window.CapJournal.coach(d || derive()); }
  function viewCorps(d) {
    if (!d.corps) return [largeTitle('Corps'), h('div', { class: 'vide' }, h('p', null, 'Le module Corps n’est pas activé.'), h('button', { class: 'btn', type: 'button', onclick: () => editStep('domaines') }, 'Choisir mes modules'))];
    const SOUS = [['programme', 'Programme'], ['journal', 'Journal'], ['evolution', 'Évolution']];
    if (!SOUS.some(x => x[0] === parcours.corps)) parcours.corps = 'programme';
    let v;
    if (parcours.corps === 'programme') v = sansTitre(viewProg(d));
    else if (parcours.corps === 'journal') v = sansTitre(window.CapJournal.viewJournal(d));
    else {
      const EVO = [['mesures', 'Mesures'], ['photos', 'Photos']].filter(x => x[0] !== 'photos' || window.CapPhotos);
      if (!EVO.some(x => x[0] === parcours.evo)) parcours.evo = 'mesures';
      v = sansTitre(parcours.evo === 'photos' ? window.CapPhotos.view(d) : window.CapJournal.viewProgres(d));
      v.corps.unshift(segments(EVO, parcours.evo, k => { parcours.evo = k; store.set('cap-parcours', parcours); renderMain(); }, 'Mesures ou photos', 'evo'));
    }
    return [enTete('Corps', 'corps', v.action, segments(SOUS, parcours.corps, k => aller('corps', null, k), 'Vue du corps', 'sous'), d)].concat(v.corps);
  }
  function viewAvenir(d) {
    const mods = [d.entreprise && window.CapProjet ? ['business', 'Business'] : null, d.argent ? ['finances', 'Finances'] : null].filter(Boolean);
    if (!mods.length) return [largeTitle('Avenir'), h('div', { class: 'vide' }, h('p', null, 'Ni Business ni Finances ne sont activés.'), h('button', { class: 'btn', type: 'button', onclick: () => editStep('domaines') }, 'Choisir mes modules'))];
    if (!mods.some(m => m[0] === parcours.avenir)) parcours.avenir = mods[0][0];
    const v = sansTitre(parcours.avenir === 'business' ? window.CapProjet.view(d) : viewArgent(d));
    return [enTete(mods.length > 1 ? 'Avenir' : mods[0][1], parcours.avenir === 'business' ? 'projet' : 'argent', v.action, mods.length > 1 ? segments(mods, parcours.avenir, k => aller('avenir', null, k), 'Business ou finances', 'mods') : null, d)].concat(v.corps);
  }
  // Action centrale : ce qu'on peut ajouter, selon les modules actifs
  function menuCentral(d) {
    let close; const go = fn => () => { close(); setTimeout(fn, 60); };
    const J = window.CapJournal, tiles = []; let ti = 0;
    const tile = (ic, t, s2, fn, mod) => tiles.push(h('button', { class: 'tile press mod-' + mod, type: 'button', onclick: go(fn), style: 'animation-delay:' + (ti++ * 30) + 'ms' }, h('span', { class: 'tile-i' }, icon(ic)), h('b', null, t), s2 ? h('small', null, s2) : null));
    if (d.corps) {
      tile('search', 'Repas', 'Rechercher, favoris', () => J.ajouter('aliment'), 'corps');
      tile('camera', 'Scanner un plat', window.CapAI && window.CapAI.photoDispo() ? 'Estimation à vérifier' : 'Indisponible ici', () => J.ajouter('scan'), 'corps');
      tile('drop', 'Eau', '+250 ml', () => J.ajouter('eau'), 'corps');
      tile('run', 'Activité', 'Sport, marche', () => J.ajouter('activite', d), 'corps');
      tile('scale', 'Pesée', 'Poids, tour de taille', () => addPesee(), 'corps');
      if (window.CapPhotos) tile('image', 'Photo du corps', 'Privée', () => window.CapPhotos.ajouter(), 'corps');
    }
    if (d.argent) tile('wallet', 'Épargne', 'Mis de côté ou retiré', () => addMouvement(d), 'argent');
    if (d.entreprise && window.CapProjet) tile('building', 'Vente', 'Montant encaissé', () => window.CapProjet.vente(), 'projet');
    close = sheet('Ajouter', [h('div', { class: 'tiles' }, tiles)], { focus: false });
  }
  let enRendu = false, aRefaire = false;
  function renderMain() {
    if (enRendu) { aRefaire = true; return; } // une écriture pendant un rendu relance un rendu propre ensuite
    enRendu = true;
    try { renderMain0(); } finally { enRendu = false; }
    if (aRefaire) { aRefaire = false; window._keepScroll = true; setTimeout(renderMain, 0); }
  }
  function renderMain0() {
    appliquerAnim();
    const d = derive();
    if (ANCIENS[tab]) { const a = ANCIENS[tab]; tab = a[0]; if (a[1] && tab === 'corps') parcours.corps = a[1]; if (a[1] && tab === 'avenir') parcours.avenir = a[1]; }
    const dests = [['today', 'Aujourd’hui', 'home'], d.corps ? ['corps', 'Corps', 'dumbbell'] : null, ['plus'], d.argent || d.entreprise ? ['avenir', 'Avenir', 'compass'] : null, ['profil', 'Profil', 'person']].filter(Boolean);
    if (!dests.some(t => t[0] === tab)) tab = 'today';
    const views = { today: d2 => window.CapAccueil.view(d2), corps: viewCorps, avenir: viewAvenir, profil: viewReglages };
    const scrollY = window.scrollY;
    const changed = lastTab !== tab; lastTab = tab;
    $app.textContent = '';
    $app.append(h('main', { class: 'screen scr-' + tab + (changed && !reduced() ? ' enter' : '') }, views[tab](d)));
    if (!db) $app.querySelector('main').appendChild(h('p', { class: 'foot muted mode-note' }, window.CapCloud && window.CapCloud.configure() ? 'Tes données sont sur cet appareil uniquement. Connecte ton compte Cap dans Profil pour les sauvegarder et les synchroniser.' : 'Tes données sont enregistrées sur ce téléphone uniquement. Le scan photo et le coach ne sont disponibles que dans l’appli Claude.'));
    const btns = dests.map(t => t[0] === 'plus'
      ? h('button', { type: 'button', class: 'nav-plus', 'aria-label': 'Ajouter', onclick: () => menuCentral(d) }, icon('plus'))
      : h('button', { type: 'button', class: 'nav-d', 'aria-current': t[0] === tab ? 'page' : null, onclick: () => { if (tab !== t[0]) aller(t[0]); } }, icon(t[2]), h('span', null, t[1])));
    $app.append(h('nav', { class: 'tabbar nav5', 'aria-label': 'Navigation principale' }, h('div', { class: 'in' }, btns)));
    animerNombres($app);
    if (window._keepScroll) { window.scrollTo(0, scrollY); window._keepScroll = false; }
  }
  const largeTitle = (t, s, right) => h('header', { class: 'lt', style: right ? 'flex-direction:row;align-items:flex-end;justify-content:space-between' : '' }, h('div', null, h('h1', null, t), s ? h('p', null, s) : null), right || null);
  const section = (title, hint, ...kids) => h('section', { class: 'sec' }, title ? h('h2', null, title) : null, hint ? h('p', { class: 'hint' }, hint) : null, kids);
  const howBtn = (title, lines, extra) => h('button', { class: 'link', type: 'button', onclick: () => sheet(title, [h('ol', { class: 'calc' }, lines.map(l => h('li', null, l))), extra || null]) }, 'Comment est-ce calculé ?');

  // Accueil, journal et progrès : journal.js
  function confirmDel(fn) { const close = sheet('Supprimer ?', [h('p', { class: 'muted sub' }, 'Cette donnée sera supprimée définitivement.'), h('button', { class: 'btn', style: 'background:var(--bad)', type: 'button', onclick: async () => { try { await fn(); close(); toast('Supprimé'); } catch (e) { toast('Échec, réessaie'); } } }, 'Supprimer'), h('button', { class: 'btn secondary', type: 'button', onclick: () => close() }, 'Annuler')]); }
  function addPesee() {
    const A = { poids: (E.tendance(S.pesees).dernier || {}).poids || (S.profil || {}).poids, tour: null, date: dayId() };
    const ctx = { A, onChange: [], changed() {} };
    const lb = unite() === 'lb', k = lb ? LB : 1;
    const r = Ruler({ min: lb ? 66 : 30, max: lb ? 660 : 300, step: 0.1, decimals: 1, unit: lb ? 'lb' : 'kg', label: 'Poids', value: A.poids ? Math.round(A.poids * k * 10) / 10 : undefined, start: 70 * k, onChange: v => { A.poids = Math.round(v / k * 100) / 100; } });
    const t = Ruler({ min: 40, max: 200, step: 0.5, decimals: 1, unit: 'cm', label: 'Tour de taille (facultatif)', start: (S.profil || {}).tour || 80, labelDecimals: 0, onChange: v => { A.tour = v; } });
    const dt = h('input', { id: 'p-date', type: 'date', value: dayId(), max: dayId() });
    const note = h('input', { id: 'p-note', maxlength: '100', placeholder: 'Facultatif : sommeil, repas salé, cycle…' });
    const err = h('div', { class: 'err', role: 'alert' });
    let close;
    const save = h('button', { class: 'btn', type: 'button', onclick: async () => {
      if (!r.isTouched() && !A.poids) { err.textContent = 'Indique ton poids.'; return; }
      A.poids = Math.round(r.value() / k * 100) / 100; const body = { date: dt.value || dayId(), poids: A.poids }; if (t.isTouched()) body.tour = t.value(); if (note.value.trim()) body.note = note.value.trim().slice(0, 100);
      const avant = S.profil ? E.jalons(S.pesees, S.profil.poids, S.profil.cible || S.profil.poids, 0).length : 0;
      try {
        await put('pesees', body.date, body); close(); toast('Pesée enregistrée');
        const apres = S.profil ? E.jalons(S.pesees.filter(x => x.date !== body.date).concat([body]), S.profil.poids, S.profil.cible || S.profil.poids, 0).length : 0;
        if (window.CapSon) window.CapSon.jouer(apres > avant ? 'objectif' : 'valider');
      } catch (e) { err.textContent = 'Échec, réessaie.'; }
    } }, 'Enregistrer');
    close = sheet('Nouvelle pesée', [h('p', { class: 'muted sub' }, 'Le matin, à jeun, une fois par semaine. Le chiffre d’un jour n’est pas une tendance : l’eau et le sel le font varier de 1 à 2 kg.'), r.el, t.el, h('label', { class: 'field', for: 'p-date' }, 'Date', dt), h('label', { class: 'field', for: 'p-note' }, 'Note', note), err, save]);
  }
  // ---------- Programme : la séance du jour (ou la prochaine) d'abord ; la semaine en lignes ; limites distinctes des conseils
  // Séance d'un jour donné, en tenant compte des reports (prefs.reports = { jourDOrigine: { vers, cle } })
  function seanceDu(pr, date) {
    const reps = (S.prefs && S.prefs.reports) || {};
    const arrivee = Object.keys(reps).find(k => reps[k] && reps[k].vers === date);
    if (arrivee) { const se = pr.seances.find(x => x.cle === reps[arrivee].cle); if (se) return { se, reportee: arrivee }; }
    if (reps[date]) return null;
    const j = new Date(date + 'T12:00').getDay(), pl = pr.planning.find(x => x.jour === j);
    return pl ? { se: pr.seances.find(x => x.cle === pl.seance), pl } : null;
  }
  function prochaineSeance(pr) {
    const t = dayId();
    for (let k = 0; k < 8; k++) { const dt = E.shift ? E.shift(t, k) : new Date(Date.parse(t + 'T12:00:00Z') + k * 864e5).toISOString().slice(0, 10); const x = seanceDu(pr, dt); if (x && x.se) return { se: x.se, pl: x.pl || { jourNom: new Date(dt + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long' }) }, dans: k, date: dt, reportee: x.reportee }; }
    return null;
  }
  async function reporterSeance(se) {
    const t = dayId(), demain = new Date(Date.parse(t + 'T12:00:00Z') + 864e5).toISOString().slice(0, 10);
    const reps = Object.assign({}, (S.prefs && S.prefs.reports) || {});
    if (reps[demain] || seanceDu(derive().prog, demain)) { toast('Demain a déjà une séance : garde un jour de repos entre les deux.'); return; }
    reps[t] = { vers: demain, cle: se.cle };
    try { await savePrefs({ reports: reps }); toast('Séance reportée à demain'); } catch (e) { toast('Échec, réessaie'); }
  }
  function lancerSeance(se) { return window.CapSeance ? window.CapSeance.ouvrir(se) : logSeance(se); }
  function detailSeance(se) {
    let close;
    close = sheet(se.nom, [h('p', { class: 'muted sub' }, se.duree + ' min · ' + se.objectif),
      se.justification ? h('p', { class: 'sub' }, h('b', null, 'Pourquoi cette séance : '), se.justification) : null,
      se.echauffement && se.echauffement !== 'Aucun' ? h('p', { class: 'foot muted' }, 'Échauffement : ' + se.echauffement) : null,
      h('ol', { class: 'pg-ex' }, se.exercices.map(e => h('li', null, h('div', { class: 'pg-ex-l' }, h('b', null, e.nom), h('span', { class: 'num' }, e.type === 'cardio' ? e.reps : e.series + ' × ' + e.reps)),
        h('small', null, [e.repos ? 'Repos ' + e.repos + ' s' : null, 'Alternative : ' + (e.alternative || 'aucune avec ton matériel'), e.consigne || null, e.raison ? 'Pourquoi : ' + e.raison : null, e.horsBibliotheque ? 'Hors bibliothèque, non vérifié par Cap' : null].filter(Boolean).join(' · '))))),
      h('div', { class: 'ia-actions' }, h('button', { class: 'btn', type: 'button', onclick: () => { close(); setTimeout(() => lancerSeance(se), 60); } }, 'Commencer'), h('button', { class: 'btn secondary', type: 'button', onclick: () => logSeance(se) }, 'Déjà faite'))], { focus: false });
  }
  function viewProg(d) {
    const pr = d.prog;
    const out = [largeTitle('Séance')];
    if (!pr || !pr.ok) { out.push(h('div', { class: 'vide' }, h('p', null, 'Il manque des réponses pour construire ton programme.'), h('button', { class: 'btn', type: 'button', onclick: () => startOnboarding(Object.assign({}, S.profil), { only: missingSteps(), fresh: true }) }, 'Compléter mes réponses'))); return out; }
    if (!pr.seances.length) { out.push(h('div', { class: 'vide' }, h('p', null, pr.note), h('button', { class: 'btn', type: 'button', onclick: () => editStep('jours') }, 'Ajouter des séances'))); return out; }
    const a = d.adapt, viaIA = pr.origine === 'ia_validee', t = dayId();
    const nx = prochaineSeance(pr), faiteAuj = S.seances.some(l => l.date === t);
    // 1. La séance qui compte
    if (nx) {
      const auj = nx.dans === 0, se = nx.se;
      const reporteeAuj = ((S.prefs && S.prefs.reports) || {})[t];
      const quand = auj ? (faiteAuj ? 'Faite aujourd’hui' : 'Aujourd’hui' + (nx.reportee ? ' (reportée)' : '')) : nx.dans === 1 ? (reporteeAuj ? 'Reportée à demain' : 'Demain') : nx.pl.jourNom;
      out.push(h('section', { class: 'pg-hero mod-corps' + (auj && faiteAuj ? ' faite' : ''), 'aria-labelledby': 'pg-hero-t' },
        h('p', { class: 'pg-quand' }, quand),
        h('h2', { id: 'pg-hero-t', class: 'pg-nom' }, se.nom),
        h('p', { class: 'pg-meta' }, se.duree + ' min · ' + se.exercices.length + ' exercices · ' + se.objectif),
        h('div', { class: 'pg-acts' },
          auj && !faiteAuj ? h('button', { class: 'btn pg-go', type: 'button', onclick: () => lancerSeance(se) }, 'Commencer la séance') : h('button', { class: 'btn secondary', type: 'button', onclick: () => detailSeance(se) }, 'Voir la séance'),
          auj && !faiteAuj ? h('div', { class: 'pg-sec' }, h('button', { class: 'btn text', type: 'button', onclick: () => logSeance(se) }, 'Déjà faite'), nx.reportee ? null : h('button', { class: 'btn text', type: 'button', onclick: () => reporterSeance(se) }, 'Reporter à demain')) : null)));
      if (!auj && !faiteAuj) out.push(h('p', { class: 'pg-repos' }, 'Pas de séance prévue aujourd’hui : la récupération fait partie du programme.'));
    }
    // 2. La semaine, en lignes
    const today = new Date().getDay();
    out.push(h('section', { class: 'pg-sem', 'aria-labelledby': 'pg-sem-t' }, h('h2', { id: 'pg-sem-t', class: 'td-h' }, 'Ta semaine'),
      h('ul', { class: 'td-liste' }, pr.planning.map(pl => { const se = pr.seances.find(s => s.cle === pl.seance); return h('li', null, h('button', { class: 'td-ligne mod-corps' + (pl.jour === today ? ' auj' : ''), type: 'button', onclick: () => detailSeance(se) }, h('span', { class: 'pg-jour' }, pl.jourNom.slice(0, 3)), h('span', { class: 'td-l' }, h('b', null, se.nom), h('small', null, se.duree + ' min · ' + se.objectif)), icon('chev', 'chev'))); }))));
    // 3. Régularité mesurée (si des séances sont prévues)
    out.push(h('p', { class: 'pg-regul' }, a.prevues ? h('span', null, h('b', null, a.faites + ' sur ' + a.prevues), ' séances faites ces 14 derniers jours' + (a.taux !== null ? ' (' + fr(a.taux * 100) + ' %)' : '') + '.') : 'Ta régularité apparaîtra après tes premières séances enregistrées.'));
    if (a.conseil) out.push(h('div', { class: 'alert info' }, icon('info'), h('div', null, h('h3', null, 'Ajustement suggéré'), h('p', null, a.conseil))));
    const genes = S.seances.filter(l => l.gene && (Date.parse(t) - Date.parse(l.date)) / 864e5 <= 14).sort((x, y) => y.date.localeCompare(x.date));
    if (genes.length) out.push(h('div', { class: 'pg-lim', role: 'note' }, h('h2', { class: 'td-h' }, 'Gêne signalée'), h('p', null, 'Le ' + fmtD(genes[0].date) + ' (' + genes[0].nom + ')' + (genes[0].signalements && genes[0].signalements[0] ? ' : ' + genes[0].signalements[0].exercice + (genes[0].signalements[0].note ? ', « ' + genes[0].signalements[0].note + ' »' : '') : '') + '. Cap ne propose aucune augmentation de charge pendant 14 jours. Prends l’alternative si le mouvement la réveille ; si la douleur persiste plus de quelques jours ou s’aggrave, consulte un professionnel de santé.')));
    // 4. Limites appliquées (contraintes réelles), séparées des conseils
    const dec = viaIA ? (d.progRegles && d.progRegles.decisions) || [] : pr.decisions || [];
    const lim = dec.filter(x => (x.champs || []).some(c => ['zonesDouleur', 'contraintes', 'age', 'materielSport', 'tempsLibre', 'autreSport'].indexOf(c) >= 0));
    const autres = dec.filter(x => lim.indexOf(x) < 0);
    if (lim.length) out.push(h('section', { class: 'pg-lim', 'aria-labelledby': 'pg-lim-t' }, h('h2', { id: 'pg-lim-t', class: 'td-h' }, 'Limites appliquées'), h('ul', null, lim.map(x => h('li', null, x.raison, x.champs.length ? h('small', null, 'D’après : ' + x.champs.map(c => LIB_CHAMPS[c] || c).join(', ')) : null)))));
    // 5. Origine du programme et IA
    out.push(h('section', { class: 'pg-origine' }, h('p', null, h('span', { class: 'tag ' + (viaIA ? 'ia' : 'calc') }, viaIA ? 'IA validée par Cap' : 'Calculé par Cap'), ' ', viaIA ? 'Programme proposé par l’IA, accepté par toi et revérifié par les règles de sécurité à chaque ouverture.' : 'Construit par les règles de Cap à partir de tes réponses (niveau, temps, matériel, douleurs, objectif).')));
    if (window.CapIAUI) out.push(...window.CapIAUI.programmePanel(d));
    // 6. Détails repliés
    if (autres.length) out.push(h('details', { class: 'pg-det' }, h('summary', null, viaIA ? 'Règles de sécurité vérifiées' : 'Pourquoi ce programme'), h('ul', null, autres.map(x => h('li', null, x.raison)))));
    out.push(h('details', { class: 'pg-det' }, h('summary', null, 'Progression prévue'), h('p', null, pr.progression), pr.progressionSemaines && pr.progressionSemaines.length ? h('ul', null, pr.progressionSemaines.map(x => h('li', null, 'Semaine ' + x.semaine + ' : ' + x.consigne))) : null, pr.recuperation ? h('p', { class: 'foot muted' }, 'Récupération : ' + pr.recuperation) : null));
    const logs = S.seances.slice().sort((x, y) => y.date.localeCompare(x.date)).slice(0, 20);
    out.push(h('details', { class: 'pg-det' }, h('summary', null, 'Séances enregistrées (' + S.seances.length + ')'), logs.length ? h('ul', { class: 'td-liste' }, logs.map(l => h('li', { class: 'pg-log' }, h('span', { class: 'td-l' }, h('b', null, l.nom), h('small', null, fmtD(l.date) + ' · ' + ({ facile: 'facile', ok: 'correct', dur: 'très dur' }[l.ressenti] || '—') + (l.partielle ? ' · partielle (' + l.exercicesFaits + '/' + l.exercicesPrevus + ')' : ''))), h('button', { class: 'round press pg-del', type: 'button', 'aria-label': 'Supprimer la séance du ' + fmtD(l.date), onclick: () => confirmDel(() => remove('seances', l.id)) }, icon('trash'))))) : h('p', { class: 'foot muted' }, 'Aucune séance enregistrée : aucune progression n’est affichée.')));
    return out;
  }
  function logSeance(se) {
    const A = { ressenti: null };
    const ctx = { A, onChange: [], changed() { btn.disabled = !A.ressenti; } };
    const dt = h('input', { id: 's-date', type: 'date', value: dayId(), max: dayId() });
    let close;
    const btn = h('button', { class: 'btn', type: 'button', disabled: true, onclick: async () => { try { await put('seances', 's' + Date.now().toString(36), { date: dt.value || dayId(), cle: se.cle, nom: se.nom, ressenti: A.ressenti }); close(); toast('Séance enregistrée'); } catch (e) { toast('Échec, réessaie'); } } }, 'Enregistrer');
    close = sheet(se.nom, [h('p', { class: 'muted sub' }, 'Comment s’est passée la séance ?'), choices(ctx, 'ressenti', [{ v: 'facile', t: 'Facile', s: 'J’aurais pu en faire plus' }, { v: 'ok', t: 'Correct', s: 'Difficile mais maîtrisé' }, { v: 'dur', t: 'Très dur', s: 'Je n’ai pas fini ou j’ai forcé' }]), h('label', { class: 'field', for: 's-date' }, 'Date', dt), btn]);
  }

  // ---------- Argent
  // Argent : la prochaine décision, puis trois couches toujours nommées — Réel, Projection, Hypothèse — puis les détails repliés.
  function viewArgent(d) {
    const out = [largeTitle('Argent', null, h('button', { class: 'btn small', type: 'button', onclick: () => addMouvement(d) }, icon('plus'), 'Mouvement'))];
    const f = d.fin;
    if (!f || !f.ok) { out.push(h('div', { class: 'vide' }, h('p', null, f ? f.message : 'Il manque des réponses pour calculer ton budget.'), h('button', { class: 'btn', type: 'button', onclick: () => startOnboarding(Object.assign({}, S.profil), { only: missingSteps(), fresh: true }) }, 'Compléter mes réponses'))); return out; }
    const n = f.niveaux, p = d.p, mv = S.epargne.filter(m => typeof m.montant === 'number').slice().sort((a, b) => b.date.localeCompare(a.date));
    // Alertes factuelles, sans jugement
    if (f.capacite < 0) out.push(h('div', { class: 'ag-alerte', role: 'note' }, h('b', null, 'Déficit de ' + eur(-f.capacite) + ' par mois'), h('p', null, 'D’après tes réponses, tes dépenses et remboursements dépassent tes revenus. Tant que c’est le cas, aucune épargne n’est possible : la priorité est de réduire l’écart.')));
    else if (f.faisabilite === 'impossible_en_l_etat') out.push(h('div', { class: 'ag-alerte', role: 'note' }, h('b', null, 'Aucune date calculable en l’état'), h('p', null, 'Avec une capacité d’épargne nulle, le projet ne peut pas être daté. Une petite somme régulière suffit à rendre un calendrier possible.')));
    // 1. La prochaine décision
    const fait = !!(S.actions.done || {}).argent;
    out.push(h('section', { class: 'ag-decision' + (fait ? ' faite' : ''), 'aria-labelledby': 'ag-dec' }, h('p', { class: 'ag-k' }, fait ? 'Faite cette semaine' : 'Ta décision de la semaine'), h('h2', { id: 'ag-dec', class: 'ag-dec-t' }, n.action.texte),
      h('button', { class: 'btn ' + (fait ? 'secondary' : 'ag-go'), type: 'button', onclick: () => U.cocherAction('argent') }, fait ? 'Rouvrir' : 'C’est fait')));
    // 2. Réel
    const pct = n.intermediaire.montant > 0 ? Math.max(0, Math.min(1, f.actuelle / n.intermediaire.montant)) : 0;
    out.push(h('section', { class: 'ag-couche', 'aria-labelledby': 'ag-reel' }, h('h2', { id: 'ag-reel', class: 'ag-h' }, h('span', { class: 'tag mesure' }, 'Réel'), ' Ce que tu as mis de côté'),
      h('p', { class: 'ag-gros num' }, nombre('fin-act', f.actuelle, eur)),
      h('p', { class: 'ag-sous' }, mv.length ? 'Épargne de départ déclarée + ' + mv.length + ' mouvement' + (mv.length > 1 ? 's' : '') + ' noté' + (mv.length > 1 ? 's' : '') + '.' : 'Épargne de départ déclarée. Note chaque somme mise de côté pour suivre le réel.'),
      h('div', { class: 'ag-etape' }, h('div', { class: 'ag-etape-l' }, h('span', null, 'Étape en cours : ' + n.intermediaire.titre), h('b', { class: 'num' }, Math.round(pct * 100) + ' %')), h('div', { class: 'jr-jauge ag', role: 'img', 'aria-label': eur(Math.max(0, f.actuelle)) + ' sur ' + eur(n.intermediaire.montant) }, h('i', { style: 'width:' + pct * 100 + '%' })), h('small', null, eur(Math.max(0, f.actuelle)) + ' sur ' + eur(n.intermediaire.montant))),
      mv.length ? h('ul', { class: 'td-liste ag-mv' }, mv.slice(0, 3).map(m => h('li', { class: 'pr-jalon' }, h('span', null, m.note || (m.montant >= 0 ? 'Mis de côté' : 'Retiré'), h('small', { class: 'muted' }, ' · ' + fmtD(m.date))), h('b', { class: 'num ' + (m.montant >= 0 ? 'pos' : 'neg') }, (m.montant >= 0 ? '+' : '−') + eur(Math.abs(m.montant)))))) : null));
    // 2 bis. Ce mois-ci : opérations réelles saisies (aucune connexion bancaire)
    if (window.CapFinances) out.push(sectionMois(d));
    // 3. Projection
    const fz = { atteint: 'Objectif atteint.', atteignable: 'Atteignable pour ' + p.reveAnnee + ' si ta capacité actuelle se maintient.', ecart: 'Il manquerait ' + eur(f.ecartMensuel) + ' par mois pour ' + p.reveAnnee + '.', impossible_en_l_etat: 'Aucune date calculable en l’état.' }[f.faisabilite];
    out.push(h('section', { class: 'ag-couche', 'aria-labelledby': 'ag-proj' }, h('h2', { id: 'ag-proj', class: 'ag-h' }, h('span', { class: 'tag calc' }, 'Projection'), ' Si rien ne change'),
      h('div', { class: 'pr-ligne' }, h('span', { class: 'pr-l' }, 'Capacité'), h('span', { class: 'pr-v' }, h('b', { class: 'num' }, eur(f.capacite) + ' par mois'), ' (revenus − dépenses − remboursements)')),
      h('div', { class: 'pr-ligne' }, h('span', { class: 'pr-l' }, 'Projet'), h('span', { class: 'pr-v' }, n.reve.titre + ' · ' + eur(f.reve.total) + ' estimés')),
      h('div', { class: 'pr-ligne' }, h('span', { class: 'pr-l' }, 'Calendrier'), h('span', { class: 'pr-v' }, (f.moisAuRythme ? '≈ ' + fr(f.moisAuRythme / 12, 1) + ' ans au rythme actuel. ' : '') + fz)),
      h('div', { class: 'chart' }, moneyChart(d)),
      h('p', { class: 'foot muted' }, 'Trait plein : le réel. Pointillés : projection sans rendement, sans inflation ni imprévu. Ce n’est pas une promesse.'),
      howBtn('Capacité et calendrier', f.calcul)));
    // 4. Hypothèse (facultative)
    if (f.hypothese && has(p.revenuVise)) out.push(h('section', { class: 'ag-couche hypo', 'aria-labelledby': 'ag-hyp' }, h('h2', { id: 'ag-hyp', class: 'ag-h' }, h('span', { class: 'tag hypo' }, 'Hypothèse'), ' Si ton revenu changeait'),
      h('p', { class: 'pr-v' }, 'Avec ' + eur(f.hypothese.revenu) + ' nets par mois (le revenu que tu vises), ta capacité serait de ' + eur(f.hypothese.capacite) + ' par mois. Ce revenu n’est pas acquis : il n’entre dans aucun calcul du réel.'),
      h('button', { class: 'link', type: 'button', onclick: () => editStep('revenuVise') }, 'Modifier ce revenu visé')));
    // 5. Détails
    out.push(h('details', { class: 'pg-det' }, h('summary', null, 'Budget mensuel'), h('ul', { class: 'td-liste' },
      [['Revenus nets', eur(p.revenus)], ['Dépenses fixes', '− ' + eur(p.fixes)], ['Dépenses variables', '− ' + eur(p.variables)], ['Remboursements', '− ' + eur(p.remboursements || 0)], ['Reste pour épargner', eur(f.capacite)]].map(x => h('li', { class: 'pr-jalon' }, h('span', null, x[0]), h('b', { class: 'num' }, x[1])))),
      h('button', { class: 'link', type: 'button', onclick: () => editStep('variables') }, 'Modifier mes dépenses')));
    const r = f.reve;
    out.push(h('details', { class: 'pg-det' }, h('summary', null, 'Coût réel du projet'), h('p', { class: 'foot muted' }, 'Estimations datées du ' + E.REF.date + ', avec la confiance de chaque ligne.'),
      h('ul', { class: 'td-liste' }, r.lignes.map(l => h('li', { class: 'pr-jalon' }, h('span', null, l[0], h('small', { class: 'muted' }, ' · ' + l[2] + ' · confiance ' + l[3])), h('b', { class: 'num' }, eur(l[1]))))),
      r.revenuNecessaire ? h('p', { class: 'sub' }, h('b', null, 'Revenu net nécessaire ≈ ' + eur(r.revenuNecessaire) + ' par mois. '), r.revenuNote) : null, r.note ? h('p', { class: 'foot muted' }, r.note) : null));
    if (f.notesLegales.length) out.push(h('details', { class: 'pg-det' }, h('summary', null, 'À ton âge'), f.notesLegales.map(t => h('p', { class: 'sub' }, t))));
    const imp = d.issues.filter(i => i.domaine === 'argent');
    if (imp.length) out.push(h('details', { class: 'pg-det', open: true }, h('summary', null, 'À vérifier'), imp.map(i => issueView(i, champ => editStep(STEP_BY_FIELD[champ] || champ)))));
    out.push(h('details', { class: 'pg-det' }, h('summary', null, 'Historique des mouvements (' + mv.length + ')'), mv.length ? h('ul', { class: 'td-liste' }, mv.map(m => h('li', { class: 'pg-log' }, h('span', { class: 'td-l' }, h('b', null, m.note || (m.montant >= 0 ? 'Mis de côté' : 'Retiré')), h('small', null, fmtD(m.date))), h('b', { class: 'num ' + (m.montant >= 0 ? 'pos' : 'neg') }, (m.montant >= 0 ? '+' : '−') + eur(Math.abs(m.montant))), h('button', { class: 'round press pg-del', type: 'button', 'aria-label': 'Supprimer le mouvement du ' + fmtD(m.date), onclick: () => confirmDel(() => remove('epargne', m.id)) }, icon('trash'))))) : h('p', { class: 'foot muted' }, 'Aucun mouvement noté.')));
    return out;
  }
  // Montants réels : au centime près quand il y a des centimes
  const ec = v => (Math.round(v * 100) % 100 ? (Math.round(v * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' : eur(v));
  function sectionMois(d) {
    const F = window.CapFinances, m0 = dayId().slice(0, 7), p = d.p;
    const budget = (Number(p.fixes) || 0) + (Number(p.variables) || 0);
    const m = F.mois(S.operations, m0, budget || undefined);
    const nomMois = new Date(m0 + '-15T12:00').toLocaleDateString('fr-FR', { month: 'long' });
    const ops = S.operations.filter(o => F.valider(o).length === 0).sort((a, b) => b.date.localeCompare(a.date));
    return h('section', { class: 'ag-couche', 'aria-labelledby': 'ag-mois' },
      h('div', { class: 'bp-h' }, h('h2', { id: 'ag-mois', class: 'ag-h' }, h('span', { class: 'tag mesure' }, 'Réel'), ' ' + nomMois.charAt(0).toUpperCase() + nomMois.slice(1)), h('button', { class: 'btn small secondary', type: 'button', onclick: () => addOperation(d) }, icon('plus'), 'Opération')),
      m.nb ? [
        h('div', { class: 'pr-ligne' }, h('span', { class: 'pr-l' }, 'Dépensé'), h('span', { class: 'pr-v' }, h('b', { class: 'num' }, ec(m.depenses)), budget ? ' sur ' + ec(budget) + ' de budget déclaré' : '')),
        m.revenus ? h('div', { class: 'pr-ligne' }, h('span', { class: 'pr-l' }, 'Reçu'), h('span', { class: 'pr-v' }, h('b', { class: 'num pos' }, ec(m.revenus)), ' · solde ' + (m.solde >= 0 ? '+' : '−') + ec(Math.abs(m.solde)))) : null,
        m.top ? h('div', { class: 'pr-ligne' }, h('span', { class: 'pr-l' }, 'Plus gros poste'), h('span', { class: 'pr-v' }, m.top.nom + ' : ' + ec(m.top.montant) + (m.depenses ? ' (' + Math.round(m.top.montant / m.depenses * 100) + ' %)' : ''))) : null,
        h('ul', { class: 'fi-cats' }, m.classement.map(c => h('li', null, h('span', null, c.nom), h('i', { class: 'jr-barre', 'aria-hidden': 'true' }, h('i', { style: 'width:' + (c.montant / m.classement[0].montant * 100) + '%' })), h('b', { class: 'num' }, ec(c.montant))))),
        m.alertes.map(a => h('div', { class: 'ag-alerte', role: 'note' }, h('p', null, a)))]
        : h('p', { class: 'foot muted' }, 'Aucune opération saisie ce mois-ci. Note tes dépenses au fil de l’eau : Cap te dira où part ton argent, sans connexion à ta banque.'),
      ops.length ? h('details', { class: 'pg-det' }, h('summary', null, 'Historique des opérations (' + ops.length + ')'), h('ul', { class: 'td-liste' }, ops.slice(0, 60).map(o => h('li', { class: 'pg-log' },
        h('button', { class: 'td-l fi-op', type: 'button', onclick: () => addOperation(d, o), 'aria-label': 'Modifier ' + (o.note || F.NOM[o.categorie]) + ' du ' + fmtD(o.date) }, h('b', null, o.note || F.NOM[o.categorie]), h('small', null, fmtD(o.date) + ' · ' + F.NOM[o.categorie])),
        h('b', { class: 'num ' + (o.sens === 'revenu' ? 'pos' : '') }, (o.sens === 'revenu' ? '+' : '−') + ec(o.montant)),
        h('button', { class: 'round press pg-del', type: 'button', 'aria-label': 'Supprimer l’opération du ' + fmtD(o.date), onclick: () => confirmDel(() => remove('operations', o.id)) }, icon('trash')))))) : null);
  }
  function addOperation(d, ex) {
    const F = window.CapFinances;
    const A = { sens: ex ? ex.sens : 'depense', categorie: ex ? ex.categorie : null };
    const mt = h('input', { id: 'op-m', type: 'number', inputmode: 'decimal', min: '0', step: '0.01', value: ex ? String(ex.montant) : '' });
    const note = h('input', { id: 'op-n', maxlength: '60', value: ex && ex.note ? ex.note : '', placeholder: 'Facultatif' });
    const dt = h('input', { id: 'op-d', type: 'date', value: ex ? ex.date : dayId(), max: dayId() });
    const err = h('div', { class: 'err', role: 'alert' });
    const catZone = h('div');
    const ctx = { A, onChange: [], changed() { dessinerCats(); } };
    let derSens = A.sens;
    function dessinerCats() {
      if (derSens !== A.sens) { A.categorie = null; derSens = A.sens; }
      catZone.textContent = '';
      catZone.appendChild(h('div', { class: 'field' }, 'Catégorie', choices({ A, onChange: [], changed() {} }, 'categorie', (A.sens === 'revenu' ? F.REVENUS : F.CATEGORIES).map(c => ({ v: c[0], t: c[1] })), { grid: true })));
    }
    let close;
    const save = h('button', { class: 'btn', type: 'button', onclick: async () => {
      const o = { date: dt.value, sens: A.sens, montant: Math.round(Number(mt.value) * 100) / 100, categorie: A.categorie };
      if (note.value.trim()) o.note = note.value.trim().slice(0, 60);
      const e = F.valider(o); if (e.length) { err.textContent = e.join(' '); return; }
      save.disabled = true;
      try { await put('operations', ex ? ex.id : uid(), o); close(); toast(ex ? 'Opération modifiée' : 'Opération enregistrée'); } catch (e2) { err.textContent = 'Échec, réessaie.'; save.disabled = false; }
    } }, ex ? 'Enregistrer la modification' : 'Enregistrer');
    close = sheet(ex ? 'Modifier l’opération' : 'Nouvelle opération', [h('div', { class: 'field' }, 'Type', choices(ctx, 'sens', [{ v: 'depense', t: 'Dépense' }, { v: 'revenu', t: 'Revenu' }], { grid: true })), h('label', { class: 'field', for: 'op-m' }, 'Montant (€)', mt), catZone, h('label', { class: 'field', for: 'op-n' }, 'Détail', note), h('label', { class: 'field', for: 'op-d' }, 'Date', dt), err, save], { focus: false });
    dessinerCats();
  }
  function moneyChart(d) {
    const f = d.fin, p = d.p;
    const start = (p.creeLe || new Date().toISOString()).slice(0, 10);
    const mv = S.epargne.filter(m => typeof m.montant === 'number').slice().sort((a, b) => a.date.localeCompare(b.date));
    const real = [[start, p.epargne]]; let acc = p.epargne; mv.forEach(m => { acc += m.montant; real.push([m.date, acc]); });
    const months = 24;
    const t0 = new Date(start + 'T12:00').getTime(), tEnd = t0 + months * 30.44 * 864e5;
    const projEnd = f.capacite > 0 ? p.epargne + f.capacite * months : null;
    const hypEnd = f.hypothese && f.hypothese.capacite > 0 ? p.epargne + f.hypothese.capacite * months : null;
    const vals = real.map(r => r[1]).concat([projEnd, hypEnd].filter(v => v !== null), [0]);
    let lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals); if (hi - lo < 100) hi = lo + 100;
    const W = 340, H = 190, pl = 46, pr = 10, pt = 12, pb = 24;
    const x = t => pl + (t - t0) / (tEnd - t0) * (W - pl - pr), y = v => pt + (hi - v) / (hi - lo) * (H - pt - pb);
    const k = v => Math.abs(v) >= 1000 ? fr(v / 1000, Math.abs(v) >= 10000 ? 0 : 1) + ' k' : fr(v);
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Épargne réelle et projection">';
    for (let i = 0; i <= 4; i++) { const v = lo + (hi - lo) * i / 4; s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="var(--line)"/><text x="' + (pl - 6) + '" y="' + (y(v) + 3.5) + '" text-anchor="end">' + k(v) + '</text>'; }
    if (projEnd !== null) s += '<line x1="' + x(t0) + '" y1="' + y(p.epargne) + '" x2="' + x(tEnd) + '" y2="' + y(projEnd) + '" stroke="var(--money)" stroke-width="2" stroke-dasharray="5 5" opacity=".75"/>';
    if (hypEnd !== null) s += '<line x1="' + x(t0) + '" y1="' + y(p.epargne) + '" x2="' + x(tEnd) + '" y2="' + y(hypEnd) + '" stroke="var(--faint)" stroke-width="2" stroke-dasharray="1.5 4" stroke-linecap="round"/>';
    const pts = real.map(r => [x(Math.min(tEnd, new Date(r[0] + 'T12:00').getTime())), y(r[1])]);
    if (pts.length > 1) s += '<polyline points="' + pts.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ') + '" fill="none" stroke="var(--money)" stroke-width="2.5" stroke-linejoin="round"/>';
    s += '<circle cx="' + pts[pts.length - 1][0].toFixed(1) + '" cy="' + pts[pts.length - 1][1].toFixed(1) + '" r="4.5" fill="var(--money)" stroke="var(--surface)" stroke-width="1.5"/>';
    s += '<text x="' + pl + '" y="' + (H - 6) + '">' + fmtD(start) + '</text><text x="' + (W - pr) + '" y="' + (H - 6) + '" text-anchor="end">+ 24 mois</text></svg>';
    return h('div', { html: s });
  }
  function addMouvement() {
    const A = { sens: 1 };
    const ctx = { A, onChange: [], changed() {} };
    const segBtns = [h('button', { type: 'button', onclick: () => sw(1) }, 'Mis de côté'), h('button', { type: 'button', onclick: () => sw(-1) }, 'Retiré')];
    const thumb = h('span', { class: 'thumb glass' });
    const seg = h('div', { class: 'seg' }, thumb, segBtns);
    function sw(sn) { A.sens = sn; requestAnimationFrame(() => { const b = segBtns[sn > 0 ? 0 : 1]; thumb.style.width = b.offsetWidth + 'px'; thumb.style.transform = 'translateX(' + (b.offsetLeft - 3) + 'px)'; }); }
    const note = h('input', { id: 'mv-note', placeholder: 'Site pour un commerçant', maxlength: '60' });
    const dt = h('input', { id: 'mv-date', type: 'date', value: dayId(), max: dayId() });
    const err = h('div', { class: 'err', role: 'alert' });
    let close;
    const btn = h('button', { class: 'btn', type: 'button', onclick: async () => {
      if (!(A.montant > 0)) { err.textContent = 'Indique un montant supérieur à 0.'; return; }
      try { await put('epargne', 'm' + Date.now().toString(36), { date: dt.value || dayId(), montant: A.sens * A.montant, note: note.value.trim().slice(0, 60) }); close(); toast('Mouvement enregistré'); } catch (e) { err.textContent = 'Échec, réessaie.'; }
    } }, 'Enregistrer');
    close = sheet('Mouvement d’épargne', [seg, money(ctx, 'montant'), h('label', { class: 'field', for: 'mv-note' }, 'Origine ou motif (facultatif)', note), h('label', { class: 'field', for: 'mv-date' }, 'Date', dt), err, btn], { focus: false });
    sw(1);
  }

  // ---------- Réglages
  // Centre de confiance : état réel (stockage, connexion, IA, synchronisation), puis consentements séparés et révocables.
  function centreConfiance(d) {
    const prefs = S.prefs || {}, mode = db ? (db.cloud ? 'cloud' : 'claude') : 'local';
    const etatIA = window.CapContrats ? window.CapContrats.statutIA(() => !!(window.CapIA && window.CapIA.dispo())) : null;
    const photoDispo = !!(window.CapAI && window.CapAI.photoDispo());
    const etat = h('dl', { class: 'pf-etat' },
      h('dt', null, 'Tes données'), h('dd', null, { claude: 'Espace Claude privé, synchronisé entre tes appareils Claude', cloud: 'Compte Cap (Supabase), protégé par ton identifiant', local: 'Sur cet appareil uniquement. Exporte-les régulièrement.' }[mode]),
      h('dt', null, 'Connexion'), h('dd', null, navigator.onLine === false ? 'Hors ligne : tout fonctionne sauf l’IA ; les changements restent sur l’appareil.' : 'En ligne'),
      h('dt', null, 'IA'), h('dd', null, etatIA && etatIA.actif ? 'Disponible (Claude). Elle propose ; Cap vérifie ; tu décides.' : 'Indisponible ici. Tous les chiffres viennent des règles de Cap.'),
      h('dt', null, 'Photo de plat'), h('dd', null, photoDispo ? 'Analyse disponible, après ton accord' : 'Indisponible ici (saisie manuelle)'));
    const ligne = (titre, texte, actions) => h('div', { class: 'pf-cons' }, h('div', { class: 'td-l' }, h('b', null, titre), h('small', null, texte)), actions ? h('div', { class: 'pf-cons-a' }, actions) : null);
    const sw = (on, label, fn) => h('button', { class: 'pf-sw', type: 'button', role: 'switch', 'aria-checked': String(!!on), 'aria-label': label, onclick: fn }, h('span', { class: 'switch' + (on ? ' on' : '') }, h('i')));
    const cons = [];
    if (d.corps) cons.push(ligne('Coach · données du corps', 'Poids, objectifs et repas notés peuvent être lus par le coach, seulement quand tu lui poses une question.', sw(prefs.coachCorps, 'Partager mes données corps avec le coach', () => savePrefs({ coachCorps: !prefs.coachCorps }).then(() => renderMain()))));
    if (d.argent) cons.push(ligne('Coach · données d’argent', 'Budget, épargne et projet, seulement quand tu poses une question.', sw(prefs.coachArgent, 'Partager mes données argent avec le coach', () => savePrefs({ coachArgent: !prefs.coachArgent }).then(() => renderMain()))));
    if (d.entreprise) cons.push(ligne('IA · projet', 'Tes réponses du module Projet ne sont envoyées que si tu lances toi-même une recherche IA.', null));
    if (d.corps) cons.push(ligne('IA · photos de plats', prefs.consentScan ? 'Accordé le ' + fmtD(prefs.consentScan.accepte.slice(0, 10)) + '. Chaque photo est montrée avant envoi.' : 'Demandé à chaque première analyse. Aucune photo n’est envoyée sans ton accord.', prefs.consentScan ? h('button', { class: 'btn small text', type: 'button', onclick: () => savePrefs({ consentScan: null }).then(() => { toast('Accord retiré'); renderMain(); }) }, 'Retirer') : null));
    if (d.corps && window.CapPhotos) {
      const ph = window.CapPhotos.reglages();
      const conf = h('div', { class: 'ph-conf', hidden: true }, h('p', { class: 'sub' }, 'Supprimer définitivement tes ' + ph.n + ' photo(s) de progression ? Les fichiers et leurs informations seront effacés. Irréversible.'), h('button', { class: 'btn danger', type: 'button', onclick: () => ph.toutSupprimer() }, 'Tout supprimer définitivement'));
      cons.push(ligne('Photos de progression', ph.n + ' photo' + (ph.n > 1 ? 's' : '') + ' · ' + (ph.stockage === 'claude' ? 'espace Claude privé' : 'sur cet appareil, non synchronisées') + ' · jamais envoyées à une IA' + (ph.consenti ? '' : ' · conditions pas encore acceptées'),
        [ph.n ? h('button', { class: 'btn small text', type: 'button', onclick: () => ph.toutTelecharger() }, 'Tout télécharger') : null, ph.consenti ? h('button', { class: 'btn small text', type: 'button', onclick: () => ph.retirerConsentement().then(() => renderMain()) }, 'Retirer l’accord') : null, ph.n ? h('button', { class: 'btn small text danger-t', type: 'button', onclick: () => { conf.hidden = false; } }, 'Supprimer…') : null]), conf);
    }
    return [h('section', { class: 'pf-bloc', 'aria-labelledby': 'pf-etat' }, h('h2', { id: 'pf-etat', class: 'pf-h' }, 'État'), etat),
      h('section', { class: 'pf-bloc', 'aria-labelledby': 'pf-conf' }, h('h2', { id: 'pf-conf', class: 'pf-h' }, 'Confidentialité et IA'), h('p', { class: 'pf-sous' }, 'Chaque usage a son propre accord. Rien n’est partagé par défaut.'), cons)];
  }
  function viewReglages(d) {
    const p = d.p; const out = [largeTitle('Profil', ['corps', 'argent', 'entreprise'].filter(m => (p.domaines || []).indexOf(m) >= 0).map(m => ({ corps: 'Corps', argent: 'Argent', entreprise: 'Projet' })[m]).join(' · ') + (p.age ? ' · ' + p.age + ' ans' : ''))];
    const repl = (titre, ...kids) => h('details', { class: 'pf-rep' }, h('summary', null, titre), kids);
    out.push(...centreConfiance(d));
    out.push(h('h2', { class: 'pf-h' }, 'Tes réponses'), h('p', { class: 'pf-sous' }, 'Chaque réponse se modifie seule, sans refaire tout le questionnaire. L’ancienne version de ton profil est gardée dans l’historique.'));
    const lbl = (arr, v) => { const x = arr.find(a => a[0] === v); return x ? x[1] : '—'; };
    const v = (val, unit) => has(val) ? (typeof val === 'number' ? fr(val, val % 1 ? 1 : 0) : val) + (unit ? ' ' + unit : '') : 'Non renseigné';
    const row = (t, val, step, ic, col) => h('button', { class: 'cell', type: 'button', onclick: () => editStep(step) }, ic ? h('span', { class: 'ico', style: 'background:' + col }, icon(ic)) : null, h('span', { class: 'lbl' }, t), h('span', { class: 'val' }, val), icon('chev', 'chev'));
    out.push(repl('Général', h('div', { class: 'panel flush' },
      row('Modules suivis', (p.domaines || []).map(x => x === 'corps' ? 'Corps' : 'Argent').join(' + '), 'domaines', 'target', 'var(--ink)'),
      row('Âge', v(p.age, 'ans'), 'age', 'cal', '#8E8E93'),
      row('Temps libre', v(p.tempsLibre, 'h / sem'), 'tempsLibre', 'clock', '#8E8E93'))));
    if (d.corps) {
      const OBJ = [['perdre', 'Perdre du gras'], ['maintenir', 'Maintenir'], ['prendre', 'Prendre du muscle']];
      out.push(repl('Corps', h('div', { class: 'panel flush' },
        row('Sexe', lbl([['H', 'Homme'], ['F', 'Femme']], p.sexe), 'sexe', 'body', 'var(--body)'),
        row('Taille', v(p.taille, 'cm'), 'taille', 'body', 'var(--body)'),
        row('Poids de départ', v(p.poids, 'kg'), 'poids', 'scale', 'var(--body)'),
        row('Objectif', lbl(OBJ, p.objectif), 'objectif', 'target', 'var(--body)'),
        p.objectif !== 'maintenir' ? row('Poids visé', v(p.cible, 'kg'), 'cible', 'target', 'var(--body)') : null,
        p.objectif !== 'maintenir' ? row('Délai', lbl(DELAIS, p.delaiSem), 'delai', 'cal', 'var(--body)') : null,
        p.objectif !== 'maintenir' ? row('Rythme', has(p.rythme) ? fr(p.rythme, 2) + ' kg/sem' : 'Recommandé', 'faisabilite', 'chart', 'var(--body)') : null,
        row('Activité quotidienne', lbl([['assis', 'Assise'], ['mixte', 'Mixte'], ['physique', 'Physique']], p.activite), 'activite', 'walk', 'var(--body)'),
        row('Autre sport', v(p.autreSport, 'séance(s)/sem'), 'autreSport', 'bolt', 'var(--body)'))));
      out.push(repl('Programme', h('div', { class: 'panel flush' },
        row('Niveau', lbl([['debutant', 'Débutant'], ['intermediaire', 'Intermédiaire'], ['avance', 'Avancé']], p.niveau), 'niveau', 'dumbbell', '#FF9F0A'),
        row('Séances par semaine', v(p.jours), 'jours', 'dumbbell', '#FF9F0A'),
        p.jours > 0 ? row('Durée', v(p.minutes, 'min'), 'minutes', 'clock', '#FF9F0A') : null,
        p.jours > 0 ? row('Lieu', lbl([['salle', 'Salle'], ['maison', 'Maison']], p.lieu), 'lieu', 'home', '#FF9F0A') : null,
        p.jours > 0 && p.lieu === 'maison' ? row('Matériel', (p.materielSport || []).map(x => ({ elastique: 'Élastiques', halteres: 'Haltères', traction: 'Barre de traction', banc: 'Banc', aucun: 'Aucun' })[x]).join(', ') || 'Non précisé', 'materielSport', 'dumbbell', '#FF9F0A') : null,
        p.jours > 0 ? row('Priorité', lbl([['forme', 'Forme'], ['muscle', 'Muscle'], ['force', 'Force'], ['auto', 'Choisie par Cap']], p.prioriteSport), 'prioriteSport', 'target', '#FF9F0A') : null,
        row('Contraintes', (p.contraintes || []).map(c => ({ douleur: 'Douleur', sante: 'Santé', aucune: 'Aucune' })[c]).join(', ') || '—', 'contraintes', 'heart', '#FF9F0A'),
        (p.contraintes || []).indexOf('douleur') >= 0 ? row('Zones douloureuses', (p.zonesDouleur || []).join(', ') || 'Non précisées', 'zonesDouleur', 'heart', '#FF9F0A') : null,
        row('Frein principal', lbl([['regularite', 'Régularité'], ['alim', 'Alimentation'], ['temps', 'Temps'], ['motivation', 'Motivation']], p.obstacle), 'obstacle', 'info', '#FF9F0A'))));
    }
    if (d.corps && window.CapJournal) out.push(window.CapJournal.reglagesNutrition(d));
    if (d.argent) {
      const RV = REVES.map(r => [r.v, r.t]);
      out.push(repl('Argent', h('div', { class: 'panel flush' },
        row('Revenus nets', has(p.revenus) ? eur(p.revenus) + ' / mois' : '—', 'revenus', 'wallet', 'var(--money)'),
        row('Dépenses fixes', has(p.fixes) ? eur(p.fixes) : '—', 'fixes', 'wallet', 'var(--money)'),
        row('Dépenses variables', has(p.variables) ? eur(p.variables) : '—', 'variables', 'wallet', 'var(--money)'),
        row('Remboursements', has(p.remboursements) ? eur(p.remboursements) : '—', 'remboursements', 'wallet', 'var(--money)'),
        row('Épargne de départ', has(p.epargne) ? eur(p.epargne) : '—', 'epargne', 'wallet', 'var(--money)'),
        row('Projet', lbl(RV, p.reve), 'reve', 'star', 'var(--money)'),
        row('Échéance', v(p.reveAnnee), 'reveAnnee', 'cal', 'var(--money)'),
        row('Heures pour le projet', v(p.heuresProjet, 'h / sem'), 'heuresProjet', 'clock', 'var(--money)'),
        row('Revenu visé (hypothèse)', has(p.revenuVise) ? eur(p.revenuVise) : 'Aucun', 'revenuVise', 'chart', 'var(--money)'))));
    }
    if (d.entreprise) {
      const Bz = window.CapBusiness;
      out.push(repl('Entreprise', h('div', { class: 'panel flush' },
        row('Pays', lbl([['france', 'France'], ['emirats', 'Émirats'], ['autre', 'Autre']], p.pays), 'pays', 'building', 'var(--ink)'),
        row('Capital de départ', has(p.capital) ? eur(p.capital) : '—', 'capital', 'wallet', 'var(--ink)'),
        row('Compétences', (p.competences || []).map(c => (Bz && Bz.COMPETENCES[c]) || (c === 'aucune' ? 'Aucune' : c)).join(', ') || '—', 'competences', 'code', 'var(--ink)'),
        row('Matériel', (p.materielPro || []).map(m => Bz && Bz.MATERIEL[m] ? Bz.MATERIEL[m][0] : 'Aucun').join(', ') || '—', 'materielPro', 'building', 'var(--ink)'),
        row('Heures par semaine', v(p.heuresProjet, 'h'), 'heuresProjet', 'clock', 'var(--ink)'),
        row('Expérience', lbl([['aucune', 'Aucune'], ['projets', 'Projets perso'], ['clients', 'Clients payants']], p.experience), 'experience', 'people', 'var(--ink)'),
        row('Démarchage', lbl([[1, 'Ça me bloque'], [2, 'Ça va'], [3, 'J’aime ça']], p.aisanceVente), 'aisanceVente', 'people', 'var(--ink)'),
        row('Risque accepté', lbl([['faible', 'Faible'], ['moyen', 'Moyen'], ['eleve', 'Élevé']], p.risque), 'risque', 'chart', 'var(--ink)'),
        row('Format', lbl([['en_ligne', 'En ligne'], ['local', 'Local'], ['les_deux', 'Les deux']], p.formatPref), 'formatPref', 'home', 'var(--ink)'))));
    }
    const sonOn = !!(window.CapSon && window.CapSon.actif());
    const animOn = !!store.get('cap-anim-reduites');
    out.push(section(null, null, h('div', { class: 'cap' }, 'Préférences'), h('div', { class: 'panel flush' },
      h('button', { class: 'cell', type: 'button', role: 'switch', 'aria-checked': String(animOn), onclick: () => { if (animOn) store.del('cap-anim-reduites'); else store.set('cap-anim-reduites', 1); appliquerAnim(); window._keepScroll = true; renderMain(); } },
        h('span', { class: 'lbl' }, 'Réduire les animations', h('small', null, 'Coupe les mouvements de l’interface dans Cap. Le réglage « Réduire les animations » de ton téléphone est aussi respecté.')),
        h('span', { class: 'switch' + (animOn ? ' on' : '') }, h('i'))),
      h('button', { class: 'cell', type: 'button', role: 'switch', 'aria-checked': String(sonOn), onclick: () => { window.CapSon.regler(!sonOn); window._keepScroll = true; renderMain(); } },
        h('span', { class: 'lbl' }, 'Sons de l’interface', h('small', null, 'Sept sons feutrés : sélection, étape, validation, programme terminé, objectif, erreur, ouverture. Désactivés par défaut. Sur iPhone, ils respectent le mode silencieux (iOS 17 et plus).')),
        h('span', { class: 'switch' + (sonOn ? ' on' : '') }, h('i')))),
      h('p', { class: 'foot muted', style: 'margin:0 16px' }, 'Safari sur iPhone ne permet pas aux sites de faire vibrer le téléphone : pas de retour haptique ici.')));
    out.push(repl('Sources et limites de Cap', h('div', { class: 'panel' },
      h('p', { class: 'sub' }, 'Les calculs sont faits par des formules fixes, testées, jamais par une IA. Ce sont des estimations, pas des garanties. Cap ne remplace ni un médecin ni un conseiller financier.'),
      h('ul', { class: 'calc' }, Object.keys(E.REF.sources).map(k => h('li', { class: 'foot' }, E.REF.sources[k]))))));
    if (window.CapIAUI) { const cs = window.CapIAUI.complementsSection(); if (cs) out.push(cs); }
    if (window.CapDonnees) out.push(window.CapDonnees.section());
    const OU = { claude: 'Tes données sont dans ton espace Claude privé, synchronisé entre tes appareils connectés à Claude.', cloud: 'Tes données sont dans ton compte Cap (Supabase), protégées par ton identifiant et synchronisées entre tes appareils.', local: 'Tes données sont enregistrées sur cet appareil uniquement. Exporte-les régulièrement pour ne pas les perdre.' };
    out.push(section(null, null, h('div', { class: 'cap' }, 'Données'), h('div', { class: 'panel flush' },
      h('button', { class: 'cell', type: 'button', onclick: () => startOnboarding(Object.assign({}, S.profil), { fresh: true }) }, h('span', { class: 'lbl' }, 'Refaire le questionnaire'), icon('chev', 'chev')),
      h('button', { class: 'cell danger', type: 'button', onclick: () => resetAll() }, h('span', { class: 'lbl' }, 'Effacer toutes mes données'))),
      h('p', { class: 'foot muted', style: 'margin:0 16px' }, OU[db ? (db.cloud ? 'cloud' : 'claude') : 'local'])));
    return out;
  }
  function resetAll() {
    const close = sheet('Tout effacer ?', [h('p', { class: 'muted sub' }, 'Profil, pesées, journal alimentaire, aliments, recettes, photos, séances, mouvements d’épargne, tâches et ventes seront supprimés. Une copie de secours est d’abord gardée sur cet appareil (Réglages → Importer une sauvegarde).'),
      h('button', { class: 'btn', style: 'background:var(--bad)', type: 'button', onclick: async () => {
        try {
          if (window.CapDonnees) await window.CapDonnees.sauvegardeAuto();
          const jobs = [];
          S.pesees.forEach(r => jobs.push(remove('pesees', r.id))); S.epargne.forEach(r => jobs.push(remove('epargne', r.id))); S.seances.forEach(r => jobs.push(remove('seances', r.id)));
          Object.keys(S.journaux).forEach(k => jobs.push(remove('repas', k))); jobs.push(remove('actions', weekKey())); jobs.push(remove('prefs', 'main'));
          Object.keys(S.taches || {}).forEach(k => jobs.push(remove('taches', k))); S.programmes.forEach(x => jobs.push(remove('programmes', x.id))); S.opportunites.forEach(x => jobs.push(remove('opportunites', x.id))); S.ventes.forEach(v => jobs.push(remove('ventes', v.id))); ['depenses', 'fournisseurs', 'decisions', 'operations', 'conversations'].forEach(c => S[c].forEach(x => jobs.push(remove(c, x.id))));
          S.perso.forEach(r => jobs.push(remove('aliments', r.id))); S.recettes.forEach(r => jobs.push(remove('recettes', r.id)));
          if (window.CapDonnees) jobs.push(window.CapUI.snapshotData().then(d => Promise.all(Object.keys(d.historique || {}).map(id => remove('historique', id)))));
          S.photos.forEach(r => { jobs.push(remove('photos', r.id)); if (window.CapPhotos) jobs.push(window.CapPhotos.supprimerFichier(r)); else if (window.CapJournal) jobs.push(window.CapJournal.supprimerAsset(r.assetId)); });
          await Promise.all(jobs); await remove('profil', 'main'); S.profil = null; store.del('cap-draft'); close(); OB = null; refresh();
        } catch (e) { toast('Échec, réessaie'); }
      } }, 'Tout effacer'), h('button', { class: 'btn secondary', type: 'button', onclick: () => close() }, 'Annuler')]);
  }

  // ================================================================ Démarrage
  let booted = false;
  const boot = () => { if (booted) return; booted = true; refresh(); };
  window.CapUI = { derive: (...a) => derive(...a), viewProgRefresh: () => renderMain(), sparkle, nombre, derniers, h, add, icon, fr, eur, kg, wfmt, unite, LB, dayId, fmtD, weekKey, toast, sheet, Ruler, choices, money, cellKV, largeTitle: (...a) => largeTitle(...a), section: (...a) => section(...a), howBtn: (...a) => howBtn(...a), issueView, confirmDel, addPesee: () => addPesee(), editStep, startOnboarding, missingSteps, editerObjectifs, derive, put, remove, saveProfil, savePrefs, uid, S, STEP_BY_FIELD, has, reduced, vib, db: () => db, store, snapshotData: () => snapshotData(), modeDonnees: () => (db ? (db.cloud ? 'cloud' : 'claude') : 'local'), setTab: t => aller(t), aller: (a, b, c) => aller(a, b, c), lancerSeance: se => lancerSeance(se), reporter: se => reporterSeance(se), seanceDuJour: date => { const d2 = derive(); return d2.prog && d2.prog.ok ? seanceDu(d2.prog, date || dayId()) : null; }, logSeance: se => logSeance(se), cocherAction: async k => { const done = Object.assign({}, S.actions.done || {}); done[k] = !done[k]; try { await put('actions', weekKey(), { done }); S.actions = { done }; toast(done[k] ? 'Action notée comme faite' : 'Action rouverte'); window._keepScroll = true; refresh(); } catch (e) { toast('Échec, réessaie'); } }, segments: (...a) => segments(...a), addMouvement: d2 => addMouvement(d2), refresh: () => { window._keepScroll = true; refresh(); } };
  // Lecture de toutes les données, quel que soit le stockage (export, migration)
  async function snapshotData() {
    const colls = window.CapSync ? window.CapSync.COLLS : Object.keys(mem), out = {};
    colls.forEach(c => { out[c] = {}; });
    if (!db) { colls.forEach(c => { out[c] = JSON.parse(JSON.stringify(mem[c] || {})); }); return out; }
    await Promise.all(colls.map(async c => { const q = await db.collection(c).get(); q.docs.forEach(d => { out[c][d.id] = d.data(); }); }));
    return out;
  }
  const local = () => { db = null; loadLocal(); syncMem(); boot(); };
  async function localOuCompte() {
    if (window.CapCloud && window.CapCloud.configure()) {
      const s = await window.CapCloud.init();
      if (s) { db = window.CapCloud.db(); brancher(); return; }
    }
    local();
  }
  const start = () => (async () => {
    const use = window.claude && window.claude.use;
    if (!use) { await localOuCompte(); return; }
    let ok = null;
    const attente = new Promise(r => setTimeout(() => r(null), 10000));
    try { ok = await Promise.race([window.claude.use('db'), attente]); } catch (e) { ok = null; }
    if (!ok) { await localOuCompte(); return; }
    db = ok; brancher();
  })();
  function brancher() {
    const timer = setTimeout(() => { if (!booted) boot(); }, 10000);
    const onErr = () => {};
    let first = true;
    db.doc('profil/main').onSnapshot(s => {
      S.profil = s.exists ? s.data() : null;
      if (first && !s.metadata.fromCache) { first = false; clearTimeout(timer); boot(); }
      else if (booted && !OB) { window._keepScroll = true; refresh(); }
    }, () => { clearTimeout(timer); boot(); });
    const live = (path, fn) => db.collection(path).onSnapshot(s => { fn(s.docs.map(x => Object.assign({ id: x.id }, x.data()))); if (booted && !OB) { window._keepScroll = true; refresh(); } }, onErr);
    live('pesees', v => { S.pesees = v.filter(r => r.date && typeof r.poids === 'number'); });
    live('epargne', v => { S.epargne = v.filter(r => r.date && typeof r.montant === 'number'); });
    live('seances', v => { S.seances = v.filter(r => r.date); });
    live('repas', v => { const m = {}; v.forEach(j => { if (j.date) m[j.date] = j; }); S.journaux = m; });
    live('aliments', v => { S.perso = v; });
    live('recettes', v => { S.recettes = v; });
    live('photos', v => { S.photos = v.filter(x => x.assetId); });
    live('taches', v => { const m = {}; v.forEach(t => { m[t.id] = t; }); S.taches = m; });
    live('ventes', v => { S.ventes = v.filter(x => x.date && typeof x.montant === 'number'); });
    live('programmes', v => { S.programmes = v.filter(x => x.date && x.brut); });
    live('opportunites', v => { S.opportunites = v.filter(x => x.date); });
    ['depenses', 'fournisseurs', 'decisions', 'operations', 'conversations'].forEach(c => live(c, v => { S[c] = v.filter(x => x && x.date); }));
    db.doc('prefs/main').onSnapshot(s => { S.prefs = Object.assign({ favoris: [] }, s.exists ? s.data() : {}); if (booted && !OB) { window._keepScroll = true; refresh(); } }, onErr);
    db.collection('actions').doc(weekKey()).onSnapshot(s => { S.actions = s.exists ? s.data() : { done: {} }; if (booted && !OB) { window._keepScroll = true; refresh(); } }, onErr);
  }
  // Démarre après le chargement de tous les modules (journal.js, ai.js)
  const go = () => { intro(); if (window.CapAI && window.CapAI.branchement) window.CapAI.branchement(); if (window.CapAI) window.CapAI.init().then(() => { if (booted && !OB) { window._keepScroll = true; refresh(); } }); if (window.CapJournal) window.CapJournal.init(); start(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else setTimeout(go, 0);
})();
