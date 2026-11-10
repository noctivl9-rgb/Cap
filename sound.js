/* Cap — signature sonore « acier feutré ». Sons originaux synthétisés en direct (Web Audio API), aucun fichier tiers.
 * Désactivés par défaut, joués uniquement après une action de l'utilisateur.
 * iPhone : navigator.audioSession.type = 'ambient' (Safari 16.4+) pour respecter le mode silencieux
 * et ne pas couper la musique en cours. Le retour haptique web (navigator.vibrate) n'existe pas sur iPhone :
 * il n'est utilisé que là où le navigateur le propose (Android). */
(function () {
  'use strict';
  const KEY = 'cap-sons';
  let ctx = null;
  const actif = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
  function contexte() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) { /* non pris en charge */ }
    ctx = new AC();
    return ctx;
  }
  // Frappe métallique : partiels inharmoniques (rapports d'une petite lame d'acier), extinctions différentes,
  // filtre passe-bas pour garder un timbre feutré. Pas de bip : chaque son a une attaque, une matière, une queue.
  function frappe(c, t, f0, gain, dest, opts) {
    opts = opts || {};
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = opts.lp || 5200; lp.Q.value = 0.4; lp.connect(dest);
    const ratios = opts.ratios || [1, 2.756, 5.404], amps = opts.amps || [1, .32, .1], dec = opts.dec || [.26, .14, .07];
    ratios.forEach((r, k) => {
      if (!(gain * amps[k] > 0.0002)) return; // partiel inaudible : ignoré (une rampe exponentielle ne peut pas viser 0)
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f0 * r;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain * amps[k], t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dec[k]);
      o.connect(g); g.connect(lp); o.start(t); o.stop(t + dec[k] + 0.02);
    });
    if ((opts.clic === undefined ? 0.012 : opts.clic) > 0) transitoire(c, t, opts.clic === undefined ? 0.012 : opts.clic, 3400, dest);
  }
  // Transitoire d'attaque : 4 ms de bruit filtré, donne la sensation de contact
  function transitoire(c, t, gain, freq, dest) {
    const n = Math.floor(c.sampleRate * 0.006), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(); src.buffer = b;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 2.5;
    const g = c.createGain(); g.gain.value = gain;
    src.connect(bp); bp.connect(g); g.connect(dest); src.start(t);
  }
  // Corps chaud : sinus grave à attaque lente, sous la signature « programme »
  function corps(c, t, f, gain, dur, dest) {
    const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
  }
  // Souffle : bruit en bande étroite qui s'ouvre, pour l'entrée dans une expérience
  function souffle(c, t, dest) {
    const n = Math.floor(c.sampleRate * 0.3), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.6;
    f.frequency.setValueAtTime(420, t); f.frequency.exponentialRampToValueAtTime(1900, t + 0.26);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.028, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    src.connect(f); f.connect(g); g.connect(dest); src.start(t); src.stop(t + 0.32);
  }
  const SONS = {
    // Sélection : contact feutré, presque un toucher (25 ms)
    selection: (c, t, d) => { transitoire(c, t, 0.02, 2600, d); frappe(c, t, 2093, 0.012, d, { amps: [1, .2, 0], dec: [.03, .02, .01], clic: 0 }); },
    // Fin d'étape : même famille, un peu plus présente
    etape: (c, t, d) => { frappe(c, t, 1760, 0.02, d, { dec: [.09, .05, .03], clic: 0.008 }); },
    // Validation importante : frappe d'acier nette, queue courte
    valider: (c, t, d) => { frappe(c, t, 1175, 0.05, d); },
    // Programme terminé : deux frappes en quinte sur un corps grave
    programme: (c, t, d) => { corps(c, t, 196, 0.022, 0.7, d); frappe(c, t + 0.02, 784, 0.045, d, { dec: [.5, .25, .1] }); frappe(c, t + 0.16, 1175, 0.04, d, { dec: [.55, .26, .1] }); },
    // Objectif atteint : quarte montante, brillante mais retenue
    objectif: (c, t, d) => { frappe(c, t, 988, 0.04, d, { dec: [.3, .16, .08] }); frappe(c, t + 0.09, 1319, 0.04, d, { dec: [.42, .2, .09] }); },
    // Erreur : note grave qui retombe, étouffée, jamais stridente
    erreur: (c, t, d) => {
      const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.14);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(lp); lp.connect(g); g.connect(d); o.start(t); o.stop(t + 0.18);
    },
    // Ouverture : souffle puis frappe aiguë douce
    ouverture: (c, t, d) => { souffle(c, t, d); frappe(c, t + 0.15, 1568, 0.025, d, { dec: [.3, .15, .07], clic: 0.006 }); }
  };
  const VIBRATIONS = { selection: 4, etape: 6, valider: 10, programme: [10, 60, 14], objectif: [8, 50, 12], erreur: [18, 40, 18], ouverture: 8 };
  const S = {
    actif,
    regler(on) { try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* stockage indisponible */ } if (on) S.jouer('valider'); },
    jouer(nom) {
      if (!actif() || !SONS[nom]) return false;
      try { if (navigator.vibrate) navigator.vibrate(VIBRATIONS[nom]); } catch (e) { /* non pris en charge */ }
      const c = contexte(); if (!c) return false;
      const go = () => { const m = c.createGain(); m.gain.value = 1; m.connect(c.destination); SONS[nom](c, c.currentTime + 0.01, m); };
      if (c.state === 'suspended') c.resume().then(go, () => {}); else go();
      return true;
    },
    // Rendu WAV (16 bits) d'un son, pour l'écouter hors de l'appli
    async wav(nom) {
      const c = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100); SONS[nom](c, 0.01, c.destination);
      const d = (await c.startRendering()).getChannelData(0); let fin = 0; for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > 0.0005) fin = i;
      const n = Math.min(d.length, fin + 2205), buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
      w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
      for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i] * 6)) * 32767, true); // +15,6 dB pour l'écoute
      return Array.from(new Uint8Array(buf));
    },
    // Pour les tests : rend un son hors ligne et renvoie durée et crête
    async rendre(nom) {
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OAC) return null;
      const c = new OAC(1, 44100 * 1, 44100); SONS[nom](c, 0.01, c.destination);
      const b = await c.startRendering(), d = b.getChannelData(0);
      let crete = 0, fin = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > crete) crete = a; if (a > 0.001) fin = i; }
      return { crete, duree: fin / 44100 };
    }
  };
  window.CapSon = S;
})();
