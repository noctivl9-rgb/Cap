/* Cap — Progression visuelle : photos du corps, privées et facultatives.
 * Principes : aucune retouche, aucune analyse automatique (ni masse grasse, ni poids, ni santé), rien n'est envoyé à une IA.
 * Stockage : dans l'appli Claude, fichiers privés de l'artefact (assets) ; ailleurs, IndexedDB de cet appareil (jamais synchronisé).
 * Métadonnées (collection « photos ») : { v: 2, date, categorie: face|profil|dos|libre, note?, poids?, tour?, assetId?|localId?, url?,
 *   largeur, hauteur, octets, empreinte (SHA-256 du fichier enregistré), ts, suppression? ('en_attente' si le fichier n'a pas pu être effacé) }.
 * Contrôles à l'entrée : type image (JPEG, PNG, HEIC/HEIF, WebP), 25 Mo maximum, 200 px minimum ; enregistrement en JPEG ≤ 1600 px.
 * Migration : les photos v1 { date, assetId, url } sont lues comme catégorie « libre » (normaliser) et réécrites en v2 une fois (migrer). */
(function () {
  'use strict';
  const U = () => window.CapUI;
  const CATS = [['face', 'Face'], ['profil', 'Profil'], ['dos', 'Dos'], ['libre', 'Libre']];
  const NOM_CAT = { face: 'Face', profil: 'Profil', dos: 'Dos', libre: 'Libre' };
  let assets = null, filtre = 'toutes', migre = false;
  const urls = {}; // localId → URL d'objet (cache d'affichage)

  function normaliser(doc) {
    const o = Object.assign({}, doc);
    if (!NOM_CAT[o.categorie]) o.categorie = 'libre';
    if (typeof o.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) o.date = (o.ts || '').slice(0, 10) || '1970-01-01';
    if (o.note != null) o.note = String(o.note).slice(0, 140);
    ['poids', 'tour'].forEach(k => { if (o[k] != null && !(typeof o[k] === 'number' && o[k] > 0 && o[k] < 400)) delete o[k]; });
    o.v = 2;
    return o;
  }
  // ---------- Stockage local (IndexedDB) ----------
  function idb() {
    return new Promise((ok, ko) => {
      if (!window.indexedDB) { ko(new Error('indexeddb')); return; }
      const r = indexedDB.open('cap-photos', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('f');
      r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error);
    });
  }
  async function idbOp(mode, fn) { const db = await idb(); return new Promise((ok, ko) => { const tx = db.transaction('f', mode); const st = tx.objectStore('f'); const r = fn(st); tx.oncomplete = () => ok(r && r.result); tx.onerror = () => ko(tx.error); }); }
  const local = {
    put: (id, blob) => idbOp('readwrite', st => st.put(blob, id)),
    get: id => idbOp('readonly', st => st.get(id)),
    del: id => idbOp('readwrite', st => st.delete(id))
  };
  function stockage() { return assets ? 'claude' : 'appareil'; }
  async function initAssets() { if (window.claude && window.claude.use) { try { assets = await window.claude.use('assets'); } catch (e) { assets = null; } if (assets && U()) U().refresh(); } }

  // Recadrage léger (côté long ≤ 1600 px) et compression JPEG : aucune modification du contenu de l'image.
  const TYPES = /^image\/(jpeg|png|webp|heic|heif)$/i, MAX_OCTETS = 25 * 1024 * 1024, MIN_PX = 200;
  function verifierFichier(f) {
    if (!f) return 'Aucun fichier.';
    if (f.type && !TYPES.test(f.type)) return 'Ce fichier n’est pas une photo prise en charge (JPEG, PNG, HEIC, WebP).';
    if (f.size > MAX_OCTETS) return 'Photo trop lourde (25 Mo maximum).';
    return null;
  }
  async function compresser(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error('illisible')); i.src = url; });
      if (Math.min(img.naturalWidth, img.naturalHeight) < MIN_PX) throw new Error('petite');
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise(ok => c.toBlob(b => ok(b || file), 'image/jpeg', 0.86));
      return { blob, largeur: c.width, hauteur: c.height };
    } finally { URL.revokeObjectURL(url); }
  }
  async function empreinte(blob) {
    try { const buf = await blob.arrayBuffer(); const h = await crypto.subtle.digest('SHA-256', buf); return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join(''); } catch (e) { return null; }
  }
  async function source(p) {
    if (p.localId) { if (urls[p.localId]) return urls[p.localId]; const b = await local.get(p.localId).catch(() => null); if (!b) return null; urls[p.localId] = URL.createObjectURL(b); return urls[p.localId]; }
    return p.url || (p.assetId ? '/_blob/' + p.assetId : null);
  }
  function img(p, cls) {
    const { h } = U();
    const el = h('img', { class: cls || '', alt: NOM_CAT[p.categorie] + ', ' + U().fmtD(p.date), loading: 'lazy', decoding: 'async' });
    source(p).then(s => { if (s) el.src = s; else el.alt = 'Fichier introuvable sur cet appareil'; });
    return el;
  }
  function liste() { return U().S.photos.filter(p => p.suppression !== 'en_attente').map(normaliser).sort((a, b) => b.date.localeCompare(a.date) || String(b.ts || '').localeCompare(String(a.ts || ''))); }
  async function migrer() {
    if (migre) return; migre = true;
    for (const p of U().S.photos.filter(x => x.suppression === 'en_attente')) { try { await supprimer(p); } catch (e) { /* réessayé à la prochaine ouverture */ } }
    const vieux = U().S.photos.filter(p => p.v !== 2);
    for (const p of vieux) { const n = normaliser(p); const id = n.id; delete n.id; try { await U().put('photos', id, n); } catch (e) { /* relu en v2 par normaliser */ } }
  }

  // ---------- Consentement (une fois, révocable dans Profil) ----------
  function consenti() { return !!(U().S.prefs || {}).photosCorps; }
  function consentement(suite) {
    const { h, sheet, savePrefs } = U();
    let close;
    const ou = stockage() === 'claude' ? 'dans ton espace Claude privé, comme fichiers de cette appli. Toi seul y as accès.' : 'sur cet appareil uniquement (stockage du navigateur). Elles ne sont ni synchronisées ni sauvegardées en ligne : exporte-les si tu changes d’appareil.';
    close = sheet('Photos de progression', [
      h('p', { class: 'sub' }, 'Des photos de ton corps, à toi seul, pour voir une évolution que la balance ne montre pas toujours. C’est facultatif.'),
      h('ul', { class: 'ph-regles' },
        h('li', null, 'Elles sont enregistrées ' + ou),
        h('li', null, 'Cap ne les modifie pas et ne les analyse pas : aucune estimation de masse grasse, de poids ou de santé.'),
        h('li', null, 'Aucune photo n’est envoyée à une IA ni partagée.'),
        h('li', null, 'Tu peux en télécharger une copie ou les supprimer définitivement à tout moment (Profil › Photos).')),
      h('button', { class: 'btn', type: 'button', onclick: async () => { try { await savePrefs({ photosCorps: { accepte: new Date().toISOString(), stockage: stockage() } }); close(); suite(); } catch (e) { U().toast('Échec, réessaie'); } } }, 'J’ai compris, continuer'),
      h('button', { class: 'btn text', type: 'button', onclick: () => close() }, 'Pas maintenant')]);
  }

  // ---------- Ajout ----------
  function ajouter() { if (!consenti()) { consentement(ajouter); return; } formulaire(); }
  function formulaire() {
    const { h, sheet, dayId, fr, toast, put, uid, S, choices } = U();
    const A = { categorie: null, fichier: null };
    const last = window.CapEngine.tendance(S.pesees).dernier;
    const ctx = { A, onChange: [], changed() { maj(); } };
    const err = h('div', { class: 'err', role: 'alert' });
    const apercu = h('div', { class: 'ph-apercu' }, h('p', { class: 'muted' }, 'Aucune photo choisie'));
    const choix = (label, capture, cls) => {
      const inp = h('input', { type: 'file', accept: 'image/*', capture: capture ? 'user' : null, class: 'sr', id: 'phc-' + (capture ? 'cam' : 'lib') });
      inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; if (!f) return; const pb = verifierFichier(f); err.textContent = pb || ''; if (pb) return; A.fichier = f; apercu.textContent = ''; const u = URL.createObjectURL(f); apercu.appendChild(h('img', { src: u, alt: 'Aperçu de la photo choisie' })); maj(); });
      return h('label', { class: 'btn ' + (cls || ''), for: inp.id, role: 'button', tabindex: '0', onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } } }, label, inp);
    };
    const dt = h('input', { id: 'ph-date', type: 'date', value: dayId(), max: dayId() });
    const note = h('input', { id: 'ph-note', maxlength: '140', placeholder: 'Facultatif : lumière, heure, ressenti' });
    let lierPoids = false;
    const poidsSw = last ? h('label', { class: 'ph-lien' }, h('input', { type: 'checkbox', id: 'ph-poids', onchange: e => { lierPoids = e.target.checked; } }), ' Associer ma pesée du ' + U().fmtD(last.date) + ' (' + U().wfmt(last.poids) + ')') : null;
    const save = h('button', { class: 'btn', type: 'button', disabled: true }, 'Enregistrer la photo');
    function maj() { save.disabled = !A.fichier || !A.categorie; }
    let close;
    save.addEventListener('click', async () => {
      save.disabled = true; save.textContent = 'Enregistrement…'; err.textContent = '';
      try {
        const c = await compresser(A.fichier), blob = c.blob;
        const doc = { v: 2, date: dt.value || dayId(), categorie: A.categorie, largeur: c.largeur, hauteur: c.hauteur, octets: blob.size, ts: new Date().toISOString() };
        const em = await empreinte(blob); if (em) doc.empreinte = em;
        if (note.value.trim()) doc.note = note.value.trim().slice(0, 140);
        if (lierPoids && last) { doc.poids = last.poids; if (last.tour) doc.tour = last.tour; }
        if (assets) { const r = await assets.upload(blob); doc.assetId = r.id; doc.url = r.url; }
        else { doc.localId = 'ph' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); await local.put(doc.localId, blob); }
        await put('photos', uid(), doc);
        close(); toast('Photo enregistrée'); if (window.CapSon) window.CapSon.jouer('valider');
      } catch (e) { err.textContent = e && e.message === 'petite' ? 'Photo trop petite (200 px minimum).' : e && e.message === 'illisible' ? 'Cette photo ne peut pas être lue ici. Essaie en JPEG.' : 'La photo n’a pas pu être enregistrée. ' + (assets ? 'Vérifie ta connexion et réessaie.' : 'Le stockage de cet appareil est peut-être plein ou bloqué (navigation privée).'); save.textContent = 'Enregistrer la photo'; maj(); }
    });
    close = sheet('Nouvelle photo', [apercu, h('div', { class: 'ph-choix' }, choix('Prendre une photo', true), choix('Choisir dans la galerie', false, 'secondary')),
      h('div', { class: 'field' }, 'Angle', choices(ctx, 'categorie', CATS.map(c => ({ v: c[0], t: c[1] })), { grid: true })),
      h('label', { class: 'field', for: 'ph-date' }, 'Date', dt), h('label', { class: 'field', for: 'ph-note' }, 'Note', note), poidsSw,
      h('p', { class: 'foot muted' }, 'Même lumière, même heure et même distance d’une fois à l’autre rendent la comparaison honnête.'), err, save], { focus: false });
  }

  // ---------- Détail, export, suppression ----------
  async function telecharger(p) {
    try {
      let blob = p.localId ? await local.get(p.localId) : null;
      if (!blob) { const s = await source(p); if (!s) throw new Error('absent'); blob = await (await fetch(s)).blob(); }
      const nom = 'cap-photo-' + p.date + '-' + p.categorie + '.jpg';
      const dl = window.claude && window.claude.use ? await window.claude.use('downloads').catch(() => null) : null;
      if (dl) { await dl.save({ filename: nom, data: blob }); return; }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nom; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    } catch (e) { U().toast('Téléchargement impossible ici.'); }
  }
  // Renvoie true si le fichier est effacé (ou déjà absent), false s'il reste peut-être (réseau) : la fiche est alors gardée « en attente ».
  async function supprimerFichier(p) {
    let ok = true;
    if (p.localId) { try { await local.del(p.localId); } catch (e) { ok = false; } if (urls[p.localId]) { URL.revokeObjectURL(urls[p.localId]); delete urls[p.localId]; } }
    if (p.assetId) { if (!assets) ok = false; else { try { await assets.delete(p.assetId); } catch (e) { ok = !!(e && (e.code === 'not_found' || /not.?found/i.test(e.message || ''))); } } }
    return ok;
  }
  async function supprimer(p) {
    const ok = await supprimerFichier(p);
    if (ok) { await U().remove('photos', p.id); return; }
    const n = normaliser(p); const id = n.id; delete n.id; n.suppression = 'en_attente';
    await U().put('photos', id, n);
    throw new Error('attente');
  }
  function detail(p) {
    const { h, sheet, fmtD, wfmt, fr, remove, toast } = U();
    let close;
    const conf = h('div', { class: 'ph-conf', hidden: true }, h('p', { class: 'sub' }, 'Supprimer définitivement cette photo ? Le fichier et ses informations seront effacés. Cette action est irréversible.'),
      h('button', { class: 'btn danger', type: 'button', onclick: async () => { try { await supprimer(p); close(); toast('Photo supprimée'); } catch (e) { toast('Échec, réessaie'); } } }, 'Supprimer définitivement'));
    close = sheet(NOM_CAT[p.categorie] + ' · ' + fmtD(p.date), [img(p, 'ph-grand'),
      h('dl', { class: 'ph-meta' }, p.poids ? [h('dt', null, 'Pesée associée'), h('dd', null, wfmt(p.poids) + (p.tour ? ' · tour de taille ' + fr(p.tour, 1) + ' cm' : ''))] : null, p.note ? [h('dt', null, 'Note'), h('dd', null, p.note)] : null,
        h('dt', null, 'Stockage'), h('dd', null, p.localId ? 'Sur cet appareil' : 'Espace Claude privé')),
      h('div', { class: 'ia-actions' }, h('button', { class: 'btn secondary', type: 'button', onclick: () => telecharger(p) }, 'Télécharger'), h('button', { class: 'btn secondary danger-t', type: 'button', onclick: () => { conf.hidden = false; } }, 'Supprimer…')), conf], { focus: false });
  }

  // ---------- Comparaison avant / après ----------
  function comparer(ph) {
    const { h, sheet, fmtD } = U();
    const cat = filtre !== 'toutes' ? filtre : (ph[0] || {}).categorie;
    const l = ph.filter(p => p.categorie === cat);
    if (l.length < 2) { U().toast('Il faut deux photos du même angle pour comparer.'); return; }
    let a = l[l.length - 1], b = l[0];
    const zone = h('div', { class: 'ph-comp' });
    const sel = (val, on) => { const s = h('select', { 'aria-label': on === 'a' ? 'Photo avant' : 'Photo après' }, l.map(p => h('option', { value: p.id, selected: p.id === val.id ? true : null }, fmtD(p.date)))); s.addEventListener('change', () => { const p = l.find(x => x.id === s.value); if (on === 'a') a = p; else b = p; dessiner(); }); return s; };
    const range = h('input', { type: 'range', min: '0', max: '100', value: '50', class: 'ph-range', 'aria-label': 'Glisser pour comparer avant et après' });
    function dessiner() {
      zone.textContent = '';
      const haut = h('div', { class: 'ph-haut' }, img(b, 'ph-c'));
      zone.append(img(a, 'ph-c'), haut, h('span', { class: 'ph-tag g' }, 'Avant · ' + fmtD(a.date)), h('span', { class: 'ph-tag d' }, 'Après · ' + fmtD(b.date)));
      const maj = () => { haut.style.clipPath = 'inset(0 0 0 ' + range.value + '%)'; };
      range.oninput = maj; maj();
    }
    sheet('Comparer · ' + NOM_CAT[cat], [h('div', { class: 'grid2' }, h('label', { class: 'field' }, 'Avant', sel(a, 'a')), h('label', { class: 'field' }, 'Après', sel(b, 'b'))), zone, range,
      h('p', { class: 'foot muted' }, 'Les photos sont affichées telles quelles. Une différence de lumière ou de posture peut changer l’impression plus que le corps lui-même.')], { focus: false });
    dessiner();
  }

  // ---------- Vue ----------
  function view(d) {
    const { h, icon, fmtD } = U();
    if (!migre) setTimeout(migrer, 0); // jamais pendant le rendu : l'écriture relance un rendu
    const tout = liste(), out = [];
    const right = h('button', { class: 'btn small', type: 'button', onclick: ajouter }, icon('plus'), 'Photo');
    out.push(h('header', { class: 'lt' }, h('div', null, h('h1', null, 'Photos')), right));
    if (!tout.length) {
      const puce = (ic, t) => h('li', null, U().icon(ic), h('span', null, t));
      out.push(h('div', { class: 'vide ph-vide v2' }, h('span', { class: 'ph-vide-i', 'aria-hidden': 'true' }, U().icon('camera')), h('p', { class: 'vide-t' }, 'Observer une évolution prend des semaines.'),
        h('ul', { class: 'ph-puces' }, puce('cal', '1 photo par mois'), puce('image', 'Même angle, même lumière'), puce('person', 'Jamais une note sur ton corps')),
        h('button', { class: 'btn', type: 'button', onclick: ajouter }, 'Ajouter ma première photo'),
        h('p', { class: 'foot muted' }, stockage() === 'claude' ? 'Privées · espace Claude' : 'Privées · sur cet appareil uniquement')));
      return out;
    }
    const cats = CATS.filter(c => tout.some(p => p.categorie === c[0]));
    if (filtre !== 'toutes' && !cats.some(c => c[0] === filtre)) filtre = 'toutes';
    if (cats.length > 1) out.push(U().segments([['toutes', 'Toutes']].concat(cats), filtre, k => { filtre = k; U().refresh(); }, 'Angle', 'phf'));
    const ph = filtre === 'toutes' ? tout : tout.filter(p => p.categorie === filtre);
    const parCat = {}; tout.forEach(p => { parCat[p.categorie] = (parCat[p.categorie] || 0) + 1; });
    if (Object.keys(parCat).some(k => parCat[k] >= 2)) out.push(h('button', { class: 'btn secondary ph-cmp', type: 'button', onclick: () => comparer(filtre === 'toutes' ? tout.filter(p => parCat[p.categorie] >= 2) : ph) }, 'Comparer deux dates'));
    const mois = {}; ph.forEach(p => { const k = p.date.slice(0, 7); (mois[k] = mois[k] || []).push(p); });
    Object.keys(mois).sort().reverse().forEach(k => {
      const titre = new Date(k + '-15T12:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      out.push(h('section', { class: 'ph-mois' }, h('h2', { class: 'ph-mois-t' }, titre.charAt(0).toUpperCase() + titre.slice(1)),
        h('div', { class: 'ph-grille' }, mois[k].map(p => h('button', { class: 'ph-vign', type: 'button', onclick: () => detail(p), 'aria-label': NOM_CAT[p.categorie] + ', ' + fmtD(p.date) + (p.note ? ', ' + p.note : '') }, img(p), h('span', null, NOM_CAT[p.categorie] + ' · ' + fmtD(p.date)))))));
    });
    out.push(h('p', { class: 'foot muted' }, (stockage() === 'claude' ? 'Privées, dans ton espace Claude.' : 'Privées, sur cet appareil uniquement, non synchronisées.') + ' Aucune analyse automatique.'));
    return out;
  }
  // Pour Profil : état et actions globales
  function reglages() {
    const { h, savePrefs, toast } = U();
    const n = U().S.photos.length, c = (U().S.prefs || {}).photosCorps;
    return { n, consenti: !!c, stockage: stockage(),
      toutTelecharger: async () => { for (const p of liste()) await telecharger(p); },
      retirerConsentement: async () => { try { await savePrefs({ photosCorps: null }); toast('Consentement retiré. Tes photos restent jusqu’à ce que tu les supprimes.'); } catch (e) { toast('Échec, réessaie'); } },
      toutSupprimer: async () => { let reste = 0; for (const p of liste()) { try { await supprimer(p); } catch (e) { reste++; } } toast(reste ? reste + ' photo(s) n’ont pas pu être effacées : réessaie connecté.' : 'Photos supprimées'); } };
  }
  const API = { view, ajouter, normaliser, supprimerFichier, supprimer, verifierFichier, reglages, CATS, init: initAssets };
  if (typeof module === 'object' && module.exports) module.exports = API;
  else { window.CapPhotos = API; if (document.readyState !== 'loading') setTimeout(initAssets, 0); else document.addEventListener('DOMContentLoaded', initAssets); }
})();
