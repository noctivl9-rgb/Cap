/* Cap — identité « La Tangente » (V3, 10/11/2026).
 * Un anneau d'obsidienne en forme de C dont le bras supérieur quitte le cercle par sa tangente : une lame d'aluminium
 * satiné qui monte vers la droite. Sortir du cercle, changer de cap : ta prochaine version. Lisible à 16 px.
 * Matières : obsidienne mate (moitié basse), aluminium satiné brossé (moitié haute), blanc céramique sur fond sombre.
 * Le métal est éclairé (feSpecularLighting sur le biseau) au lieu de simples dégradés gris ; filtres retirés sous 48 px.
 * API inchangée : mark({ size, mode: light|dark|mono|icon, square, cls, color }) et wordmark({ markSize, mode, color }). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CapLogo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  let n = 0;
  // Géométrie (grille 128) : anneau r = 33, épaisseur 17, parcouru de 40° à 230° (sens horaire à l'écran) ;
  // en haut à gauche, le trait quitte le cercle par sa tangente : une lame droite, en aluminium, qui monte vers la droite.
  // Une fente de 4 sépare l'anneau (obsidienne) de la lame (métal) : le moment où l'on change de cap.
  const CX = 52, CY = 74, R = 33, EP = 17, FENTE = 4, LAME = 56;
  const rad = d => d * Math.PI / 180, f = v => v.toFixed(2);
  const P = d => [CX + R * Math.cos(rad(d)), CY + R * Math.sin(rad(d))];
  const [x0, y0] = P(40), [x1, y1] = P(230);
  const U = [-Math.sin(rad(230)), Math.cos(rad(230))]; // tangente sortante (haut-droite)
  const ANNEAU = 'M' + f(x0) + ' ' + f(y0) + 'A' + R + ' ' + R + ' 0 0 1 ' + f(x1) + ' ' + f(y1);
  const LAME_D = 'M' + f(x1 + U[0] * FENTE) + ' ' + f(y1 + U[1] * FENTE) + 'L' + f(x1 + U[0] * (FENTE + LAME)) + ' ' + f(y1 + U[1] * (FENTE + LAME));
  // Lame dessinée dans son repère (axe horizontal), puis tournée : le brossage suit ainsi son axe.
  // Extrémité taillée en biseau : l'arête haute dépasse, la lame « pointe » vers l'avant.
  const ANGLE = Math.atan2(U[1], U[0]) * 180 / Math.PI, h2 = EP / 2;
  const LAME_LOCALE = 'M0 ' + (-h2) + 'L' + f(LAME + EP * 0.55) + ' ' + (-h2) + 'L' + LAME + ' ' + h2 + 'L0 ' + h2 + 'Z';
  const LAME_POSE = 'translate(' + f(x1 + U[0] * FENTE) + ' ' + f(y1 + U[1] * FENTE) + ') rotate(' + f(ANGLE) + ')';
  // Recentrage : l'ensemble (≈ 73 × 112) est centré et ramené à ~100 de haut dans la grille de 128
  const CADRE = 'translate(64 64) scale(.9) translate(-47.15 -59.57)';
  function defs(id, riche) {
    return '<defs>' +
      // Obsidienne : noir profond, très légère remontée de lumière vers le haut-gauche
      '<radialGradient id="ob' + id + '" gradientUnits="userSpaceOnUse" cx="40" cy="50" r="90"><stop offset="0" stop-color="#2E2E33"/><stop offset=".45" stop-color="#16161A"/><stop offset="1" stop-color="#070708"/></radialGradient>' +
      // Céramique : blanc chaud, ombre douce vers le bas-droite
      '<radialGradient id="ce' + id + '" gradientUnits="userSpaceOnUse" cx="38" cy="48" r="95"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#F1F0EC"/><stop offset="1" stop-color="#D9D7D1"/></radialGradient>' +
      // Aluminium satiné : bandes anisotropes alignées sur la direction d'élévation
      '<linearGradient id="al' + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="-9" x2="70" y2="9"><stop offset="0" stop-color="#8E939A"/><stop offset=".18" stop-color="#C9CDD2"/><stop offset=".34" stop-color="#EEF0F2"/><stop offset=".46" stop-color="#B4B9BF"/><stop offset=".62" stop-color="#DADDE1"/><stop offset=".78" stop-color="#A3A8AF"/><stop offset="1" stop-color="#E4E6E9"/></linearGradient>' +
      // Liseré du biseau
      '<linearGradient id="li' + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="-9" x2="0" y2="9"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".7"/><stop offset=".5" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity=".25"/></linearGradient>' +
      (riche ?
        // Brossage : bruit étiré dans le sens des bandes, fondu en lumière douce
        '<filter id="br' + id + '" filterUnits="userSpaceOnUse" x="-12" y="-24" width="96" height="48"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.75" numOctaves="2" seed="11" result="t"/>' +
        '<feColorMatrix in="t" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .28 0" result="s"/><feComposite in="s" in2="SourceGraphic" operator="in" result="m"/><feBlend in="SourceGraphic" in2="m" mode="soft-light" result="b"/>' +
        // Éclairage du biseau : la forme devient un relief, une lumière rasante haut-gauche crée le reflet spéculaire
        '<feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="h"/><feSpecularLighting in="h" surfaceScale="3.2" specularConstant=".85" specularExponent="22" lighting-color="#FFFFFF" result="sp"><fePointLight x="-40" y="-60" z="90"/></feSpecularLighting>' +
        '<feComposite in="sp" in2="SourceAlpha" operator="in" result="spc"/><feComposite in="b" in2="spc" operator="arithmetic" k1="0" k2="1" k3=".55" k4="0"/></filter>' +
        // Obsidienne : seulement un reflet de bord, la surface reste mate
        '<filter id="ma' + id + '" filterUnits="userSpaceOnUse" x="0" y="0" width="128" height="128"><feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="h"/><feSpecularLighting in="h" surfaceScale="2.4" specularConstant=".5" specularExponent="30" lighting-color="#E8EAEE" result="sp"><fePointLight x="-30" y="-50" z="70"/></feSpecularLighting>' +
        '<feComposite in="sp" in2="SourceAlpha" operator="in" result="spc"/><feComposite in="SourceGraphic" in2="spc" operator="arithmetic" k1="0" k2="1" k3=".28" k4="0"/></filter>'
        : '') +
      '</defs>';
  }
  function corps(id, mode, riche, col) {
    if (mode === 'mono') return '<g transform="' + CADRE + '"><path d="' + ANNEAU + '" fill="none" stroke="' + col + '" stroke-width="' + EP + '"/><path d="' + LAME_LOCALE + '" fill="' + col + '" transform="' + LAME_POSE + '"/></g>';
    const fBas = riche ? ' filter="url(#ma' + id + ')"' : '', fHaut = riche ? ' filter="url(#br' + id + ')"' : '';
    const bas = mode === 'dark' || mode === 'icon' ? 'url(#ce' + id + ')' : 'url(#ob' + id + ')';
    return '<g transform="' + CADRE + '"><g class="lg-bas"' + fBas + '><path d="' + ANNEAU + '" fill="none" stroke="' + bas + '" stroke-width="' + EP + '"/></g>' +
      '<g class="lg-haut" transform="' + LAME_POSE + '"><g class="lg-lame"><path d="' + LAME_LOCALE + '" fill="' + (riche ? 'url(#al' + id + ')' : mode === 'light' ? '#7C828A' : '#C3C7CC') + '"' + fHaut + '/>' +
      (riche ? '<path d="' + LAME_LOCALE + '" fill="none" stroke="url(#li' + id + ')" stroke-width="1"/>' : '') + '</g></g></g>';
  }
  function mark(o) {
    o = o || {};
    const id = 'cl' + (++n), size = o.size || 64, mode = o.mode || 'light';
    const riche = size >= 48 && mode !== 'mono';
    let body = corps(id, mode, riche, o.color || 'currentColor');
    if (mode === 'icon') {
      body = '<rect width="128" height="128" rx="' + (o.square ? 0 : 28.5) + '" fill="url(#ob' + id + ')"/>' +
        (o.square ? '' : '<rect x=".5" y=".5" width="127" height="127" rx="28" fill="none" stroke="#FFFFFF" stroke-opacity=".07"/>') +
        '<g transform="translate(22 22) scale(.65625)">' + body + '</g>';
    }
    return '<svg class="cap-logo ' + (o.cls || '') + '" viewBox="0 0 128 128" width="' + size + '" height="' + size + '" role="img" aria-label="Cap">' + defs(id, riche || mode === 'icon') + body + '</svg>';
  }
  function wordmark(o) {
    o = o || {};
    const col = o.color || 'currentColor';
    return '<span class="cap-word" style="color:' + col + '">' + mark({ size: o.markSize || 26, mode: o.mode || 'light' }) + '<span>Cap</span></span>';
  }
  // Silhouette du logo en data-URL : sert de masque au reflet de lumière (CSS mask-image)
  function masque() {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">' + corps('m', 'mono', false, '#000') + '</svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }
  return { mark, wordmark, masque, geometrie: { CX, CY, R, EP, FENTE, LAME, ANNEAU, LAME_D, LAME_LOCALE, LAME_POSE, CADRE } };
});
