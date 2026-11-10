/* Cap — identité graphique. Monogramme : un C (le cadre, la maîtrise) traversé par un chevron qui monte
 * et s'en échappe (la progression, l'ambition). Un espace négatif sépare toujours les deux formes.
 * Matières : noir mat, argent brossé, blanc métallique. Toutes les versions sont des SVG générés ici. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CapLogo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  let n = 0;
  // Géométrie (grille 128) : C de rayon 41, épaisseur 17, ouverture à droite ; chevron épaisseur 11, angle 64°
  const C_PATH = 'M100.2 41.5A41 41 0 1 0 100.2 86.5';
  const CHEV = 'M55 86L80 46L105 86';
  function defs(id, brushed) {
    return '<defs>' +
      '<linearGradient id="sv' + id + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#F6F7F9"/><stop offset=".2" stop-color="#C3C7CD"/><stop offset=".36" stop-color="#FCFCFD"/>' +
        '<stop offset=".52" stop-color="#9AA0A7"/><stop offset=".7" stop-color="#E3E5E9"/><stop offset=".86" stop-color="#B0B5BC"/><stop offset="1" stop-color="#E9EBEE"/></linearGradient>' +
      '<linearGradient id="wm' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#EEF0F3"/><stop offset="1" stop-color="#D5D8DD"/></linearGradient>' +
      '<linearGradient id="mt' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B2B2E"/><stop offset=".5" stop-color="#18181A"/><stop offset="1" stop-color="#0C0C0D"/></linearGradient>' +
      '<linearGradient id="ed' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset=".35" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>' +
      '<mask id="ng' + id + '"><rect width="128" height="128" fill="#fff"/><path d="' + CHEV + '" fill="none" stroke="#000" stroke-width="23" stroke-linejoin="miter" stroke-miterlimit="10"/></mask>' +
      (brushed ? '<filter id="br' + id + '" filterUnits="userSpaceOnUse" x="0" y="0" width="128" height="128"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.9" numOctaves="2" seed="7" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .22 0" result="s"/><feComposite in="s" in2="SourceGraphic" operator="in" result="m"/><feBlend in="SourceGraphic" in2="m" mode="soft-light"/></filter>' : '') +
      '</defs>';
  }
  // modes : light (noir mat + argent), dark (argent + blanc métal), mono (couleur unie), icon (tuile noire)
  function mark(o) {
    o = o || {};
    const id = 'cl' + (++n), size = o.size || 64, mode = o.mode || 'light';
    const brushed = size >= 64 && mode !== 'mono';
    const f = brushed ? ' filter="url(#br' + id + ')"' : '';
    let body;
    if (mode === 'mono') {
      const col = o.color || 'currentColor';
      body = '<path d="' + C_PATH + '" fill="none" stroke="' + col + '" stroke-width="17" mask="url(#ng' + id + ')"/><path d="' + CHEV + '" fill="none" stroke="' + col + '" stroke-width="11" stroke-linejoin="miter"/>';
    } else if (mode === 'dark' || mode === 'icon') {
      body = '<g' + f + '><path class="lg-c" d="' + C_PATH + '" fill="none" stroke="url(#sv' + id + ')" stroke-width="17" mask="url(#ng' + id + ')"/></g>' +
        '<path class="lg-v" d="' + CHEV + '" fill="none" stroke="url(#wm' + id + ')" stroke-width="11" stroke-linejoin="miter"/>';
    } else {
      body = '<path class="lg-c" d="' + C_PATH + '" fill="none" stroke="url(#mt' + id + ')" stroke-width="17" mask="url(#ng' + id + ')"/>' +
        (size >= 40 ? '<path class="lg-edge" d="' + C_PATH + '" fill="none" stroke="url(#ed' + id + ')" stroke-width="17" mask="url(#ng' + id + ')"/>' : '') +
        '<path d="' + CHEV + '" fill="none" stroke="#4A4E55" stroke-width="12.6" stroke-linejoin="miter"/>' +
        '<g' + f + '><path class="lg-v" d="' + CHEV + '" fill="none" stroke="url(#sv' + id + ')" stroke-width="11" stroke-linejoin="miter"/></g>';
    }
    if (mode === 'icon') {
      body = '<rect width="128" height="128" rx="' + (o.square ? 0 : 28.5) + '" fill="url(#mt' + id + ')"/><rect x=".5" y=".5" width="127" height="127" rx="28" fill="none" stroke="#fff" stroke-opacity=".08"/>' +
        '<g transform="translate(17 17) scale(.734)">' + body + '</g>';
    }
    return '<svg class="cap-logo ' + (o.cls || '') + '" viewBox="0 0 128 128" width="' + size + '" height="' + size + '" role="img" aria-label="Cap">' + defs(id, brushed) + body + '</svg>';
  }
  function wordmark(o) {
    o = o || {};
    const col = o.color || 'currentColor';
    return '<span class="cap-word" style="color:' + col + '">' + mark({ size: o.markSize || 26, mode: o.mode || 'light' }) + '<span>CAP</span></span>';
  }
  return { mark, wordmark, C_PATH, CHEV };
});
