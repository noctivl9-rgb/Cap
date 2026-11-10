/* Cap — kit visuel : anneaux, tuiles, courbes miniatures, donut, barres, bouton d'information.
 * Chaque composant reçoit des valeurs réelles ; sans donnée, il affiche un état vide explicite (jamais un faux chiffre).
 * Le SVG est construit ici à partir de nombres uniquement (aucun texte utilisateur dans innerHTML). */
(function () {
  'use strict';
  const U = () => window.CapUI;
  const num = v => (typeof v === 'number' && isFinite(v) ? v : null);
  const ns = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, kids) { const e = document.createElementNS(ns, tag); Object.keys(attrs || {}).forEach(k => e.setAttribute(k, attrs[k])); (kids || []).forEach(k => k && e.appendChild(k)); return e; }

  // Anneau de progression. valeur/max réels ; « depasse » si valeur > max (anneau plein + couleur d'alerte).
  function anneau(o) {
    const { h } = U();
    const t = o.taille || 72, ep = o.epaisseur || 8, r = (t - ep) / 2, c = 2 * Math.PI * r;
    const v = num(o.valeur), m = num(o.max), vide = v === null || !m;
    const p = vide ? 0 : Math.max(0, Math.min(1, v / m)), depasse = !vide && v > m * 1.001;
    const fond = svg('circle', { cx: t / 2, cy: t / 2, r, fill: 'none', 'stroke-width': ep, class: 'an-fond' });
    const arc = svg('circle', { cx: t / 2, cy: t / 2, r, fill: 'none', 'stroke-width': ep, 'stroke-linecap': 'round', class: 'an-arc', 'stroke-dasharray': c.toFixed(1), 'stroke-dashoffset': (c * (1 - p)).toFixed(1), transform: 'rotate(-90 ' + t / 2 + ' ' + t / 2 + ')' });
    const s = svg('svg', { viewBox: '0 0 ' + t + ' ' + t, width: t, height: t, 'aria-hidden': 'true' }, [fond, arc]);
    const label = o.label + ' : ' + (vide ? 'pas de donnée' : (o.texte || Math.round(v)) + (o.unite ? ' ' + o.unite : '') + ' sur ' + Math.round(m) + (o.unite ? ' ' + o.unite : ''));
    const el = h(o.onclick ? 'button' : 'div', { class: 'an' + (o.cls ? ' ' + o.cls : '') + (depasse ? ' depasse' : '') + (vide ? ' vide' : ''), type: o.onclick ? 'button' : null, onclick: o.onclick || null, role: o.onclick ? null : 'img', 'aria-label': label, style: '--an:' + (o.couleur || 'var(--ink)') + ';--t:' + t + 'px' },
      h('span', { class: 'an-svg' }), h('span', { class: 'an-c' }, h('b', { class: 'num' }, vide ? '–' : (o.centre !== undefined ? o.centre : Math.round(p * 100) + '%')), o.sousCentre ? h('small', null, o.sousCentre) : null),
      o.legende ? h('span', { class: 'an-l' }, o.legende) : null);
    el.querySelector('.an-svg').appendChild(s);
    return el;
  }
  // Courbe miniature à partir de vraies valeurs [{x (date ISO), y}] ; null si moins de 2 points
  function courbe(points, o) {
    o = o || {};
    const pts = (points || []).filter(p => num(p.y) !== null);
    if (pts.length < 2) return null;
    const W = o.l || 120, H = o.h || 36, xs = pts.map(p => Date.parse(p.x)), ys = pts.map(p => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1, y0 = Math.min(...ys), y1 = Math.max(...ys);
    const X = x => 2 + (x1 === x0 ? 0 : (x - x0) / (x1 - x0)) * (W - 4), Y = y => H - 3 - (y1 === y0 ? 0.5 : (y - y0) / (y1 - y0)) * (H - 6);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + X(xs[i]).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join('');
    const last = pts.length - 1;
    return svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'spark', 'aria-hidden': 'true' }, [
      svg('path', { d: d + 'L' + X(xs[last]).toFixed(1) + ' ' + H + 'L' + X(xs[0]).toFixed(1) + ' ' + H + 'Z', class: 'spark-aire' }),
      svg('path', { d, class: 'spark-l', fill: 'none' }),
      svg('circle', { cx: X(xs[last]).toFixed(1), cy: Y(ys[last]).toFixed(1), r: 3, class: 'spark-p' })]);
  }
  // Tuile cliquable : un chiffre, un libellé, un visuel facultatif
  function tuile(o) {
    const { h, icon } = U();
    return h(o.onclick ? 'button' : 'div', { class: 'tu mod-' + (o.mod || 'neutre') + (o.large ? ' large' : '') + (o.vide ? ' vide' : ''), type: o.onclick ? 'button' : null, onclick: o.onclick || null, 'aria-label': o.aria || null },
      h('span', { class: 'tu-h' }, o.icone ? h('span', { class: 'tu-i' }, icon(o.icone)) : null, h('span', { class: 'tu-t' }, o.titre), o.onclick ? icon('chev', 'tu-chev') : null),
      h('b', { class: 'tu-v num' }, o.valeur), o.sous ? h('small', { class: 'tu-s' }, o.sous) : null, o.visuel || null);
  }
  // Donut de répartition (segments réels {nom, valeur})
  function donut(segs, o) {
    o = o || {};
    const tot = segs.reduce((s, x) => s + x.valeur, 0); if (!tot) return null;
    const t = o.taille || 112, ep = o.epaisseur || 14, r = (t - ep) / 2, c = 2 * Math.PI * r;
    const COUL = o.couleurs || ['var(--ink)', '#6B6F76', '#9A9EA5', '#C3C6CB', '#DADCE0', '#E8E9EC'];
    let acc = 0;
    const arcs = segs.map((s, i) => { const l = s.valeur / tot * c, e = svg('circle', { cx: t / 2, cy: t / 2, r, fill: 'none', stroke: COUL[Math.min(i, COUL.length - 1)], 'stroke-width': ep, 'stroke-dasharray': Math.max(0, l - 1.5).toFixed(1) + ' ' + (c - Math.max(0, l - 1.5)).toFixed(1), 'stroke-dashoffset': (-acc).toFixed(1), transform: 'rotate(-90 ' + t / 2 + ' ' + t / 2 + ')' }); acc += l; return e; });
    return { svg: svg('svg', { viewBox: '0 0 ' + t + ' ' + t, width: t, height: t, 'aria-hidden': 'true', class: 'donut' }, arcs), couleurs: segs.map((s, i) => COUL[Math.min(i, COUL.length - 1)]) };
  }
  // Barres verticales (7 jours…) : [{l, v, cible?, actif?}]
  function barres(items, o) {
    const { h } = U(); o = o || {};
    const max = Math.max(o.max || 0, ...items.map(x => x.v || 0)) || 1;
    return h('div', { class: 'brs', role: 'img', 'aria-label': o.label || '' }, items.map(x => h('span', { class: 'br' + (x.actif ? ' actif' : '') + (x.v ? '' : ' nul') }, h('i', { style: 'height:' + Math.max(x.v ? 6 : 2, (x.v || 0) / max * 100) + '%' }), h('small', null, x.l))));
  }
  // Détail à la demande : petit bouton ⓘ qui ouvre une feuille
  function info(titre, contenu, label) {
    const { h, icon, sheet } = U();
    return h('button', { class: 'ib', type: 'button', 'aria-label': label || ('En savoir plus : ' + titre), onclick: e => { e.stopPropagation(); sheet(titre, [].concat(typeof contenu === 'function' ? contenu() : contenu).map(x => typeof x === 'string' ? h('p', { class: 'sub' }, x) : x), { focus: false }); } }, icon('info'));
  }
  // En-tête de section : titre court + action ou ⓘ
  function titre(t, extra) { const { h } = U(); return h('div', { class: 'kt' }, h('h2', null, t), extra || null); }
  window.CapKit = { anneau, courbe, tuile, donut, barres, info, titre };
})();
