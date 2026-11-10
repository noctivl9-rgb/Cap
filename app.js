/* Cap — interface. Tous les chiffres viennent de CapEngine (engine.js). */
(function () {
  'use strict';
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
  const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function toast(msg) { if (/^Échec/.test(msg)) { if (window.CapSon) window.CapSon.jouer('erreur'); } const t = h('div', { class: 'toast glass', role: 'status' }, msg); document.body.appendChild(t); setTimeout(() => t.remove(), 1900); }
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }, del(k) { try { localStorage.removeItem(k); } catch (e) {} } };

  // ================================================================ Données (db ou mémoire)
  let db = null;
  const S = { profil: null, pesees: [], journaux: {}, epargne: [], seances: [], actions: { done: {} }, prefs: { favoris: [] }, perso: [], recettes: [], photos: [] };
  const mem = { profil: {}, pesees: {}, repas: {}, epargne: {}, seances: {}, actions: {}, prefs: {}, aliments: {}, recettes: {}, photos: {} };
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
    refresh();
  }
  async function saveProfil(patch) {
    const p = Object.assign({}, S.profil || {}, patch, { v: 2, majLe: new Date().toISOString() });
    Object.keys(p).forEach(k => { if (p[k] === undefined) p[k] = null; });
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
    const corps = doms.indexOf('corps') >= 0, argent = doms.indexOf('argent') >= 0;
    const phys = corps ? E.physique(p) : null;
    const prog = corps ? E.programme(p) : null;
    const fin = argent ? E.finances(p, S.epargne, dayId()) : null;
    const issues = E.coherence(p, phys, prog, fin);
    const adapt = prog ? E.adaptation(prog, S.seances, dayId(), p.creeLe ? p.creeLe.slice(0, 10) : null) : null;
    return { p, corps, argent, phys, prog, fin, issues, adapt };
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
  const DELAIS = [[4, '1 mois'], [9, '2 mois'], [13, '3 mois'], [26, '6 mois'], [52, '1 an'], [0, 'Pas de date précise']];
  const REVES = [
    { v: 'appart', t: 'Appartement à Dubaï', s: '1 chambre, Dubai Marina', i: 'building' },
    { v: 'vivre', t: 'Vivre à Dubaï', s: 'S’installer et y payer un loyer', i: 'plane' },
    { v: 'urus', t: 'Lamborghini Urus', s: 'Achat et coût d’usage', i: 'car' },
    { v: 'appart_urus', t: 'Appartement + Urus', s: 'Les deux projets', i: 'star' },
    { v: 'autre', t: 'Autre projet', s: 'Tu fixes le montant', i: 'target' }
  ];
  const STEPS = [
    { id: 'domaines', sec: 'Départ', f: ['domaines'], q: 'Sur quoi veux-tu avancer ?', lead: 'Cap ne te posera que les questions utiles à ce choix.', ok: A => (A.domaines || []).length > 0,
      body: ctx => choices(ctx, '_dom', [{ v: 'corps', t: 'Mon corps', s: 'Poids, nutrition, entraînement', i: 'body' }, { v: 'argent', t: 'Mon argent', s: 'Budget, épargne, grands projets', i: 'wallet' }, { v: 'both', t: 'Les deux', s: 'Deux modules séparés, jamais mélangés dans un score', i: 'target' }],
        { onPick: v => { ctx.A.domaines = v === 'both' ? ['corps', 'argent'] : [v]; } }), init: A => { A._dom = (A.domaines || []).length === 2 ? 'both' : (A.domaines || [])[0]; } },
    { id: 'age', sec: 'Départ', f: ['age'], q: 'Quel âge as-tu ?', lead: 'Avant 18 ans, les règles de calcul changent pour protéger ta croissance et respecter le droit du travail.', ok: A => has(A.age), touch: true,
      check: A => A.age < 13 ? 'Cap est prévu à partir de 13 ans. Pour un objectif de santé, parles-en avec ton médecin.' : null,
      body: ctx => ruler(ctx, 'age', { min: 10, max: 100, step: 1, unit: 'ans', label: 'Âge', start: 18, px: 16 }) },
    { id: 'tempsLibre', sec: 'Départ', f: ['tempsLibre'], q: 'Combien d’heures libres as-tu par semaine ?', lead: 'Hors cours ou travail, trajets, repas et sommeil. Sert à vérifier que ton programme tient dans ta semaine.', ok: A => has(A.tempsLibre), touch: true,
      body: ctx => ruler(ctx, 'tempsLibre', { min: 0, max: 100, step: 1, unit: 'h', label: 'Par semaine', start: 15, px: 14 }) },
    // Corps
    { id: 'sexe', sec: 'Corps', when: C, f: ['sexe'], q: 'Quel est ton sexe ?', lead: 'Utilisé uniquement dans la formule de dépense énergétique.', ok: A => has(A.sexe), body: ctx => choices(ctx, 'sexe', [{ v: 'H', t: 'Homme' }, { v: 'F', t: 'Femme' }], { grid: true }) },
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
    { id: 'contraintes', sec: 'Programme', when: C, f: ['contraintes'], q: 'Quelque chose à prendre en compte ?', lead: 'Cap ne remplace pas un avis médical, mais adapte ses conseils.', ok: A => (A.contraintes || []).length > 0,
      body: ctx => choices(ctx, 'contraintes', [{ v: 'douleur', t: 'Douleur ou blessure', i: 'alert' }, { v: 'sante', t: 'Problème de santé suivi par un médecin', i: 'heart' }, { v: 'aucune', t: 'Rien de particulier', exclusive: true, i: 'check' }], { multi: true }) },
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
    { id: 'competences', sec: 'Argent', when: M, f: ['competences'], q: 'Qu’est-ce que tu sais déjà faire ?', lead: 'Pour proposer des étapes réalistes. Rien n’est compté comme revenu.', ok: A => (A.competences || []).length > 0,
      body: ctx => choices(ctx, 'competences', [{ v: 'code', t: 'Code (sites, applis)', i: 'code' }, { v: 'design', t: 'Design, graphisme' }, { v: 'video', t: 'Vidéo, montage' }, { v: 'vente', t: 'Vente, relation client', i: 'people' }, { v: 'aucune', t: 'Rien encore', exclusive: true }], { multi: true }) },
    { id: 'heuresProjet', sec: 'Argent', when: M, f: ['heuresProjet'], q: 'Combien d’heures par semaine pour ton projet ?', lead: 'Apprendre, créer, chercher des clients.', ok: A => has(A.heuresProjet), touch: true,
      body: ctx => ruler(ctx, 'heuresProjet', { min: 0, max: 100, step: 1, unit: 'h', label: 'Par semaine', start: 7, px: 14 }) },
    { id: 'revenuVise', sec: 'Argent', when: M, f: ['revenuVise'], optional: true, q: 'Un revenu mensuel que tu vises ?', lead: 'Facultatif. Il restera une hypothèse affichée à part, jamais comptée comme acquise.', ok: A => has(A.revenuVise), body: ctx => money(ctx, 'revenuVise', { per: 'par mois (hypothèse)' }) },
    // Bilan
    { id: 'bilan', sec: 'Bilan', f: [], q: 'Vérification de tes réponses', ok: () => true, cta: 'Créer mon plan', body: ctx => bilan(ctx) },
    { id: 'plan', sec: 'Bilan', f: ['objectifsPerso'], q: 'Ton plan', lead: 'Calculé à partir de tes réponses. Tu peux tout modifier, maintenant ou plus tard.', ok: () => true, cta: 'Commencer le suivi', body: ctx => planApercu(ctx) }
  ];
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
  // Écran d'accueil avant les questions : logo animé, promesse, trois fonctions réelles
  // Écran d'accueil — la marque Cap : un « C » (le cadre) et un point corail (ton cap).
  // Chorégraphie unique (~1,4 s) : la lentille de verre apparaît, l'arc se trace, le point orbite puis se pose au centre
  // et s'y stabilise par oscillations amorties, la goutte ondule une fois. Toucher la lentille rejoue l'ondulation.
  // Écran d'accueil : le monogramme Cap en grand (noir mat, chevron argent brossé), un reflet qui le parcourt une fois.
  function renderWelcome() {
    const L = window.CapLogo;
    const hero = h('button', { class: 'wl-hero-mark', type: 'button', 'aria-label': 'Cap', html: L.mark({ size: 168, cls: 'wl-big' }) });
    const sheen = h('span', { class: 'lg-sheen', 'aria-hidden': 'true' }); hero.appendChild(sheen);
    const reflet = () => { if (reduced()) return; sheen.classList.remove('run'); void sheen.offsetWidth; sheen.classList.add('run'); };
    hero.addEventListener('click', () => { reflet(); if (window.CapSon) window.CapSon.jouer('selection'); });
    const pilier = (ic, t, sub) => h('li', { class: 'wl-pil' }, h('span', { class: 'wl-pil-i' }, icon(ic)), h('span', { class: 'wl-pil-t' }, h('b', null, t), h('span', null, sub)));
    const sk = sparkle('Commencer mon parcours', () => { if (window.CapSon) window.CapSon.jouer('ouverture'); OB.welcome = false; OB.dir = 1; renderStep(); });
    $app.textContent = '';
    $app.append(h('div', { class: 'ob wl' },
      h('div', { class: 'wl-brand', html: L.wordmark({ markSize: 24, color: 'var(--ink)' }) }),
      h('div', { class: 'wl-stage' }, h('span', { class: 'wl-plinth', 'aria-hidden': 'true' }), hero),
      h('h1', { class: 'wl-title' }, 'Garde le cap.'),
      h('p', { class: 'wl-sub' }, 'Ton corps et ton argent, suivis avec des chiffres vrais.'),
      h('ul', { class: 'wl-pils' },
        pilier('camera', 'Repas', 'Recherche, recettes ou photo analysée'),
        pilier('chart', 'Progrès', 'Pesées, calories et séances mesurées'),
        pilier('wallet', 'Projet', 'Budget, épargne et coût réel'))),
      h('div', { class: 'ob-bar' }, h('div', { class: 'in glass wl-cta' }, sk.el, h('p', { class: 'foot muted', style: 'text-align:center;margin:4px 0 2px' }, 'Environ 3 minutes. Tes réponses restent privées.'))));
    window.scrollTo(0, 0);
    setTimeout(reflet, 700);
  }
  // Introduction : le logo apparaît en noir mat, un reflet argent le parcourt, le métal se révèle, puis l'appli.
  // Une fois toutes les 12 h au plus, 1,3 s, touchable pour passer, absente si « Réduire les animations ».
  function intro() {
    if (reduced()) return;
    const last = Number(store.get('cap-intro') || 0);
    if (Date.now() - last < 12 * 3600e3) return;
    store.set('cap-intro', Date.now());
    const L = window.CapLogo;
    const ov = h('div', { class: 'intro', role: 'presentation', 'aria-hidden': 'true' },
      h('div', { class: 'intro-mark' }, h('span', { class: 'intro-matte', html: L.mark({ size: 132, mode: 'mono', color: '#1A1A1C' }) }), h('span', { class: 'intro-metal', html: L.mark({ size: 132 }) }), h('span', { class: 'lg-sheen run' })),
      h('div', { class: 'intro-word' }, 'CAP'));
    let done = false;
    const fin = () => { if (done) return; done = true; ov.classList.add('out'); setTimeout(() => ov.remove(), 320); };
    ov.addEventListener('click', fin);
    document.body.appendChild(ov);
    setTimeout(fin, 1350);
  }
  function renderStep() {
    if (OB.welcome) { renderWelcome(); return; }
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
      s.q && !s.auto ? h('h1', null, s.q) : null, s.lead ? h('p', { class: 'lead' }, s.lead) : null, content);
    const bar = h('div', { class: 'ob-bar' }, h('div', { class: 'in glass' }, err, sk ? sk.el : nextBtn, skipBtn));
    bar.hidden = !!s.auto;
    $app.textContent = '';
    $app.append(h('div', { class: 'ob' }, top, stage), bar);
    ctx.refreshCta();
    window.scrollTo(0, 0);
  }
  function makeCtx(s) {
    const ctx = {
      A: OB.A, onChange: [],
      changed() { ctx.onChange.forEach(f => f()); if (ctx.refreshCta) ctx.refreshCta(); store.set('cap-draft', { A: OB.A, idx: OB.idx }); },
      next(skipped) {
        if (s.id === 'plan') { finishOnboarding(); return; }
        if (OB.returnTo) { const vs = visibleSteps(OB.A, OB.only); const i = vs.findIndex(x => x.id === OB.returnTo); OB.returnTo = null; OB.idx = i >= 0 ? i : OB.idx + 1; OB.dir = 1; renderStep(); return; }
        OB.idx++; OB.dir = 1; renderStep();
      },
      prev() { if (OB.returnTo) { const vs = visibleSteps(OB.A, OB.only); OB.idx = vs.findIndex(x => x.id === OB.returnTo); OB.returnTo = null; } else OB.idx--; OB.dir = -1; renderStep(); },
      goto(id, fromBilan) { const vs = visibleSteps(OB.A, OB.only); const i = vs.findIndex(x => x.id === id); if (i < 0) return; if (fromBilan || s.id === 'faisabilite') OB.returnTo = s.id; OB.idx = i; OB.dir = -1; renderStep(); },
      finish: () => finishOnboarding(),
      rerender: () => renderStep()
    };
    return ctx;
  }
  async function finishOnboarding() {
    const A = Object.assign({}, OB.A); delete A._dom;
    const now = new Date().toISOString();
    const data = Object.assign({}, S.profil && S.profil.v === 2 ? S.profil : {}, A, { v: 2, creeLe: (S.profil && S.profil.v === 2 && S.profil.creeLe) || now, majLe: now });
    try {
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
  let tab = 'today', lastTab = null, lastPill = null;
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
  function renderMain() {
    const d = derive();
    const J = window.CapJournal;
    const tabs = [['today', 'Accueil', 'home']];
    if (d.corps) { tabs.push(['corps', 'Progrès', 'chart']); tabs.push(['prog', 'Programme', 'dumbbell']); }
    if (d.argent) tabs.push(['argent', 'Argent', 'wallet']);
    tabs.push(['reglages', 'Réglages', 'gear']);
    if (!tabs.some(t => t[0] === tab)) tab = 'today';
    const views = { today: J.viewAccueil, corps: J.viewProgres, prog: viewProg, argent: viewArgent, reglages: viewReglages };
    const scrollY = window.scrollY;
    const changed = lastTab !== tab; lastTab = tab;
    $app.textContent = '';
    $app.append(h('main', { class: 'screen' + (changed && !reduced() ? ' enter' : '') }, views[tab](d)));
    if (!db) $app.querySelector('main').appendChild(h('p', { class: 'foot muted', style: 'text-align:center' }, 'Tes données sont enregistrées sur ce téléphone uniquement. Le scan photo et le coach ne sont disponibles que dans l’appli Claude.'));
    const pill = h('span', { class: 'pill' });
    const btns = tabs.map(t => h('button', { type: 'button', 'aria-current': t[0] === tab ? 'page' : null, onclick: () => { if (tab !== t[0]) { tab = t[0]; renderMain(); window.scrollTo(0, 0); } } }, icon(t[2]), h('span', null, t[1])));
    const bar = h('nav', { class: 'tabbar', 'aria-label': 'Navigation principale' }, h('div', { class: 'in glass' }, pill, btns));
    $app.append(bar);
    if (d.corps && (tab === 'today' || tab === 'corps')) $app.append(h('button', { class: 'fab glass press', type: 'button', 'aria-label': 'Ajouter', onclick: () => J.menuAjout(d) }, icon('plus')));
    if (lastPill) { pill.style.transition = 'none'; pill.style.width = lastPill.w + 'px'; pill.style.transform = 'translateX(' + lastPill.x + 'px)'; }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const i = tabs.findIndex(t => t[0] === tab); const b = btns[i]; if (!b) return;
      const x = b.offsetLeft - 5, w = b.offsetWidth;
      pill.style.transition = '';
      if (lastPill && (lastPill.x !== x) && !reduced()) { pill.classList.add('moving'); setTimeout(() => pill.classList.remove('moving'), 380); }
      pill.style.width = w + 'px'; pill.style.transform = 'translateX(' + x + 'px)'; lastPill = { x, w };
    }));
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
    const err = h('div', { class: 'err', role: 'alert' });
    let close;
    const save = h('button', { class: 'btn', type: 'button', onclick: async () => {
      if (!r.isTouched() && !A.poids) { err.textContent = 'Indique ton poids.'; return; }
      A.poids = Math.round(r.value() / k * 100) / 100; const body = { date: dt.value || dayId(), poids: A.poids }; if (t.isTouched()) body.tour = t.value();
      const avant = S.profil ? E.jalons(S.pesees, S.profil.poids, S.profil.cible || S.profil.poids, 0).length : 0;
      try {
        await put('pesees', body.date, body); close(); toast('Pesée enregistrée');
        const apres = S.profil ? E.jalons(S.pesees.filter(x => x.date !== body.date).concat([body]), S.profil.poids, S.profil.cible || S.profil.poids, 0).length : 0;
        if (window.CapSon) window.CapSon.jouer(apres > avant ? 'objectif' : 'valider');
      } catch (e) { err.textContent = 'Échec, réessaie.'; }
    } }, 'Enregistrer');
    close = sheet('Nouvelle pesée', [h('p', { class: 'muted sub' }, 'Le matin, à jeun, après les toilettes, une fois par semaine.'), r.el, t.el, h('label', { class: 'field', for: 'p-date' }, 'Date', dt), err, save]);
  }
  // ---------- Programme
  function viewProg(d) {
    const out = [largeTitle('Programme', d.prog && d.prog.seances.length ? d.prog.seances.length + ' séance' + (d.prog.seances.length > 1 ? 's' : '') + ' par semaine' : null)];
    const pr = d.prog;
    if (!pr || !pr.ok) { out.push(h('div', { class: 'note' }, 'Il manque des réponses pour construire ton programme.'), h('button', { class: 'btn', type: 'button', onclick: () => startOnboarding(Object.assign({}, S.profil), { only: missingSteps(), fresh: true }) }, 'Compléter')); return out; }
    if (!pr.seances.length) { out.push(h('div', { class: 'note' }, pr.note), h('button', { class: 'btn tinted', type: 'button', onclick: () => editStep('jours') }, 'Ajouter des séances')); return out; }
    const a = d.adapt;
    out.push(h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', null, a.faites + ' / ' + a.prevues), h('span', null, 'Séances faites (14 j)')),
      h('div', { class: 'stat' }, h('b', null, a.taux === null ? '—' : fr(a.taux * 100) + ' %'), h('span', null, 'Régularité mesurée')),
      h('div', { class: 'stat' }, h('b', null, (d.p.minutes || 0) + ' min'), h('span', null, 'Par séance'))));
    if (a.conseil) out.push(h('div', { class: 'alert info' }, icon('info'), h('div', null, h('h3', null, 'Ajustement suggéré'), h('p', null, a.conseil))));
    const today = new Date().getDay();
    out.push(section('Ta semaine', null, pr.planning.map(pl => {
      const se = pr.seances.find(s => s.cle === pl.seance);
      const det = h('details', { class: 'session', open: pl.jour === today ? true : null },
        h('summary', null, h('div', { style: 'flex:1;min-width:0' }, h('div', { class: 'day' }, pl.jourNom + (pl.jour === today ? ' · aujourd’hui' : '')), h('div', { style: 'font-weight:600;font-size:17px' }, se.nom), h('div', { class: 'foot muted' }, se.objectif + ' · ' + se.duree + ' min')), icon('chev', 'chev')),
        h('div', { class: 'ex', style: 'grid-template-columns:1fr' }, h('small', { style: 'grid-column:auto' }, 'Échauffement : ' + se.echauffement)),
        se.exercices.map(e => h('div', { class: 'ex' }, h('b', null, e.nom), h('span', { class: 'r' }, e.type === 'cardio' ? e.reps : e.series + ' × ' + e.reps), h('small', null, (e.repos ? 'Repos ' + e.repos + ' s · ' : '') + 'Alternative : ' + e.alternative))),
        h('div', { style: 'padding:12px 16px 16px' }, h('button', { class: 'btn small tinted', type: 'button', style: 'width:100%', onclick: () => logSeance(se) }, icon('check'), 'J’ai fait cette séance')));
      return det;
    })));
    out.push(section('Progression', null, h('div', { class: 'note' }, pr.progression)));
    const logs = S.seances.slice().sort((x, y) => y.date.localeCompare(x.date)).slice(0, 10);
    out.push(section('Séances enregistrées', null, logs.length ? h('div', { class: 'panel flush' }, logs.map(l => h('div', { class: 'cell' }, h('span', { class: 'lbl' }, l.nom, h('small', null, fmtD(l.date) + ' · ressenti ' + ({ facile: 'facile', ok: 'correct', dur: 'très dur' }[l.ressenti] || '—'))), h('button', { class: 'round press', type: 'button', style: 'width:32px;height:32px;background:var(--fill)', 'aria-label': 'Supprimer', onclick: () => confirmDel(() => remove('seances', l.id)) }, icon('trash'))))) : h('p', { class: 'foot muted', style: 'margin:0 4px' }, 'Aucune séance enregistrée : aucune progression n’est affichée.')));
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
  function viewArgent(d) {
    const out = [largeTitle('Argent', null, h('button', { class: 'btn small', type: 'button', style: 'background:var(--money)', onclick: () => addMouvement(d) }, icon('plus'), 'Mouvement'))];
    const f = d.fin;
    if (!f || !f.ok) { out.push(h('div', { class: 'note' }, f ? f.message : 'Données manquantes.'), h('button', { class: 'btn', type: 'button', onclick: () => startOnboarding(Object.assign({}, S.profil), { only: missingSteps(), fresh: true }) }, 'Compléter')); return out; }
    // Trois niveaux
    const n = f.niveaux;
    out.push(section(null, null, h('div', { class: 'panel flush tiers' },
      h('div', { class: 'tier' }, h('span', { class: 'dot', style: 'background:var(--ink)' }, icon('star')), h('div', null, h('h3', null, 'Le rêve'), h('p', null, h('b', null, n.reve.titre), ' · ', n.reve.texte))),
      h('div', { class: 'tier' }, h('span', { class: 'dot', style: 'background:var(--money)' }, icon('target')), h('div', null, h('h3', null, 'L’étape en cours'), h('p', null, h('b', null, n.intermediaire.titre), ' · ', n.intermediaire.texte), h('div', { class: 'bar', style: 'margin-top:8px' }, h('i', { style: 'width:' + Math.max(0, Math.min(100, f.actuelle / n.intermediaire.montant * 100)) + '%;background:var(--money)' })), h('p', { class: 'foot muted', style: 'margin-top:4px' }, eur(Math.max(0, f.actuelle)) + ' sur ' + eur(n.intermediaire.montant)))),
      h('div', { class: 'tier' }, h('span', { class: 'dot', style: 'background:var(--accent)' }, icon('bolt')), h('div', null, h('h3', null, 'Prochaine action'), h('p', null, n.action.texte)))),
      h('p', { class: 'foot muted', style: 'margin:0 4px' }, 'Réussir une action te rapproche du rêve. Elle ne le garantit pas.')));
    // Chiffres
    out.push(h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', { style: 'color:' + (f.capacite < 0 ? 'var(--bad)' : 'var(--ink)') }, nombre('fin-cap', f.capacite, eur)), h('span', null, 'Capacité / mois')),
      h('div', { class: 'stat' }, h('b', null, nombre('fin-act', f.actuelle, eur)), h('span', null, 'Épargne actuelle')),
      h('div', { class: 'stat' }, h('b', null, f.moisAuRythme ? fr(f.moisAuRythme / 12, 1) + ' ans' : '—'), h('span', null, f.moisAuRythme ? 'Au rythme actuel' : 'Pas de date calculable'))));
    const fz = { atteint: ['Objectif atteint', 'good'], atteignable: ['Atteignable pour ' + d.p.reveAnnee + ' avec ta capacité actuelle', 'good'], ecart: ['Il manque ' + eur(f.ecartMensuel) + ' par mois pour ' + d.p.reveAnnee, 'warn'], impossible_en_l_etat: ['Aucune date calculable en l’état', 'bad'] }[f.faisabilite];
    out.push(h('div', null, h('span', { class: 'chip ' + fz[1] }, fz[0])));
    out.push(section('Épargne', 'Trait plein : ce que tu as vraiment mis de côté. Pointillés : projection sans rendement ni imprévu.', h('div', { class: 'panel chart' }, moneyChart(d), h('div', { class: 'legend' }, h('span', null, h('i', { style: 'border-color:var(--money)' }), 'Réel'), f.capacite > 0 ? h('span', null, h('i', { class: 'dash', style: 'border-color:var(--money)' }), 'Projection') : null, f.hypothese && f.hypothese.capacite > 0 ? h('span', null, h('i', { class: 'dot', style: 'border-color:var(--faint)' }), 'Hypothèse ' + eur(f.hypothese.revenu) + '/mois') : null)), h('div', { style: 'margin:0 4px' }, howBtn('Capacité et calendrier', f.calcul))));
    // Budget
    out.push(section('Budget mensuel', null, h('div', { class: 'panel flush' },
      cellKV('Revenus nets', eur(d.p.revenus)), cellKV('Dépenses fixes', '− ' + eur(d.p.fixes)), cellKV('Dépenses variables', '− ' + eur(d.p.variables)), cellKV('Remboursements', '− ' + eur(d.p.remboursements || 0)), cellKV('Reste pour épargner', eur(f.capacite))),
      h('button', { class: 'link', style: 'margin:0 4px;text-align:left', type: 'button', onclick: () => editStep('variables') }, 'Modifier mes dépenses')));
    // Coût du rêve
    const r = f.reve;
    out.push(section('Coût réel du projet', 'Estimations datées du ' + E.REF.date + '. Confiance indiquée pour chaque ligne.', h('div', { class: 'panel flush' }, r.lignes.map(l => h('div', { class: 'cell' }, h('span', { class: 'lbl' }, l[0], h('small', null, l[2] + ' · confiance ' + l[3])), h('span', { class: 'val num', style: 'color:var(--ink)' }, eur(l[1]))))),
      r.revenuNecessaire ? h('div', { class: 'note' }, h('b', null, 'Revenu net nécessaire ≈ ' + eur(r.revenuNecessaire) + ' / mois. '), r.revenuNote) : null,
      r.note ? h('p', { class: 'foot muted', style: 'margin:0 4px' }, r.note) : null));
    if (f.notesLegales.length) out.push(section('À ton âge', null, h('div', { class: 'panel' }, f.notesLegales.map(t => h('p', { class: 'sub' }, t)))));
    const imp = d.issues.filter(i => i.domaine === 'argent');
    if (imp.length) out.push(section('À vérifier', null, imp.map(i => issueView(i, champ => editStep(STEP_BY_FIELD[champ] || champ)))));
    const mv = S.epargne.slice().sort((a, b) => b.date.localeCompare(a.date));
    out.push(section('Mouvements enregistrés', null, mv.length ? h('div', { class: 'panel flush' }, mv.map(m => h('div', { class: 'cell' }, h('span', { class: 'lbl' }, m.note || (m.montant >= 0 ? 'Dépôt' : 'Retrait'), h('small', null, fmtD(m.date))), h('span', { class: 'val num', style: 'color:' + (m.montant >= 0 ? 'var(--money)' : 'var(--bad)') }, (m.montant >= 0 ? '+' : '−') + eur(Math.abs(m.montant))), h('button', { class: 'round press', type: 'button', style: 'width:32px;height:32px;background:var(--fill)', 'aria-label': 'Supprimer', onclick: () => confirmDel(() => remove('epargne', m.id)) }, icon('trash'))))) : h('p', { class: 'foot muted', style: 'margin:0 4px' }, 'Aucun mouvement. Ajoute chaque somme mise de côté (ou retirée) pour suivre le réel.')));
    return out;
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
  function viewReglages(d) {
    const p = d.p; const out = [largeTitle('Réglages')];
    const lbl = (arr, v) => { const x = arr.find(a => a[0] === v); return x ? x[1] : '—'; };
    const v = (val, unit) => has(val) ? (typeof val === 'number' ? fr(val, val % 1 ? 1 : 0) : val) + (unit ? ' ' + unit : '') : 'Non renseigné';
    const row = (t, val, step, ic, col) => h('button', { class: 'cell', type: 'button', onclick: () => editStep(step) }, ic ? h('span', { class: 'ico', style: 'background:' + col }, icon(ic)) : null, h('span', { class: 'lbl' }, t), h('span', { class: 'val' }, val), icon('chev', 'chev'));
    out.push(section(null, null, h('div', { class: 'cap' }, 'Général'), h('div', { class: 'panel flush' },
      row('Modules suivis', (p.domaines || []).map(x => x === 'corps' ? 'Corps' : 'Argent').join(' + '), 'domaines', 'target', 'var(--ink)'),
      row('Âge', v(p.age, 'ans'), 'age', 'cal', '#8E8E93'),
      row('Temps libre', v(p.tempsLibre, 'h / sem'), 'tempsLibre', 'clock', '#8E8E93'))));
    if (d.corps) {
      const OBJ = [['perdre', 'Perdre du gras'], ['maintenir', 'Maintenir'], ['prendre', 'Prendre du muscle']];
      out.push(section(null, null, h('div', { class: 'cap' }, 'Corps'), h('div', { class: 'panel flush' },
        row('Sexe', lbl([['H', 'Homme'], ['F', 'Femme']], p.sexe), 'sexe', 'body', 'var(--body)'),
        row('Taille', v(p.taille, 'cm'), 'taille', 'body', 'var(--body)'),
        row('Poids de départ', v(p.poids, 'kg'), 'poids', 'scale', 'var(--body)'),
        row('Objectif', lbl(OBJ, p.objectif), 'objectif', 'target', 'var(--body)'),
        p.objectif !== 'maintenir' ? row('Poids visé', v(p.cible, 'kg'), 'cible', 'target', 'var(--body)') : null,
        p.objectif !== 'maintenir' ? row('Délai', lbl(DELAIS, p.delaiSem), 'delai', 'cal', 'var(--body)') : null,
        p.objectif !== 'maintenir' ? row('Rythme', has(p.rythme) ? fr(p.rythme, 2) + ' kg/sem' : 'Recommandé', 'faisabilite', 'chart', 'var(--body)') : null,
        row('Activité quotidienne', lbl([['assis', 'Assise'], ['mixte', 'Mixte'], ['physique', 'Physique']], p.activite), 'activite', 'walk', 'var(--body)'),
        row('Autre sport', v(p.autreSport, 'séance(s)/sem'), 'autreSport', 'bolt', 'var(--body)'))));
      out.push(section(null, null, h('div', { class: 'cap' }, 'Programme'), h('div', { class: 'panel flush' },
        row('Niveau', lbl([['debutant', 'Débutant'], ['intermediaire', 'Intermédiaire'], ['avance', 'Avancé']], p.niveau), 'niveau', 'dumbbell', '#FF9F0A'),
        row('Séances par semaine', v(p.jours), 'jours', 'dumbbell', '#FF9F0A'),
        p.jours > 0 ? row('Durée', v(p.minutes, 'min'), 'minutes', 'clock', '#FF9F0A') : null,
        p.jours > 0 ? row('Lieu', lbl([['salle', 'Salle'], ['maison', 'Maison']], p.lieu), 'lieu', 'home', '#FF9F0A') : null,
        row('Contraintes', (p.contraintes || []).map(c => ({ douleur: 'Douleur', sante: 'Santé', aucune: 'Aucune' })[c]).join(', ') || '—', 'contraintes', 'heart', '#FF9F0A'))));
    }
    if (d.corps && window.CapJournal) out.push(window.CapJournal.reglagesNutrition(d));
    if (d.argent) {
      const RV = REVES.map(r => [r.v, r.t]);
      out.push(section(null, null, h('div', { class: 'cap' }, 'Argent'), h('div', { class: 'panel flush' },
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
    const sonOn = !!(window.CapSon && window.CapSon.actif());
    out.push(section(null, null, h('div', { class: 'cap' }, 'Préférences'), h('div', { class: 'panel flush' },
      h('button', { class: 'cell', type: 'button', role: 'switch', 'aria-checked': String(sonOn), onclick: () => { window.CapSon.regler(!sonOn); window._keepScroll = true; renderMain(); } },
        h('span', { class: 'lbl' }, 'Sons de l’interface', h('small', null, 'Sept sons feutrés : sélection, étape, validation, programme terminé, objectif, erreur, ouverture. Désactivés par défaut. Sur iPhone, ils respectent le mode silencieux (iOS 17 et plus).')),
        h('span', { class: 'switch' + (sonOn ? ' on' : '') }, h('i')))),
      h('p', { class: 'foot muted', style: 'margin:0 16px' }, 'Safari sur iPhone ne permet pas aux sites de faire vibrer le téléphone : pas de retour haptique ici.')));
    out.push(section(null, null, h('div', { class: 'cap' }, 'Sources et méthode'), h('div', { class: 'panel' },
      h('p', { class: 'sub' }, 'Les calculs sont faits par des formules fixes, testées, jamais par une IA. Ce sont des estimations, pas des garanties. Cap ne remplace ni un médecin ni un conseiller financier.'),
      h('ul', { class: 'calc' }, Object.keys(E.REF.sources).map(k => h('li', { class: 'foot' }, E.REF.sources[k]))))));
    out.push(section(null, null, h('div', { class: 'cap' }, 'Données'), h('div', { class: 'panel flush' },
      h('button', { class: 'cell', type: 'button', onclick: () => startOnboarding(Object.assign({}, S.profil), { fresh: true }) }, h('span', { class: 'lbl' }, 'Refaire le questionnaire'), icon('chev', 'chev')),
      h('button', { class: 'cell danger', type: 'button', onclick: () => resetAll() }, h('span', { class: 'lbl' }, 'Effacer toutes mes données'))),
      h('p', { class: 'foot muted', style: 'margin:0 16px' }, 'Tes données de santé et de budget restent dans ton espace Claude privé. Rien n’est envoyé ailleurs.')));
    return out;
  }
  function resetAll() {
    const close = sheet('Tout effacer ?', [h('p', { class: 'muted sub' }, 'Profil, pesées, journal alimentaire, aliments, recettes, photos, séances et mouvements d’épargne seront supprimés. C’est définitif.'),
      h('button', { class: 'btn', style: 'background:var(--bad)', type: 'button', onclick: async () => {
        try {
          const jobs = [];
          S.pesees.forEach(r => jobs.push(remove('pesees', r.id))); S.epargne.forEach(r => jobs.push(remove('epargne', r.id))); S.seances.forEach(r => jobs.push(remove('seances', r.id)));
          Object.keys(S.journaux).forEach(k => jobs.push(remove('repas', k))); jobs.push(remove('actions', weekKey())); jobs.push(remove('prefs', 'main'));
          S.perso.forEach(r => jobs.push(remove('aliments', r.id))); S.recettes.forEach(r => jobs.push(remove('recettes', r.id)));
          S.photos.forEach(r => { jobs.push(remove('photos', r.id)); if (window.CapJournal) jobs.push(window.CapJournal.supprimerAsset(r.assetId)); });
          await Promise.all(jobs); await remove('profil', 'main'); S.profil = null; store.del('cap-draft'); close(); OB = null; refresh();
        } catch (e) { toast('Échec, réessaie'); }
      } }, 'Tout effacer'), h('button', { class: 'btn secondary', type: 'button', onclick: () => close() }, 'Annuler')]);
  }

  // ================================================================ Démarrage
  let booted = false;
  const boot = () => { if (booted) return; booted = true; refresh(); };
  window.CapUI = { sparkle, nombre, derniers, h, add, icon, fr, eur, kg, wfmt, unite, LB, dayId, fmtD, weekKey, toast, sheet, Ruler, choices, money, cellKV, largeTitle: (...a) => largeTitle(...a), section: (...a) => section(...a), howBtn: (...a) => howBtn(...a), issueView, confirmDel, addPesee: () => addPesee(), editStep, startOnboarding, missingSteps, editerObjectifs, derive, put, remove, saveProfil, savePrefs, uid, S, STEP_BY_FIELD, has, reduced, vib, db: () => db, setTab: t => { tab = t; renderMain(); window.scrollTo(0, 0); }, refresh: () => { window._keepScroll = true; refresh(); } };
  const start = () => (async () => {
    const use = window.claude && window.claude.use;
    if (!use) { loadLocal(); syncMem(); boot(); return; }
    const timer = setTimeout(() => { if (!booted) { db = null; loadLocal(); syncMem(); boot(); } }, 10000);
    try { db = await window.claude.use('db'); } catch (e) { db = null; }
    if (!db) { clearTimeout(timer); loadLocal(); syncMem(); boot(); return; }
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
    db.doc('prefs/main').onSnapshot(s => { S.prefs = Object.assign({ favoris: [] }, s.exists ? s.data() : {}); if (booted && !OB) { window._keepScroll = true; refresh(); } }, onErr);
    db.collection('actions').doc(weekKey()).onSnapshot(s => { S.actions = s.exists ? s.data() : { done: {} }; if (booted && !OB) { window._keepScroll = true; refresh(); } }, onErr);
  })();
  // Démarre après le chargement de tous les modules (journal.js, ai.js)
  const go = () => { intro(); if (window.CapAI) window.CapAI.init().then(() => { if (booted && !OB) { window._keepScroll = true; refresh(); } }); if (window.CapJournal) window.CapJournal.init(); start(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else setTimeout(go, 0);
})();
